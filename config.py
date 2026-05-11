# config.py - Application Configuration
# Single Responsibility: centralised constants, file paths, and colour palettes.

FILE_PATH = "Cronograma_Revisiones_2026 QC.xlsx - Cronograma 2026.csv"

STATUS_COLORS = {
    "Aprobado": "#AEE1B1",
    "En revisión": "#FDE093",
    "En progreso": "#AEC6CF",
    "Pendiente": "#E5E5E5",
}

_LIGHT_PALETTE = {
    "bg": "#F5F7FA",
    "card_bg": "rgba(255, 255, 255, 0.95)",
    "text": "#1A2332",
    "subtext": "#5A6978",
    "border": "#D0D7DE",
    "shadow": "rgba(31, 35, 40, 0.08)",
    "plotly_bg": "rgba(0,0,0,0)",
    "plotly_text": "#1A2332",
    "plotly_grid": "#D0D7DE",
    "accent": "#0969DA",
}

_DARK_PALETTE = {
    "bg": "#121212",
    "card_bg": "rgba(30, 30, 30, 0.9)",
    "text": "#ECECEC",
    "subtext": "#A0A0A0",
    "border": "#333333",
    "shadow": "rgba(0, 0, 0, 0.3)",
    "plotly_bg": "rgba(0,0,0,0)",
    "plotly_text": "#ECECEC",
    "plotly_grid": "#333333",
    "accent": "#58A6FF",
}


def get_ui_colors(theme: str) -> dict:
    """Return the colour palette dict for the requested theme ('light' | 'dark')."""
    return _LIGHT_PALETTE if theme == "light" else _DARK_PALETTE
