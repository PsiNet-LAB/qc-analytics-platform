/**
 * sidebar.js — Sidebar rendering and theme management.
 * Single Responsibility: populate the sidebar user card, wire the theme
 * radio buttons, and manage the mobile sidebar toggle.
 *
 * Depends on: QC.Config, QC.Auth, QC.Charts.
 */

/* global QC */
var QC = QC || {};

QC.Sidebar = (function (Config, Auth, Charts) {
    'use strict';

    /* ── Internal helpers ────────────────────────────────────────────── */

    function applyTheme(theme) {
        var body = document.body;
        if (theme === 'dark') {
            body.classList.add('theme-dark');
            body.classList.remove('theme-light');
        } else {
            body.classList.add('theme-light');
            body.classList.remove('theme-dark');
        }
        /* Persist preference */
        try { localStorage.setItem(Config.themeKey, theme); } catch (e) {}
        /* Update chart colours */
        Charts.updateTheme();
    }

    /* ── User card ───────────────────────────────────────────────────── */

    function renderUserCard() {
        var user      = Auth.getSession();
        var nameEl    = document.getElementById('sidebar-user-name');
        var emailEl   = document.getElementById('sidebar-user-email');

        if (nameEl) {
            nameEl.textContent = user ? user.name : 'Modo lectura pública';
        }
        if (emailEl) {
            emailEl.textContent = user ? user.email : 'Inicie sesión para habilitar la edición.';
        }
    }

    /* ── Logout button ───────────────────────────────────────────────── */

    function wireLogout() {
        var btn = document.getElementById('logout-btn');
        if (!btn) { return; }

        if (!Auth.isLoggedIn()) {
            btn.textContent = 'Iniciar sesión para editar';
            btn.setAttribute('aria-label', 'Iniciar sesión para editar');
            btn.addEventListener('click', function () {
                window.location.href = 'index.html';
            });
            return;
        }

        btn.addEventListener('click', function () {
            Auth.logout();
        });
    }

    /* ── Theme controls ──────────────────────────────────────────────── */

    function wireThemeControls() {
        var radios = document.querySelectorAll('input[name="theme"]');
        for (var i = 0; i < radios.length; i++) {
            radios[i].addEventListener('change', function () {
                if (this.checked) { applyTheme(this.value); }
            });
        }
    }

    /** Apply the stored theme preference on page load. */
    function restoreTheme() {
        var saved = null;
        try { saved = localStorage.getItem(Config.themeKey); } catch (e) {}
        var theme  = saved === 'dark' ? 'dark' : 'light';

        applyTheme(theme);

        /* Sync radio selection */
        var radios = document.querySelectorAll('input[name="theme"]');
        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = (radios[i].value === theme);
        }
    }

    /* ── Mobile sidebar toggle ───────────────────────────────────────── */

    function wireMobileToggle() {
        var toggleBtn = document.getElementById('sidebar-toggle');
        var sidebar   = document.getElementById('sidebar');
        var overlay   = document.getElementById('sidebar-overlay');

        if (!toggleBtn || !sidebar) { return; }

        function openSidebar() {
            sidebar.classList.add('sidebar--open');
            toggleBtn.setAttribute('aria-expanded', 'true');
            if (overlay) { overlay.classList.add('sidebar-overlay--visible'); }
        }

        function closeSidebar() {
            sidebar.classList.remove('sidebar--open');
            toggleBtn.setAttribute('aria-expanded', 'false');
            if (overlay) { overlay.classList.remove('sidebar-overlay--visible'); }
        }

        toggleBtn.addEventListener('click', function () {
            var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            if (expanded) { closeSidebar(); } else { openSidebar(); }
        });

        /* Close sidebar when overlay is clicked */
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        /* Close sidebar on Escape key */
        document.addEventListener('keydown', function (evt) {
            var key = evt.key || evt.keyCode;
            if (key === 'Escape' || key === 27) { closeSidebar(); }
        });
    }

    /* ── Public: initialise ──────────────────────────────────────────── */

    /**
     * Initialise all sidebar functionality.
     * Call once after the DOM is ready.
     */
    function init() {
        renderUserCard();
        wireLogout();
        wireThemeControls();
        restoreTheme();
        wireMobileToggle();
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        init: init
    };

}(QC.Config, QC.Auth, QC.Charts));
