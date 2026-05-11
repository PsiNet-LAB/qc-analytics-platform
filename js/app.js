/**
 * app.js — Main application bootstrap and orchestrator.
 * Single Responsibility: initialise all modules in the correct order,
 * wire tab-switching, and manage the loading overlay.
 *
 * Depends on: QC.Auth, QC.Data, QC.Sidebar, QC.Tabs.General, QC.Tabs.Profiles.
 * Must be the last script loaded in app.html.
 */

/* global QC */
var QC = QC || {};

QC.App = (function (Auth, Data, Sidebar, TabGeneral, TabProfiles) {
    'use strict';

    /* ── Loading overlay ─────────────────────────────────────────────── */

    function showLoading() {
        var overlay = document.getElementById('loading-overlay');
        if (overlay) { overlay.removeAttribute('hidden'); }
    }

    function hideLoading() {
        var overlay = document.getElementById('loading-overlay');
        if (overlay) { overlay.setAttribute('hidden', ''); }
    }

    /* ── Error display ───────────────────────────────────────────────── */

    function showGlobalError(message) {
        var main = document.getElementById('main-content');
        if (!main) { return; }

        var err = document.createElement('div');
        err.className = 'info-message';
        err.setAttribute('role', 'alert');
        err.textContent = 'Error crítico: ' + message + '. Recargue la página o contacte al administrador.';
        main.innerHTML = '';
        main.appendChild(err);
    }

    /* ── Tab switching ───────────────────────────────────────────────── */

    function wireTabs() {
        var tabs = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', _onTabClick);
        }
    }

    function _onTabClick() {
        var tabName   = this.getAttribute('data-tab');
        var allBtns   = document.querySelectorAll('.tab-btn');
        var allPanels = document.querySelectorAll('.tab-panel');

        /* Deactivate all */
        for (var i = 0; i < allBtns.length; i++) {
            allBtns[i].classList.remove('tab-btn--active');
            allBtns[i].setAttribute('aria-selected', 'false');
        }
        for (var j = 0; j < allPanels.length; j++) {
            allPanels[j].classList.add('tab-panel--hidden');
            allPanels[j].hidden = true;
        }

        /* Activate selected */
        this.classList.add('tab-btn--active');
        this.setAttribute('aria-selected', 'true');

        var panel = document.getElementById('tab-' + tabName);
        if (panel) {
            panel.classList.remove('tab-panel--hidden');
            panel.hidden = false;
        }
    }

    /* ── Bootstrap ───────────────────────────────────────────────────── */

    /**
     * Main entry point.
     * 1. Guard: redirect to login if not authenticated.
     * 2. Show loading overlay.
     * 3. Load CSV data.
     * 4. Initialise all UI modules.
     * 5. Hide loading overlay.
     */
    function init() {
        Auth.requireAuth();

        showLoading();

        Data.load()
            .then(function () {
                /* Initialise sidebar (theme, user card, logout, mobile toggle) */
                Sidebar.init();

                /* Render General tab */
                TabGeneral.render();

                /* Initialise Profiles tab */
                TabProfiles.init();

                /* Wire tab switching */
                wireTabs();

                hideLoading();
            })
            ['catch'](function (err) {
                hideLoading();
                showGlobalError(
                    (err && err.message) ? err.message : 'No se pudo cargar la matriz de datos'
                );
            });
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        init: init
    };

}(QC.Auth, QC.Data, QC.Sidebar, QC.Tabs.General, QC.Tabs.Profiles));

/* Auto-start when the DOM is fully loaded */
(function () {
    'use strict';
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { QC.App.init(); });
    } else {
        QC.App.init();
    }
}());
