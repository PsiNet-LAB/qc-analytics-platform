# Analytics QC 2026: Plataforma de Control Psicométrico

[![HTML5](https://img.shields.io/badge/HTML5-Semántico-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Progresivo-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES5%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-AEE1B1?style=flat-square)](https://opensource.org/licenses/MIT)

## Descripción General
**Analytics QC** es una plataforma interactiva de alta dirección diseñada para la supervisión, gestión y auditoría en tiempo real de proyectos de adaptación y validación de instrumentos psicométricos.

La plataforma opera como un sitio web estático alojado en **GitHub Pages** (`qc-projects.github.io`), construido íntegramente en HTML, CSS y JavaScript, sin dependencias de servidor externo.

## Arquitectura Técnica

La plataforma sigue una arquitectura **MVC ligera** con alta modularización:

```
index.html            ← Página de inicio de sesión
app.html              ← Panel principal (protegido)
browser-support.js    ← Polyfills y detección de características (IE9+)
  data/projects.csv     ← Fuente de datos estática (fallback)

css/
  reset.css           ← Reset de estilos base
  themes.css          ← Tokens de diseño (variables CSS, light/dark)
  layout.css          ← Estructura de página (sidebar + contenido)
  components.css      ← Componentes reutilizables (tarjetas, tabs, botones)
  table.css           ← Tabla de datos editable
  auth.css            ← Formulario de inicio de sesión
  legacy.css          ← Fallbacks @supports para navegadores antiguos

js/
  config.js           ← Constantes globales (usuarios, colores, rutas)
  sha256.js           ← SHA-256 puro en JS (IE9+ sin SubtleCrypto)
  auth.js             ← Autenticación y gestión de sesión
  data.js             ← Carga CSV/remota, persistencia local y sincronización opcional
  charts.js           ← Wrapper de Chart.js (gráfico de barras)
  sidebar.js          ← Tema, usuario y navegación lateral
  tabs/general.js     ← Panel operativo: KPIs, tabla, descarga, equipos
  tabs/profiles.js    ← Perfil individual del investigador
  app.js              ← Bootstrap y orquestador principal
```

## Principios de diseño aplicados

- **SOLID pragmático:** cada módulo JS/CSS tiene una única responsabilidad.
- **HTML semántico:** uso de `<main>`, `<aside>`, `<nav>`, `<section>`, `<header>`, `<article>`, atributos ARIA y `role`.
- **Accesibilidad:** enlace skip-to-content, `aria-live`, `role="status"`, `aria-label` en todos los controles interactivos.
- **Progressive Enhancement:** estilos base para IE9+, mejoras vía `@supports` (grid, backdrop-filter, animaciones) para navegadores modernos.
- **Soporte de navegadores:** `browser-support.js` provee polyfills para Promise, Fetch, classList, CustomEvent, Array/String.includes y más.

## ⚠️ Limitaciones conocidas (arquitectura estática)

> Este sitio se aloja en **GitHub Pages**, que es una plataforma de hosting estática sin soporte de servidor. Las siguientes limitaciones son inherentes a esta arquitectura:

1. **Autenticación del lado del cliente:** Las credenciales se verifican en el navegador mediante hashes SHA-256. Cualquier usuario con acceso al repositorio puede ver los hashes. Esta autenticación es adecuada para un equipo pequeño y de confianza, **no para datos altamente sensibles**. Para mayor seguridad, migrar a una solución con backend (ej. Firebase Auth, Supabase).

2. **Persistencia y sincronización:** En modo base, los cambios se guardan en `localStorage` del navegador de cada usuario. También puede habilitarse sincronización remota opcional (Google Sheets + Apps Script) para compartir cambios sin Firebase/Supabase.

3. **Datos de referencia:** La matriz de datos base proviene de `data/projects.csv`. Para actualizar los datos base permanentemente, edite este archivo directamente en el repositorio.

## Sincronización remota (Google Sheets + Apps Script)

La plataforma soporta un modo automatizado sin BaaS: **Google Sheets como fuente de datos** y **Apps Script como endpoint web**.

### 1) Configurar `js/config.js`

Active `remoteSync`:

```js
remoteSync: {
  enabled: true,
  readUrl: 'https://script.google.com/macros/s/.../exec',
  writeUrl: 'https://script.google.com/macros/s/.../exec',
  apiKey: 'TU_API_KEY_OPCIONAL'
}
```

> Si `enabled` es `false` o faltan URLs, la app usa automáticamente el modo local (`data/projects.csv` + `localStorage`).

### 2) Apps Script (Web App) — contrato esperado

- `GET`: devuelve JSON como:
  - `[{...fila1}, {...fila2}]` **o**
  - `{ "rows": [{...fila1}, {...fila2}] }`
- `POST`: recibe:
  - `{ "rows": [...], "source": "qc-analytics-platform", "updatedAt": "ISO-8601" }`
- Header opcional para validación: `X-QC-API-Key`.

Las columnas esperadas por fila son:

`Semana, Fecha, Horario, Proyecto, Autores, Revisor, Estado, Avance (%), Observaciones`

### 3) Uso en UI

- **Actualizar desde hoja**: recarga la matriz compartida.
- **Sincronizar cambios**: fuerza envío manual inmediato.
- Las ediciones también intentan sincronizarse automáticamente; si falla la red, se conserva un borrador local para reintento.

## Estructura de Datos

```
Semana | Fecha | Horario | Proyecto | Autores | Revisor | Estado | Avance (%) | Observaciones
```

## Contacto e Institucionalidad

Desarrollado en el marco de las investigaciones en métodos cuantitativos avanzados y análisis de redes para el estudio del comportamiento humano.  
Contáctese a: psinetlab@gmail.com
