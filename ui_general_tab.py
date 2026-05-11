# ui_general_tab.py - General Operations Tab
# Single Responsibility: rendering the main operations panel and its sub-sections.

import pandas as pd
import plotly.express as px
import streamlit as st

from config import STATUS_COLORS
from data_io import save_data


def render_general_tab(df: pd.DataFrame, colors: dict, researchers: list) -> pd.DataFrame:
    """Render the general operations panel.

    Returns the (possibly updated) dataframe so callers always hold the latest
    version without accessing global state.
    """
    _render_kpi_metrics(df)
    st.markdown("<br>", unsafe_allow_html=True)

    col_chart, col_edit = st.columns([1, 2])
    with col_chart:
        _render_progress_chart(df, colors)
    with col_edit:
        df = _render_edit_table(df, colors)

    st.divider()
    _render_download_button(df)
    df = _render_team_assignment(df, colors, researchers)
    return df


# ---------------------------------------------------------------------------
# Private helpers — each covers exactly one visual sub-section (SRP)
# ---------------------------------------------------------------------------

def _render_kpi_metrics(df: pd.DataFrame) -> None:
    """Display the four top-level KPI metric cards."""
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Instrumentos Totales", len(df["Proyecto"].unique()))
    c2.metric("Nivel de Aprobación", len(df[df["Estado"] == "Aprobado"]))
    c3.metric(
        "Flujo Activo",
        len(df[df["Estado"].isin(["En progreso", "En revisión"])]),
    )
    c4.metric("Índice de Progreso Medio", f"{df['Avance (%)'].mean():.1f}%")


def _render_progress_chart(df: pd.DataFrame, colors: dict) -> None:
    """Render the horizontal bar chart showing project progress by status."""
    st.markdown(
        "<h3 class='styled-header'>Convergencia Operativa</h3>",
        unsafe_allow_html=True,
    )
    df_last = df.loc[df.groupby(["Proyecto", "Estado"])["Fecha"].idxmax()]
    df_chart = df_last[["Proyecto", "Estado", "Avance (%)"]].copy()
    df_chart = df_chart.sort_values("Avance (%)", ascending=True)
    sorted_projects = df_chart["Proyecto"].unique().tolist()

    fig = px.bar(
        df_chart,
        x="Avance (%)",
        y="Proyecto",
        color="Estado",
        color_discrete_map=STATUS_COLORS,
        orientation="h",
        text="Avance (%)",
    )
    fig.update_traces(
        texttemplate="<b>%{text:.0f}%</b>",
        textposition="inside",
        insidetextanchor="middle",
        marker_line_width=0,
        opacity=0.9,
    )
    fig.update_layout(
        plot_bgcolor=colors["plotly_bg"],
        paper_bgcolor=colors["plotly_bg"],
        xaxis=dict(showgrid=False, showticklabels=False, title="", zeroline=False),
        yaxis=dict(
            showgrid=False,
            title="",
            categoryorder="array",
            categoryarray=sorted_projects,
            tickfont=dict(color=colors["plotly_text"], size=13, family="Montserrat"),
        ),
        font=dict(family="Helvetica Neue, sans-serif", color=colors["plotly_text"]),
        margin=dict(l=0, r=0, t=10, b=0),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            title="",
            font=dict(size=11, color=colors["plotly_text"]),
        ),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})


def _render_edit_table(df: pd.DataFrame, colors: dict) -> pd.DataFrame:
    """Render the inline data editor and persist any changes to disk."""
    st.markdown(
        "<h3 class='styled-header'>Registro de Modificaciones en Tiempo Real</h3>",
        unsafe_allow_html=True,
    )
    st.markdown(
        f"<div style='background-color: {colors['card_bg']}; border-radius: 16px; "
        f"border: 1px solid {colors['border']}; padding: 5px;'>",
        unsafe_allow_html=True,
    )

    col_config = {
        "Fecha": st.column_config.DateColumn("Fecha", format="DD/MM/YYYY", disabled=True),
        "Horario": st.column_config.TextColumn("Horario", disabled=True),
        "Proyecto": st.column_config.TextColumn("Proyecto", disabled=True),
        "Estado": st.column_config.SelectboxColumn(
            "Estado",
            options=["Pendiente", "En progreso", "En revisión", "Aprobado"],
            required=True,
        ),
        "Avance (%)": st.column_config.NumberColumn(
            "Avance (%)", min_value=0, max_value=100, step=5, format="%d"
        ),
        "Observaciones": st.column_config.TextColumn("Notas Operativas / Metodológicas"),
    }

    columnas_editor = ["Fecha", "Horario", "Proyecto", "Estado", "Avance (%)", "Observaciones"]
    edited_df = st.data_editor(
        df[columnas_editor],
        column_config=col_config,
        hide_index=True,
        use_container_width=True,
        height=400,
    )
    st.markdown("</div>", unsafe_allow_html=True)

    if not edited_df.equals(df[columnas_editor]):
        for idx in df.index:
            df.at[idx, "Estado"] = edited_df.at[idx, "Estado"]
            df.at[idx, "Avance (%)"] = edited_df.at[idx, "Avance (%)"]
            df.at[idx, "Observaciones"] = edited_df.at[idx, "Observaciones"]
        save_data(df)
        st.rerun()

    return df


def _render_download_button(df: pd.DataFrame) -> None:
    """Render the CSV download button for the current data matrix."""
    df_download = df.copy()
    df_download["Fecha"] = df_download["Fecha"].dt.strftime("%d/%m/%Y")
    csv_data = df_download.to_csv(index=False, encoding="utf-8")
    st.download_button(
        label="📥 Descargar Matriz Actualizada",
        data=csv_data,
        file_name="Matriz_QC_Actualizada.csv",
        mime="text/csv",
        type="primary",
    )


def _render_team_assignment(
    df: pd.DataFrame, colors: dict, researchers: list
) -> pd.DataFrame:
    """Render the team assignment section and persist any author updates."""
    st.markdown("<div class='styled-section'>", unsafe_allow_html=True)
    st.markdown(
        "<h3 class='styled-header'>Gestión de Equipos de Asignación</h3>",
        unsafe_allow_html=True,
    )

    col_a, col_b = st.columns([1, 2])
    with col_a:
        proyecto_seleccionado = st.selectbox(
            "Seleccionar instrumento:", df["Proyecto"].unique()
        )
    with col_b:
        idx_proyecto = df[df["Proyecto"] == proyecto_seleccionado].index[0]
        autores_actuales = (
            df.loc[idx_proyecto, "Autores"].split("; ")
            if pd.notna(df.loc[idx_proyecto, "Autores"])
            else []
        )

        nuevo_autor = st.text_input(
            "Añadir investigador no listado:",
            placeholder="Nombre completo del investigador",
        )
        if nuevo_autor:
            nuevo_autor = nuevo_autor.strip()
            if nuevo_autor and nuevo_autor not in researchers:
                researchers.append(nuevo_autor)
                researchers.sort()

        nuevos_autores = st.multiselect(
            "Investigadores asignados al QC:",
            options=researchers,
            default=[a for a in autores_actuales if a in researchers],
        )

        if st.button("Actualizar Matriz de Equipo", type="primary"):
            df.loc[df["Proyecto"] == proyecto_seleccionado, "Autores"] = "; ".join(
                nuevos_autores
            )
            save_data(df)
            st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)
    return df
