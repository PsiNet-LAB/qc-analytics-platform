# Analytics QC 2026: Plataforma de Control Psicométrico

[![Python](https://img.shields.io/badge/Python-3.9+-3498DB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-FF4B4B?style=flat-square&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-AEE1B1?style=flat-square)](https://opensource.org/licenses/MIT)

## Descripción General
**Analytics QC** es una plataforma interactiva de alta dirección diseñada para la supervisión, gestión y auditoría en tiempo real de proyectos de adaptación y validación de instrumentos psicométricos. 

La arquitectura actual está optimizada para el monitoreo del macro-proyecto de adaptación cultural para poblaciones hispanohablantes y quechuahablantes (variante Chanka) en el Perú, abarcando escalas clínicas y de bienestar como **FACES-IV, PANAS, PHQ-9, SWLS, AUDIT y BFI-10**.

## Arquitectura Técnica
El sistema opera bajo una infraestructura dual:
* **Front-end:** Renderizado reactivo mediante Streamlit, con inyección de CSS personalizado para una interfaz minimalista (Glassmorphism y paletas Pantone). Soporte nativo para alternancia entre modo claro y oscuro.
* **Motor de Visualización:** Gráficos interactivos de convergencia operativa construidos con Plotly Express.
* **Back-end & I/O:** Sistema de persistencia de estado automatizado que sincroniza las modificaciones de la matriz de datos iterando sobre un archivo plano (CSV) en milisegundos, garantizando la integridad referencial.

## Instalación y Despliegue Local

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/su-organizacion/qc-analytics-platform.git](https://github.com/su-organizacion/qc-analytics-platform.git)
   cd qc-analytics-platform
