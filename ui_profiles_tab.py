# ui_profiles_tab.py - Researcher Profiles Tab
# Single Responsibility: rendering the individual researcher performance view.

import pandas as pd
import streamlit as st


def render_profiles_tab(df: pd.DataFrame, colors: dict, researchers: list) -> None:
    """Render the researcher individual performance profile tab."""
    st.markdown("<div class='styled-section'>", unsafe_allow_html=True)
    st.markdown(
        "<h3 class='styled-header'>Análisis de Rendimiento Individual</h3>",
        unsafe_allow_html=True,
    )
    investigador = st.selectbox(
        "Buscar investigador en la matriz académica:", [""] + researchers
    )
    st.markdown("</div>", unsafe_allow_html=True)

    if not investigador:
        return

    df_investigador = _filter_by_researcher(df, investigador)
    if not df_investigador.empty:
        _render_researcher_metrics(df_investigador)
        _render_researcher_table(df_investigador, colors)
    else:
        st.info("El investigador seleccionado no presenta carga operativa asignada.")


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _filter_by_researcher(df: pd.DataFrame, researcher: str) -> pd.DataFrame:
    """Return rows where the researcher appears as author or reviewer, with role column."""
    mask_author = df["Autores"].fillna("").str.contains(researcher, regex=False)
    mask_reviewer = df["Revisor"].fillna("").str.contains(researcher, regex=False)
    result = df[mask_author | mask_reviewer].copy()
    result["Rol Operativo"] = result.apply(
        lambda row: _determine_role(row, researcher), axis=1
    )
    return result


def _determine_role(row: pd.Series, researcher: str) -> str:
    """Derive the operational role label for a researcher within a given row."""
    roles = []
    if pd.notna(row["Autores"]) and researcher in row["Autores"]:
        roles.append("Autor QC")
    if pd.notna(row["Revisor"]) and researcher in row["Revisor"]:
        roles.append("Revisor Principal")
    return " & ".join(roles)


def _render_researcher_metrics(df_investigador: pd.DataFrame) -> None:
    """Display the three KPI cards for the selected researcher."""
    c1, c2, c3 = st.columns(3)
    c1.metric("Carga de Proyectos", len(df_investigador))
    c2.metric(
        "Rol de Supervisión",
        len(df_investigador[df_investigador["Rol Operativo"].str.contains("Revisor")]),
    )
    c3.metric(
        "Tasa de Ejecución Media",
        f"{df_investigador['Avance (%)'].mean():.1f}%",
    )


def _render_researcher_table(df_investigador: pd.DataFrame, colors: dict) -> None:
    """Render the detailed project table for the selected researcher."""
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(
        f"<div style='background-color: {colors['card_bg']}; border-radius: 16px; "
        f"border: 1px solid {colors['border']}; padding: 10px;'>",
        unsafe_allow_html=True,
    )
    st.dataframe(
        df_investigador[
            ["Semana", "Fecha", "Horario", "Proyecto", "Rol Operativo", "Estado", "Avance (%)"]
        ],
        column_config={
            "Fecha": st.column_config.DateColumn("Fecha Programada", format="DD/MM/YYYY"),
            "Avance (%)": st.column_config.ProgressColumn(
                "Nivel de Ejecución", format="%f%%", min_value=0, max_value=100
            ),
        },
        hide_index=True,
        use_container_width=True,
    )
    st.markdown("</div>", unsafe_allow_html=True)
