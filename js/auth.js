/**
 * auth.js — Authentication and session management.
 * Single Responsibility: handle login, logout, session persistence, and
 * route protection. Does NOT render any DOM beyond the login form events.
 *
 * Depends on: QC.Config, QC.sha256Sync (both must be loaded first).
 * Uses: SubtleCrypto (async, modern) with QC.sha256Sync as synchronous fallback.
 */

/* global QC */
var QC = QC || {};

QC.Auth = (function (Config, sha256Sync) {
    'use strict';

    /* ── Session helpers ─────────────────────────────────────────────── */

    /**
     * Persist the authenticated user in sessionStorage.
     * sessionStorage clears automatically when the browser tab is closed.
     * @param {{ name: string, email: string }} user
     */
    function setSession(user) {
        try {
            sessionStorage.setItem(
                Config.sessionKey,
                JSON.stringify({ name: user.name, email: user.email })
            );
        } catch (e) {
            /* sessionStorage unavailable (e.g., private browsing with strict settings) */
        }
    }

    /**
     * Return the currently authenticated user object, or null.
     * @returns {{ name: string, email: string }|null}
     */
    function getSession() {
        try {
            var raw = sessionStorage.getItem(Config.sessionKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Return true if a valid session exists.
     * @returns {boolean}
     */
    function isLoggedIn() {
        return getSession() !== null;
    }

    /** Clear the session and redirect to the login page. */
    function logout() {
        try { sessionStorage.removeItem(Config.sessionKey); } catch (e) {}
        window.location.href = 'index.html';
    }

    /* ── Password hashing ────────────────────────────────────────────── */

    /**
     * Hash a plain-text password and return a Promise that resolves to
     * the hex-encoded SHA-256 digest.
     *
     * Modern browsers use the asynchronous SubtleCrypto API.
     * Legacy browsers fall back to the synchronous pure-JS implementation.
     *
     * @param {string} password
     * @returns {Promise<string>}
     */
    function hashPassword(password) {
        if (
            window.crypto &&
            window.crypto.subtle &&
            typeof window.crypto.subtle.digest === 'function' &&
            typeof window.TextEncoder !== 'undefined'
        ) {
            /* Modern path: SubtleCrypto */
            var encoder = new window.TextEncoder();
            var data    = encoder.encode(password);
            return window.crypto.subtle.digest('SHA-256', data).then(function (buffer) {
                var bytes  = new Uint8Array(buffer);
                var hex    = '';
                for (var i = 0; i < bytes.length; i++) {
                    hex += ('00' + bytes[i].toString(16)).slice(-2);
                }
                return hex;
            });
        }

        /* Legacy path: pure-JS SHA-256 */
        return Promise.resolve(sha256Sync(password));
    }

    /* ── Login logic ─────────────────────────────────────────────────── */

    /**
     * Attempt to authenticate with the given credentials.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
     */
    function login(email, password) {
        var normalEmail = email.trim().toLowerCase();

        /* Find registered user */
        var user = null;
        for (var i = 0; i < Config.users.length; i++) {
            if (Config.users[i].email.toLowerCase() === normalEmail) {
                user = Config.users[i];
                break;
            }
        }

        if (!user) {
            return Promise.resolve({
                success: false,
                error:   'Correo electrónico no registrado en la plataforma.'
            });
        }

        return hashPassword(password).then(function (hash) {
            if (hash === user.passwordHash) {
                setSession(user);
                return { success: true, user: user };
            }
            return { success: false, error: 'Contraseña incorrecta.' };
        });
    }

    /* ── Login form wiring ───────────────────────────────────────────── */

    /**
     * Initialise the login form on index.html.
     * Call this once after the DOM is ready.
     */
    function initLoginForm() {
        var form    = document.getElementById('login-form');
        var errBox  = document.getElementById('login-error');
        var btnText = document.getElementById('btn-text');
        var btnLoad = document.getElementById('btn-loading');

        if (!form) { return; }

        form.addEventListener('submit', function (evt) {
            evt.preventDefault();

            var email    = (document.getElementById('email')    || {}).value || '';
            var password = (document.getElementById('password') || {}).value || '';

            /* Show loading state */
            if (errBox)  { errBox.hidden = true; errBox.textContent = ''; }
            if (btnText) { btnText.hidden = true; }
            if (btnLoad) { btnLoad.hidden = false; }

            var submitBtn = document.getElementById('login-btn');
            if (submitBtn) { submitBtn.disabled = true; }

            login(email, password).then(function (result) {
                if (result.success) {
                    window.location.href = 'app.html';
                } else {
                    if (errBox) {
                        errBox.textContent = result.error || 'Error de autenticación.';
                        errBox.hidden = false;
                    }
                    /* Restore button */
                    if (btnText) { btnText.hidden = false; }
                    if (btnLoad) { btnLoad.hidden = true; }
                    if (submitBtn) { submitBtn.disabled = false; }
                }
            });
        });
    }

    /**
     * Guard the app page: redirect to login if not authenticated.
     * Call this at the top of app.html's inline script.
     */
    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = 'index.html';
        }
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        isLoggedIn:    isLoggedIn,
        getSession:    getSession,
        logout:        logout,
        initLoginForm: initLoginForm,
        requireAuth:   requireAuth
    };

}(QC.Config, QC.sha256Sync));
