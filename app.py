# app.py - Application Entry Point
# Single Responsibility: orchestrating session state, configuration, and page layout.

import streamlit as st

from config import get_ui_colors
from data_io import get_researchers, load_data
from ui_general_tab import render_general_tab
from ui_profiles_tab import render_profiles_tab
from ui_sidebar import render_sidebar
from ui_styles import inject_styles

# ==========================================
# 1. APP CONFIGURATION
# ==========================================
st.set_page_config(page_title="QC Projects Analytics", layout="wide", page_icon="📊")

if "theme" not in st.session_state:
    st.session_state.theme = "light"

# ==========================================
# 2. STYLES
# ==========================================
ui_colors = get_ui_colors(st.session_state.theme)
inject_styles(ui_colors)

# ==========================================
# 3. SIDEBAR
# ==========================================
selected_theme = render_sidebar()
if selected_theme != st.session_state.theme:
    st.session_state.theme = selected_theme
    st.rerun()

# ==========================================
# 4. DATA LOADING
# ==========================================
df = load_data()
researchers = get_researchers(df)

# ==========================================
# 5. MAIN LAYOUT
# ==========================================
st.markdown(
    f"""
<div style='margin-bottom: 2.5rem;'>
    <h1 class='styled-header' style='font-size: 42px; margin-bottom: 0.5rem;'>📊 QC Projects Analytics</h1>
    <p style='color: {ui_colors['subtext']}; font-size: 18px; font-weight: 300;'>
        Plataforma centralizada de alta dirección para la supervisión y gestión de calidad operativa.
    </p>
</div>
""",
    unsafe_allow_html=True,
)

tab_general, tab_perfiles = st.tabs(
    ["📊 Panel Operativo de Proyectos", "👤 Perfil de Investigador"]
)

with tab_general:
    render_general_tab(df, ui_colors, researchers)

with tab_perfiles:
    render_profiles_tab(df, ui_colors, researchers)