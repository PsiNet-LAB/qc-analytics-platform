# ui_sidebar.py - Sidebar Component
# Single Responsibility: rendering and managing the sidebar UI.

import streamlit as st


def render_sidebar() -> str:
    """Render the sidebar controls and return the selected theme key ('light' | 'dark')."""
    with st.sidebar:
        st.markdown(
            "<h2 class='styled-header'>📊 QC Projects Analytics</h2>",
            unsafe_allow_html=True,
        )
        st.markdown("---")
        theme_selection = st.radio(
            "Seleccione la visualización:",
            ("Claro Minimalista", "Oscuro Sofisticado"),
            index=0 if st.session_state.theme == "light" else 1,
        )
        st.markdown("---")

    return "light" if theme_selection == "Claro Minimalista" else "dark"
