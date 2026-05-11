# ui_styles.py - Dynamic CSS Injection
# Single Responsibility: building and injecting application-wide CSS into Streamlit.

import streamlit as st


def inject_styles(colors: dict) -> None:
    """Inject the full application CSS based on the active colour palette."""
    st.markdown(
        f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600&display=swap');

    .stApp {{
        background-color: {colors['bg']};
        color: {colors['text']};
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }}

    h1, h2, h3, .styled-header {{
        font-family: 'Montserrat', sans-serif !important;
        font-weight: 300 !important;
        color: {colors['text']} !important;
        letter-spacing: -0.5px;
    }}

    div[data-testid="metric-container"] {{
        background-color: {colors['card_bg']} !important;
        border: 1px solid {colors['border']} !important;
        padding: 20px 25px !important;
        border-radius: 16px !important;
        box-shadow: 0px 8px 16px {colors['shadow']} !important;
        transition: all 0.3s ease-in-out;
        backdrop-filter: blur(5px);
    }}

    div[data-testid="metric-container"]:hover {{
        transform: translateY(-4px);
        box-shadow: 0px 12px 20px {colors['shadow']} !important;
        border-color: {colors['accent']};
    }}

    div[data-testid="stMetricLabel"] {{
        color: {colors['subtext']} !important;
        font-size: 14px !important;
        text-transform: uppercase;
        letter-spacing: 1px;
    }}

    div[data-testid="stMetricValue"] {{
        color: {colors['text']} !important;
        font-weight: 600 !important;
        font-size: 32px !important;
    }}

    .stTabs [data-baseweb="tab-list"] {{
        gap: 10px;
        background-color: transparent;
    }}

    .stTabs [data-baseweb="tab"] {{
        height: 45px;
        white-space: pre;
        background-color: {colors['card_bg']};
        border-radius: 8px 8px 0px 0px;
        border: 1px solid {colors['border']};
        border-bottom: none;
        color: {colors['subtext']};
        font-family: 'Montserrat', sans-serif;
        font-weight: 400;
        transition: all 0.2s;
    }}

    .stTabs [aria-selected="true"] {{
        background-color: {colors['bg']} !important;
        color: {colors['accent']} !important;
        font-weight: 600 !important;
    }}

    .stApp p, .stApp label, .stApp span {{ color: {colors['text']}; }}
    .stApp div[data-testid="stWidgetLabel"] p {{ color: {colors['subtext']} !important; }}
    .stApp div[data-testid="stMarkdownContainer"] p {{ color: {colors['text']}; }}

    .stApp button[data-testid="stBaseButton-primary"] span,
    .stApp button[data-testid="stBaseButton-primary"] p,
    .stApp button[data-testid="stBaseButton-primaryFormSubmit"] span,
    .stApp button[data-testid="stBaseButton-primaryFormSubmit"] p {{
        color: #FFFFFF !important;
    }}

    .stApp div[data-baseweb="tag"] span {{ color: #FFFFFF !important; }}
    .stSelectbox div[data-baseweb="select"] span {{ color: {colors['text']} !important; }}
    .stApp .stRadio label p, .stApp .stRadio label span {{ color: {colors['text']} !important; }}
    .stApp .stRadio > label > span {{ color: {colors['subtext']} !important; }}

    div[data-testid="stMetricLabel"] p {{ color: {colors['subtext']} !important; }}
    div[data-testid="stMetricValue"] p {{ color: {colors['text']} !important; }}

    #MainMenu {{visibility: hidden;}}
    footer {{visibility: hidden;}}

    .styled-section {{
        background-color: {colors['card_bg']};
        border: 1px solid {colors['border']};
        padding: 25px;
        border-radius: 16px;
        margin-bottom: 20px;
        color: {colors['text']};
    }}
</style>
""",
        unsafe_allow_html=True,
    )
