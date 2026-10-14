"""
BigQuery Release Notes Web App
Backend Flask optimizado para consulta, parseo y cache del feed de BigQuery.
"""

import os
import re
import html
import time
from datetime import datetime
import xml.etree.ElementTree as ET
import requests
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Configuraciones
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_TTL_SECONDS = 300  # 5 minutos de cache en memoria
HTTP_TIMEOUT = 12

# Regex pre-compiladas para máximo rendimiento
RE_H3_SPLIT = re.compile(r"<h3>(.*?)</h3>", re.IGNORECASE)
RE_REL_LINKS = re.compile(r'href=["\']/(?!/)([^"\']+)["\']', re.IGNORECASE)
RE_ANCHOR_TAG = re.compile(r"<a\s+([^>]+)>", re.IGNORECASE)
RE_HTML_TAGS = re.compile(r"<[^>]+>")
RE_WHITESPACE = re.compile(r"\s+")

# Estructura de cache optimizada
class FeedCache:
    def __init__(self):
        self.data = None
        self.last_fetched = 0

    def is_valid(self, ttl: int = CACHE_TTL_SECONDS) -> bool:
        return self.data is not None and (time.time() - self.last_fetched) < ttl

    def update(self, parsed_data):
        self.data = parsed_data
        self.last_fetched = time.time()

feed_cache = FeedCache()

def clean_and_normalize_html(raw_html: str) -> str:
    """Convierte links relativos a rutas de GCP y añade target='_blank'."""
    if not raw_html:
        return ""

    # Resuelve URLs relativas hacia cloud.google.com
    html_fixed = RE_REL_LINKS.sub(r'href="https://cloud.google.com/\1"', raw_html)

    # Añade atributos de seguridad a enlaces
    def inject_link_attrs(match):
        attrs = match.group(1)
        if "target=" not in attrs:
            attrs += ' target="_blank" rel="noopener noreferrer"'
        return f"<a {attrs}>"

    return RE_ANCHOR_TAG.sub(inject_link_attrs, html_fixed)

def strip_tags(html_str: str) -> str:
    """Extrae texto plano limpio a partir de un fragmento HTML."""
    if not html_str:
        return ""
    text_without_tags = RE_HTML_TAGS.sub(" ", html_str)
    decoded = html.unescape(text_without_tags)
    return RE_WHITESPACE.sub(" ", decoded).strip()

def parse_atom_feed(xml_text: str) -> dict:
    """Parsea el XML Atom oficial de BigQuery estructurando entradas y métricas."""
    root = ET.fromstring(xml_text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    title_node = root.find("atom:title", ns)
    feed_title = title_node.text.strip() if title_node is not None and title_node.text else "BigQuery Release Notes"

    updated_node = root.find("atom:updated", ns)
    feed_updated = updated_node.text.strip() if updated_node is not None and updated_node.text else ""

    entries_data = []
    category_counts = {
        "Feature": 0,
        "Change": 0,
        "Announcement": 0,
        "Fixed": 0,
        "Deprecated": 0,
        "Security": 0,
        "Other": 0
    }
    total_updates = 0

    for idx, entry in enumerate(root.findall("atom:entry", ns)):
        title_el = entry.find("atom:title", ns)
        entry_title = title_el.text.strip() if title_el is not None and title_el.text else f"Release {idx + 1}"

        entry_id_el = entry.find("atom:id", ns)
        entry_id = entry_id_el.text.strip() if entry_id_el is not None and entry_id_el.text else f"entry-{idx}"

        updated_el = entry.find("atom:updated", ns)
        updated_raw = updated_el.text.strip() if updated_el is not None and updated_el.text else ""

        # Enlace canónico de la versión
        entry_link = "https://docs.cloud.google.com/bigquery/docs/release-notes"
        for link_el in entry.findall("atom:link", ns):
            rel = link_el.attrib.get("rel", "alternate")
            href = link_el.attrib.get("href")
            if href and (rel == "alternate" or not entry_link):
                entry_link = href
                break

        content_el = entry.find("atom:content", ns)
        content_html = content_el.text or "" if content_el is not None else ""

        # Fragmenta el contenido en sub-actualizaciones por <h3>
        parts = RE_H3_SPLIT.split(content_html)
        items = []

        if len(parts) > 1:
            for sub_idx in range(1, len(parts), 2):
                raw_cat = parts[sub_idx].strip()
                cat = raw_cat.capitalize()
                raw_body = parts[sub_idx + 1].strip() if (sub_idx + 1) < len(parts) else ""
                clean_body = clean_and_normalize_html(raw_body)
                plain_body = strip_tags(clean_body)

                # Conteo estadístico
                if cat in category_counts:
                    category_counts[cat] += 1
                else:
                    category_counts["Other"] += 1

                sub_id = f"{entry_id}_sub_{sub_idx // 2}"
                items.append({
                    "id": sub_id,
                    "date": entry_title,
                    "category": cat,
                    "body_html": clean_body,
                    "plain_text": plain_body,
                    "link": entry_link
                })
                total_updates += 1
        else:
            clean_body = clean_and_normalize_html(content_html)
            plain_body = strip_tags(clean_body)
            category_counts["Other"] += 1
            items.append({
                "id": f"{entry_id}_sub_0",
                "date": entry_title,
                "category": "Update",
                "body_html": clean_body,
                "plain_text": plain_body,
                "link": entry_link
            })
            total_updates += 1

        entries_data.append({
            "id": entry_id,
            "title": entry_title,
            "updated": updated_raw,
            "link": entry_link,
            "items": items
        })

    return {
        "title": feed_title,
        "feed_updated": feed_updated,
        "total_entries": len(entries_data),
        "total_updates": total_updates,
        "stats": category_counts,
        "entries": entries_data
    }

def fetch_feed_data(force: bool = False):
    """Consulta el feed oficial en Google Cloud o devuelve la versión en caché."""
    if not force and feed_cache.is_valid():
        return feed_cache.data, False

    headers = {
        "User-Agent": "BigQueryReleaseNotesApp/2.0 (+https://cloud.google.com/bigquery)",
        "Accept": "application/atom+xml, application/xml, text/xml, */*"
    }

    try:
        response = requests.get(FEED_URL, headers=headers, timeout=HTTP_TIMEOUT)
        response.raise_for_status()
        parsed = parse_atom_feed(response.text)
        parsed["fetched_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        feed_cache.update(parsed)
        return parsed, True
    except Exception as exc:
        if feed_cache.data is not None:
            stale_data = dict(feed_cache.data)
            stale_data["warning"] = f"Mostrando datos en caché: {str(exc)}"
            return stale_data, False
        raise exc

@app.route("/")
def index():
    """Ruta principal."""
    return render_template("index.html")

@app.route("/api/feed")
def get_feed():
    """API endpoint para consultar o refrescar las notas de versión."""
    force = request.args.get("force", "").lower() in ["1", "true", "yes"]
    try:
        data, was_refreshed = fetch_feed_data(force=force)
        return jsonify({
            "success": True,
            "refreshed": was_refreshed,
            "data": data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"No se pudo obtener el feed de BigQuery: {str(e)}"
        }), 502

@app.route("/api/health")
def health():
    """Endpoint de estado del servicio."""
    return jsonify({
        "status": "healthy",
        "cache_active": feed_cache.data is not None,
        "timestamp": time.time()
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Iniciando BigQuery Release Notes en http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
