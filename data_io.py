# data_io.py - Data Input / Output Layer
# Single Responsibility: loading, transforming, and persisting the project data matrix.

import os

import pandas as pd
import streamlit as st

from config import FILE_PATH


def load_data() -> pd.DataFrame:
    """Load and normalise the project data matrix from disk.

    Adds missing control columns with sensible defaults and enforces correct
    dtypes so downstream consumers receive a consistent schema.
    """
    if not os.path.exists(FILE_PATH):
        st.error(f"Error Crítico: No se pudo localizar '{FILE_PATH}'.")
        st.stop()

    df = pd.read_csv(FILE_PATH)

    # Parse the date series
    df["Fecha"] = pd.to_datetime(df["Fecha"], format="%d/%m/%Y", errors="coerce")

    # Inject control columns when they are absent
    if "Estado" not in df.columns:
        df["Estado"] = "Pendiente"
    if "Avance (%)" not in df.columns:
        df["Avance (%)"] = 0
    if "Observaciones" not in df.columns:
        df["Observaciones"] = ""

    # Enforce correct types to prevent ColumnDataKind.FLOAT errors
    df["Observaciones"] = df["Observaciones"].fillna("").astype(str)
    df["Estado"] = df["Estado"].astype(str)
    df["Proyecto"] = df["Proyecto"].astype(str)

    return df


def save_data(dataframe: pd.DataFrame) -> None:
    """Persist the data matrix back to disk, formatting dates for CSV round-trips."""
    try:
        df_export = dataframe.copy()
        df_export["Fecha"] = df_export["Fecha"].dt.strftime("%d/%m/%Y")
        df_export.to_csv(FILE_PATH, index=False, encoding="utf-8")
    except Exception as exc:
        st.error(f"Fallo en la sincronización de I/O: {exc}")


def get_researchers(df: pd.DataFrame) -> list:
    """Extract and return a sorted list of unique researcher names from the data."""
    all_authors: set = set()
    for sublist in df["Autores"].dropna().str.split("; "):
        all_authors.update(sublist)
    return sorted(all_authors)
