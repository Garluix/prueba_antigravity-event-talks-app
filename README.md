# BigQuery Release Notes & X/Twitter Broadcaster

Aplicación web ligera construida con **Python Flask** y **HTML5, CSS3 y JavaScript Vanilla** (sin frameworks externos ni dependencias pesadas).

Permite consultar, explorar y filtrar en tiempo real las notas de versión oficiales de **Google Cloud BigQuery** directamente desde su [feed XML Atom oficial](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml), con soporte para selección de novedades individuales, previsualización en vivo y redacción para publicación directa en **X (Twitter)**.

---

## Características Principales

1. **Lectura y Parseo en Tiempo Real**:
   - Conexión directa y segura con el feed Atom XML oficial de Google Cloud.
   - Clasificación por categorías oficiales de GCP:
     - Features (Nuevas funcionalidades)
     - Changes (Cambios de comportamiento)
     - Announcements (Anuncios de plataforma)
     - Fixed (Correcciones de errores)
     - Deprecated (Funcionalidades obsoletas)
     - Security (Actualizaciones de seguridad)
   - Normalización de hipervínculos con `target="_blank" rel="noopener noreferrer"` y resolución de rutas relativas a `cloud.google.com`.

2. **Temas Visuales (Claro, Oscuro y Drácula)**:
   - Soporte para selector de temas en la cabecera:
     - **Modo Claro**: Estilo Google Cloud Console.
     - **Modo Oscuro**: Paleta slate de alto contraste para baja fatiga visual.
     - **Modo Drácula**: Tema de alto contraste basado en la especificación oficial de Dracula Theme.
   - Persistencia automática de la preferencia del usuario en `localStorage`.

3. **Panel de Estadísticas y Métricas KPI**:
   - Tarjetas métricas interactivas con el conteo de novedades por categoría.
   - Filtro instantáneo al hacer clic sobre cualquier tarjeta KPI.

4. **Botón de Refresco Bajo Demanda**:
   - Botón interactivo con icono de rotación continua (*spinner*).
   - Actualización dinámica vía API (`/api/feed?force=1`) sin recarga de página.
   - Caché en memoria inteligente (TTL de 5 minutos) con bypass bajo demanda.

5. **Compositor y Previsualizador para X / Twitter**:
   - Selección interactiva de cualquier actualización.
   - Borrador automático con control de límite de 280 caracteres (teniendo en cuenta la regla de 23 caracteres por URL de Twitter).
   - Mockup visual del tweet que replica la interfaz de X en tiempo real.
   - Contador de caracteres con barra de progreso y alerta de límite.
   - Selector rápido de hashtags (`#BigQuery`, `#GoogleCloud`, `#DataEngineering`, `#SQL`, `#GenAI`).
   - Botón directo para abrir el Web Intent oficial de Twitter y botón de copiado al portapapeles.

6. **Búsqueda Dinámica y Filtrado**:
   - Búsqueda en tiempo real con debounce para optimizar el rendimiento.
   - Atajo de teclado: presiona `/` para enfocar la búsqueda.
   - Vistas conmutables: Cronología (por fecha) o Tarjetas (grilla).

---

## Requisitos del Sistema

- **Python 3.8 o superior**
- Administrador de paquetes `pip`
- Navegador web moderno (Microsoft Edge, Google Chrome, Mozilla Firefox)

---

## Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/Garluix/prueba_antigravity-event-talks-app.git
cd prueba_antigravity-event-talks-app
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Iniciar el servidor
```bash
python app.py
```

Abre tu navegador en:
```
http://127.0.0.1:5000
```

---

## Pruebas Automatizadas

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

## Estructura del Proyecto

```
bq-releases-notes/
├── app.py                 # Backend Flask: consulta HTTP, parseo Atom XML, caché y API
├── test_app.py            # Suite de pruebas automatizadas
├── requirements.txt       # Dependencias mínimas (Flask, requests)
├── .gitignore             # Exclusión de archivos temporales y entornos virtuales
├── README.md              # Documentación técnica en español
├── templates/
│   └── index.html         # Plantilla HTML5 con selector de tema Claro/Oscuro/Drácula
└── static/
    ├── css/
    │   └── style.css      # Sistema de diseño con variables CSS para temas Claro, Oscuro y Drácula
    └── js/
        └── app.js         # Lógica Vanilla JS: temas, delegación de eventos, búsqueda y compositor
```
