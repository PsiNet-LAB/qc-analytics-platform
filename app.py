import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime
import os

# ==========================================
# 1. CONFIGURACIÓN Y ESTADO DE SESIÓN
# ==========================================
st.set_page_config(page_title="Analytics QC Premium", layout="wide", page_icon="💎")

# Archivo central de base de datos
FILE_PATH = "Cronograma_Revisiones_2026 QC.xlsx - Cronograma 2026.csv"

if 'theme' not in st.session_state:
    st.session_state.theme = 'light'

# ==========================================
# 2. DEFINICIÓN DE PALETAS DE COLORES
# ==========================================
STATUS_COLORS = {
    "Aprobado": "#AEE1B1",      
    "En revisión": "#FDE093",   
    "En progreso": "#AEC6CF",   
    "Pendiente": "#E5E5E5"      
}

if st.session_state.theme == 'light':
    UI_COLORS = {
        "bg": "#F8F9FA", "card_bg": "rgba(255, 255, 255, 0.9)", "text": "#2C3E50",
        "subtext": "#7F8C8D", "border": "#EAEAEA", "shadow": "rgba(0, 0, 0, 0.05)",
        "plotly_bg": "rgba(0,0,0,0)", "plotly_text": "#2C3E50", "plotly_grid": "#EAEAEA"
    }
else: 
    UI_COLORS = {
        "bg": "#121212", "card_bg": "rgba(30, 30, 30, 0.9)", "text": "#ECECEC",
        "subtext": "#A0A0A0", "border": "#333333", "shadow": "rgba(0, 0, 0, 0.3)",
        "plotly_bg": "rgba(0,0,0,0)", "plotly_text": "#ECECEC", "plotly_grid": "#333333"
    }

# ==========================================
# 3. INYECCIÓN DE CSS AVANZADO
# ==========================================
st.markdown(f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600&display=swap');
    .stApp {{ background-color: {UI_COLORS['bg']}; color: {UI_COLORS['text']}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }}
    h1, h2, h3, .styled-header {{ font-family: 'Montserrat', sans-serif !important; font-weight: 300 !important; color: {UI_COLORS['text']} !important; letter-spacing: -0.5px; }}
    div[data-testid="metric-container"] {{ background-color: {UI_COLORS['card_bg']} !important; border: 1px solid {UI_COLORS['border']} !important; padding: 20px 25px !important; border-radius: 16px !important; box-shadow: 0px 8px 16px {UI_COLORS['shadow']} !important; transition: all 0.3s ease-in-out; backdrop-filter: blur(5px); }}
    div[data-testid="metric-container"]:hover {{ transform: translateY(-4px); box-shadow: 0px 12px 20px {UI_COLORS['shadow']} !important; border-color: #3498DB; }}
    div[data-testid="stMetricLabel"] {{ color: {UI_COLORS['subtext']} !important; font-size: 14px !important; text-transform: uppercase; letter-spacing: 1px; }}
    div[data-testid="stMetricValue"] {{ color: {UI_COLORS['text']} !important; font-weight: 600 !important; font-size: 32px !important; }}
    .stTabs [data-baseweb="tab-list"] {{ gap: 10px; background-color: transparent; }}
    .stTabs [data-baseweb="tab"] {{ height: 45px; white-space: pre; background-color: {UI_COLORS['card_bg']}; border-radius: 8px 8px 0px 0px; border: 1px solid {UI_COLORS['border']}; border-bottom: none; color: {UI_COLORS['subtext']}; font-family: 'Montserrat', sans-serif; font-weight: 400; transition: all 0.2s; }}
    .stTabs [aria-selected="true"] {{ background-color: {UI_COLORS['bg']} !important; color: #3498DB !important; font-weight: 600 !important; }}
    #MainMenu {{visibility: hidden;}} footer {{visibility: hidden;}}
    .styled-section {{ background-color: {UI_COLORS['card_bg']}; border: 1px solid {UI_COLORS['border']}; padding: 25px; border-radius: 16px; margin-bottom: 20px; }}
</style>
""", unsafe_allow_html=True)

# ==========================================
# 4. BARRA LATERAL - CONTROL DE TEMA
# ==========================================
with st.sidebar:
    st.markdown("<h2 class='styled-header'>💎 Analytics Premium</h2>", unsafe_allow_html=True)
    st.markdown("---")
    theme_selection = st.radio("Seleccione la visualización:", ('Claro Minimalista', 'Oscuro Sofisticado'), index=0 if st.session_state.theme == 'light' else 1)
    new_theme = 'light' if theme_selection == 'Claro Minimalista' else 'dark'
    if new_theme != st.session_state.theme:
        st.session_state.theme = new_theme
        st.rerun()
    st.markdown("---")

# ==========================================
# 5. MOTOR DE I/O (PERSISTENCIA EN DISCO)
# ==========================================
def cargar_matriz_datos():
    if not os.path.exists(FILE_PATH):
        st.error(f"Error Crítico: No se pudo localizar '{FILE_PATH}'.")
        st.stop()
        
    df = pd.read_csv(FILE_PATH)
    
    # Transformación de la serie temporal
    df['Fecha'] = pd.to_datetime(df['Fecha'], format='%d/%m/%Y', errors='coerce')
    
    # Inyección de variables de control
    if 'Estado' not in df.columns: 
        df['Estado'] = 'Pendiente'
    if 'Avance (%)' not in df.columns: 
        df['Avance (%)'] = 0
    if 'Observaciones' not in df.columns: 
        df['Observaciones'] = ''
        
    # [!] CORRECCIÓN CRÍTICA DE TIPADO:
    # Se fuerza el reemplazo de valores NaN por strings vacíos y se convierte 
    # explícitamente la serie de datos a formato de texto para evitar el error ColumnDataKind.FLOAT.
    df['Observaciones'] = df['Observaciones'].fillna('').astype(str)
    df['Estado'] = df['Estado'].astype(str)
    df['Proyecto'] = df['Proyecto'].astype(str)
    
    return df

def sincronizar_disco(dataframe):
    """Sobrescribe el archivo CSV local para reflejar los cambios globalmente."""
    try:
        # Formatear la fecha de vuelta a string para conservar la consistencia del CSV
        df_export = dataframe.copy()
        df_export['Fecha'] = df_export['Fecha'].dt.strftime('%d/%m/%Y')
        df_export.to_csv(FILE_PATH, index=False, encoding='utf-8')
    except Exception as e:
        st.error(f"Fallo en la sincronización de I/O: {e}")

# Cargar siempre la versión más fresca del disco en cada iteración
df = cargar_matriz_datos()

todos_los_autores = set()
for sublist in df['Autores'].dropna().str.split('; '):
    todos_los_autores.update(sublist)
lista_investigadores = sorted(list(todos_los_autores))

# ==========================================
# 6. ESTRUCTURA PRINCIPAL
# ==========================================
st.markdown(f"""
<div style='margin-bottom: 2.5rem;'>
    <h1 class='styled-header' style='font-size: 42px; margin-bottom: 0.5rem;'>Control Analítico de Instrumentos 2026</h1>
    <p style='color: {UI_COLORS['subtext']}; font-size: 18px; font-weight: 300;'>Plataforma centralizada de alta dirección para la supervisión y gestión de calidad operativa.</p>
</div>
""", unsafe_allow_html=True)

tab_general, tab_perfiles = st.tabs(["📊 Panel Operativo de Proyectos", "👤 Inteligencia de Investigador"])

# ------------------------------------------
# PESTAÑA 1: PANEL GENERAL
# ------------------------------------------
with tab_general:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Instrumentos Totales", len(df['Proyecto'].unique()))
    c2.metric("Nivel de Aprobación", len(df[df['Estado'] == 'Aprobado']))
    c3.metric("Flujo Activo", len(df[df['Estado'].isin(['En progreso', 'En revisión'])]))
    c4.metric("Índice de Progreso Medio", f"{df['Avance (%)'].mean():.1f}%")
    
    st.markdown("<br>", unsafe_allow_html=True)
    col_chart, col_edit = st.columns([1, 2])
    
    with col_chart:
        st.markdown("<h3 class='styled-header'>Convergencia Operativa</h3>", unsafe_allow_html=True)
        df_chart = df.groupby(['Proyecto', 'Estado'], as_index=False)['Avance (%)'].mean()
        fig = px.bar(df_chart, x='Avance (%)', y='Proyecto', color='Estado', color_discrete_map=STATUS_COLORS, orientation='h', text='Avance (%)')
        fig.update_traces(texttemplate='<b>%{text:.0f}%</b>', textposition='inside', insidetextanchor='middle', marker_line_width=0, opacity=0.9)
        fig.update_layout(
            plot_bgcolor=UI_COLORS['plotly_bg'], paper_bgcolor=UI_COLORS['plotly_bg'],
            xaxis=dict(showgrid=False, showticklabels=False, title="", zeroline=False), 
            yaxis=dict(showgrid=False, title="", tickfont=dict(color=UI_COLORS['plotly_text'], size=13, family="Montserrat")),
            font=dict(family="Helvetica Neue, sans-serif", color=UI_COLORS['plotly_text']),
            margin=dict(l=0, r=0, t=10, b=0), showlegend=True,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, title="", font=dict(size=11, color=UI_COLORS['plotly_text']))
        )
        if st.session_state.theme == 'dark': fig.update_xaxes(zerolinecolor=UI_COLORS['plotly_grid'])
        st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})

    with col_edit:
        st.markdown("<h3 class='styled-header'>Registro de Modificaciones en Tiempo Real</h3>", unsafe_allow_html=True)
        st.markdown(f"<div style='background-color: {UI_COLORS['card_bg']}; border-radius: 16px; border: 1px solid {UI_COLORS['border']}; padding: 5px;'>", unsafe_allow_html=True)
        
        col_config = {
            "Fecha": st.column_config.DateColumn("Fecha", format="DD/MM/YYYY", disabled=True),
            "Horario": st.column_config.TextColumn("Horario", disabled=True),
            "Proyecto": st.column_config.TextColumn("Proyecto", disabled=True),
            "Estado": st.column_config.SelectboxColumn("Estado", options=["Pendiente", "En progreso", "En revisión", "Aprobado"], required=True),
            "Avance (%)": st.column_config.NumberColumn("Avance (%)", min_value=0, max_value=100, step=5, format="%d"),
            "Observaciones": st.column_config.TextColumn("Notas Operativas / Metodológicas")
        }

        columnas_editor = ['Fecha', 'Horario', 'Proyecto', 'Estado', 'Avance (%)', 'Observaciones']
        
        edited_df = st.data_editor(
            df[columnas_editor],
            column_config=col_config,
            hide_index=True,
            use_container_width=True,
            height=400
        )
        st.markdown("</div>", unsafe_allow_html=True)

        # LÓGICA DE PERSISTENCIA: Si hay un cambio en la tabla, actualizar df maestro y guardar en disco
        if not edited_df.equals(df[columnas_editor]):
            for idx in df.index:
                df.at[idx, 'Estado'] = edited_df.at[idx, 'Estado']
                df.at[idx, 'Avance (%)'] = edited_df.at[idx, 'Avance (%)']
                df.at[idx, 'Observaciones'] = edited_df.at[idx, 'Observaciones']
            sincronizar_disco(df) # Escribir en disco inmediatamente
            st.rerun()

    st.divider()
    
    st.markdown("<div class='styled-section'>", unsafe_allow_html=True)
    st.markdown("<h3 class='styled-header'>Gestión de Equipos de Asignación</h3>", unsafe_allow_html=True)
    col_a, col_b = st.columns([1, 2])
    with col_a:
        proyecto_seleccionado = st.selectbox("Seleccionar instrumento:", df['Proyecto'].unique())
    with col_b:
        idx_proyecto = df[df['Proyecto'] == proyecto_seleccionado].index[0]
        autores_actuales = df.loc[idx_proyecto, 'Autores'].split('; ') if pd.notna(df.loc[idx_proyecto, 'Autores']) else []
        
        nuevos_autores = st.multiselect(
            "Investigadores asignados al QC:", 
            options=lista_investigadores,
            default=[a for a in autores_actuales if a in lista_investigadores]
        )
        
        if st.button("Actualizar Matriz de Equipo", type="primary"):
            df.loc[df['Proyecto'] == proyecto_seleccionado, 'Autores'] = '; '.join(nuevos_autores)
            sincronizar_disco(df) # Escribir en disco inmediatamente
            st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

# ------------------------------------------
# PESTAÑA 2: INTELIGENCIA DE INVESTIGADOR
# ------------------------------------------
with tab_perfiles:
    st.markdown("<div class='styled-section'>", unsafe_allow_html=True)
    st.markdown("<h3 class='styled-header'>Análisis de Rendimiento Individual</h3>", unsafe_allow_html=True)
    investigador = st.selectbox("Buscar investigador en la matriz académica:", [""] + lista_investigadores)
    st.markdown("</div>", unsafe_allow_html=True)
    
    if investigador:
        filtro_autor = df['Autores'].fillna('').str.contains(investigador)
        filtro_revisor = df['Revisor'].fillna('').str.contains(investigador)
        df_investigador = df[filtro_autor | filtro_revisor].copy()
        
        if not df_investigador.empty:
            def determinar_rol(fila):
                roles = []
                if pd.notna(fila['Autores']) and investigador in fila['Autores']: roles.append("Autor QC")
                if pd.notna(fila['Revisor']) and investigador in fila['Revisor']: roles.append("Revisor Principal")
                return " & ".join(roles)
                
            df_investigador['Rol Operativo'] = df_investigador.apply(determinar_rol, axis=1)
            
            c_perf1, c_perf2, c_perf3 = st.columns(3)
            c_perf1.metric("Carga de Proyectos", len(df_investigador))
            c_perf2.metric("Rol de Supervisión", len(df_investigador[df_investigador['Rol Operativo'].str.contains('Revisor')]))
            c_perf3.metric("Tasa de Ejecución Media", f"{df_investigador['Avance (%)'].mean():.1f}%")
            
            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown(f"<div style='background-color: {UI_COLORS['card_bg']}; border-radius: 16px; border: 1px solid {UI_COLORS['border']}; padding: 10px;'>", unsafe_allow_html=True)
            st.dataframe(
                df_investigador[['Semana', 'Fecha', 'Horario', 'Proyecto', 'Rol Operativo', 'Estado', 'Avance (%)']],
                column_config={
                    "Fecha": st.column_config.DateColumn("Fecha Programada", format="DD/MM/YYYY"),
                    "Avance (%)": st.column_config.ProgressColumn("Nivel de Ejecución", format="%f%%", min_value=0, max_value=100)
                },
                hide_index=True, use_container_width=True
            )
            st.markdown("</div>", unsafe_allow_html=True)
        else:
            st.info("El investigador seleccionado no presenta carga operativa asignada.")