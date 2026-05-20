/**
 * config.js — Application-wide constants.
 * Single Responsibility: centralise configuration so no other module
 * hard-codes colours, paths, or user credentials.
 *
 * Intentionally uses ES5 syntax (IIFE + var) so it runs in IE 9+
 * without transpilation.
 */

/* global QC */
var QC = QC || {};

QC.Config = (function () {
    'use strict';

    /* ── Registered users ──────────────────────────────────────────────
     * Passwords are stored as SHA-256 hex digests.
     * Default credentials:
     *   angel.garcia@psinet-lab.org  →  Angel2026@QC
     *   dennis.calle@psinet-lab.org  →  Dennis2026@QC
     *
     * ARCHITECTURE NOTE: This is a static GitHub Pages site with no server.
     * Authentication happens entirely in the browser. Hash values are visible
     * to anyone who inspects the repository. This design is appropriate for a
     * small trusted team. For sensitive data, migrate to a backend auth service
     * (e.g. Firebase Auth, Supabase). See README.md § Limitaciones conocidas.
     * ────────────────────────────────────────────────────────────────── */
    var USERS = [
        {
            name:         "Angel Alfonso García O'Diana",
            email:        'angel.garcia@psinet-lab.org',
            passwordHash: 'b373690e96f02746a69b7ce5e8d029fa03fdba4623f4f487311a3a6e1a80647a'
        },
        {
            name:         'Dennis Saul Calle Huánuco',
            email:        'dennis.calle@psinet-lab.org',
            passwordHash: '136e10081ddde39a0691954a5713cb72ba2088f6814e1a8458d94ee0f41e0e65'
        }
    ];

    /* ── Status colours (matching Streamlit palette) ─────────────────── */
    var STATUS_COLORS = {
        'Aprobado':    '#AEE1B1',
        'En revisión': '#FDE093',
        'En progreso': '#AEC6CF',
        'Pendiente':   '#E5E5E5'
    };

    var STATUS_OPTIONS = ['Pendiente', 'En progreso', 'En revisión', 'Aprobado'];

    /* ── CSS-class badge map (status → modifier) ─────────────────────── */
    var STATUS_BADGE_CLASS = {
        'Aprobado':    'status-badge--approved',
        'En revisión': 'status-badge--review',
        'En progreso': 'status-badge--progress',
        'Pendiente':   'status-badge--pending'
    };

    /* ── Storage keys ────────────────────────────────────────────────── */
    var STORAGE_KEY  = 'qc_projects_data';   // localStorage: edited data
    var SESSION_KEY  = 'qc_session';         // sessionStorage: logged-in user
    var THEME_KEY    = 'qc_theme';           // localStorage: preferred theme

    /* ── Data source ─────────────────────────────────────────────────── */
    var DATA_CSV_URL = 'data/projects.csv';
    var DATA_COLUMNS = ['Semana', 'Fecha', 'Horario', 'Proyecto', 'Autores', 'Revisor', 'Estado', 'Avance (%)', 'Observaciones'];
    var SYNC_DEBOUNCE_MS = 800;
    var SYNC_SOURCE = 'qc-analytics-platform';
    var REMOTE_SYNC  = {
        enabled: false,
        readUrl: '',
        writeUrl: '',
        apiKey: ''
    };

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        users:           USERS,
        statusColors:    STATUS_COLORS,
        statusOptions:   STATUS_OPTIONS,
        statusBadgeClass: STATUS_BADGE_CLASS,
        storageKey:      STORAGE_KEY,
        sessionKey:      SESSION_KEY,
        themeKey:        THEME_KEY,
        dataCsvUrl:      DATA_CSV_URL,
        dataColumns:     DATA_COLUMNS,
        syncDebounceMs:  SYNC_DEBOUNCE_MS,
        syncSource:      SYNC_SOURCE,
        remoteSync:      REMOTE_SYNC
    };
}());
