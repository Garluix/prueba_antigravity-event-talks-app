# 🚀 BigQuery Release Notes & X/Twitter Broadcaster

Aplicación web ligera, moderna y de alto rendimiento construida con **Python Flask** y **HTML5, CSS3 y JavaScript Vanilla** (sin frameworks pesados ni dependencias innecesarias).

Permite consultar, explorar y filtrar en tiempo real las notas de versión oficiales de **Google Cloud BigQuery** directamente desde su [feed XML Atom oficial](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml), con la capacidad de seleccionar cualquier novedad específica y redactar/publicar un tweet directamente en **X (Twitter)**.

---

## ✨ Características Principales

1. **Lectura y Parseo en Tiempo Real**:
   - Conexión directa y segura con el feed Atom XML oficial de Google Cloud.
   - Desglose inteligente de cada fecha en novedades atómicas clasificadas por categoría:
     - ✨ **Features** (Nuevas funcionalidades)
     - 🔄 **Changes** (Cambios de comportamiento)
     - 📢 **Announcements** (Anuncios oficiales)
     - 🛡️ **Fixed** (Correcciones de errores)
     - ⚠️ **Deprecated** (Características obsoletas)
     - 🔒 **Security** (Actualizaciones de seguridad)
   - Normalización de enlaces con `target="_blank" rel="noopener noreferrer"` y resolución de rutas relativas a `cloud.google.com`.

2. **Panel de Estadísticas y Métricas KPI**:
   - Tarjetas métricas interactivas con el conteo exacto de novedades por categoría.
   - Filtro instantáneo al hacer clic sobre cualquier tarjeta KPI.

3. **Botón de Refresco Bajo Demanda con Spinner Animado**:
   - Botón interactivo con icono de rotación suave (*smooth spinner*).
   - Actualización dinámica vía API (`/api/feed?force=1`) sin necesidad de recargar la página.
   - Caché en memoria inteligente (TTL de 5 minutos) con anulación instantánea al pulsar refrescar.

4. **Compositor y Previsualizador de Tweets para X / Twitter**:
   - Selecciona cualquier tarjeta de actualización para cargarla en el compositor lateral.
   - **Borrador inteligente pre-generado**: redacta el tweet respetando el límite de 280 caracteres, incluyendo categoría, fecha, resumen, hashtags relevantes (`#BigQuery`, `#GoogleCloud`) y enlace a la documentación oficial.
   - **Vista previa realista de X**: muestra exactamente cómo lucirá tu post antes de publicarlo.
   - **Contador interactivo de caracteres**: barra de progreso dinámica con alertas visuales (verde, naranja y rojo si se supera el límite).
   - **Chips de Hashtags rápidos**: agrega o quita etiquetas con un solo clic (`#BigQuery`, `#GoogleCloud`, `#DataEngineering`, `#SQL`, `#GenAI`).
   - **Publicación directa**: abre el Web Intent oficial de Twitter (`https://twitter.com/intent/tweet?text=...`) en una nueva pestaña.
   - **Copiado al portapapeles**: botón de un clic con notificación toast.

5. **Búsqueda Dinámica y Filtrado Rápido**:
   - Búsqueda en tiempo real con optimización *debounce* para evitar sobrecarga de renderizado.
   - Atajo de teclado: presiona `/` en cualquier momento para enfocar la barra de búsqueda.
   - Selector de vistas: **Cronología** (agrupada por fecha) o **Tarjetas** (grilla moderna).

6. **Arquitectura Limpia (Cero Código Basura)**:
   - Delegación de eventos en el DOM para máximo rendimiento y cero fugas de memoria.
   - Expresiones regulares pre-compiladas en el backend Python para velocidad de parseo en microsegundos.
   - Diseño CSS responsivo adaptable a pantallas de escritorio, tablets y móviles.

---

## 🛠️ Requisitos Previos

- **Python 3.8 o superior**
- Administrador de paquetes `pip`

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/Garluix/prueba_antigravity-event-talks-app.git
cd prueba_antigravity-event-talks-app
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Ejecutar la aplicación
```bash
python app.py
```

Abre tu navegador en:
```
http://127.0.0.1:5000
```

---

## 🧪 Pruebas Automatizadas

El proyecto incluye un script de validación que prueba las rutas del servidor, los activos estáticos y el endpoint de parseo del feed:

```bash
python test_app.py
```

Salida esperada:
```
[OK] GET / returned 200 OK
[OK] GET /static/css/style.css returned 200 OK
[OK] GET /static/js/app.js returned 200 OK
[OK] GET /api/feed returned 200 OK: 30 entries, 56 updates
ALL TESTS PASSED SUCCESSFULLY!
```

---

## 📂 Estructura del Proyecto

```
bq-releases-notes/
├── app.py                 # Backend Flask: consulta HTTP, parseo Atom XML, caché y API
├── test_app.py            # Suite de pruebas automatizadas
├── requirements.txt       # Dependencias mínimas (Flask, requests)
├── .gitignore             # Exclusión de archivos temporales y entornos virtuales
├── README.md              # Documentación completa en español
├── templates/
│   └── index.html         # Plantilla HTML5 semántica y accesible
└── static/
    ├── css/
    │   └── style.css      # Sistema de diseño moderno, animaciones y diseño responsivo
    └── js/
        └── app.js         # Lógica Vanilla JS: delegación de eventos, debounce y compositor
```

---

## 📄 Licencia

Desarrollado como solución para la visualización y difusión de notas de versión de Google Cloud BigQuery.
