/**
 * tabs/profiles.js — Researcher Profiles tab.
 * Single Responsibility: render the individual researcher performance view,
 * including KPI cards and a detailed project table.
 *
 * Depends on: QC.Config, QC.Data.
 */

/* global QC */
var QC = QC || {};
QC.Tabs = QC.Tabs || {};

QC.Tabs.Profiles = (function (Config, Data) {
    'use strict';

    /* ── HTML escape helper ──────────────────────────────────────────── */

    function _esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ── Researcher selector ─────────────────────────────────────────── */

    function populateResearcherSelect() {
        var sel     = document.getElementById('researcher-select');
        if (!sel) { return; }

        var authors = Data.getAuthors();
        /* Preserve the blank default option */
        sel.innerHTML = '<option value="">— Seleccione un investigador —</option>';
        for (var i = 0; i < authors.length; i++) {
            var opt = document.createElement('option');
            opt.value       = authors[i];
            opt.textContent = authors[i];
            sel.appendChild(opt);
        }

        sel.addEventListener('change', function () {
            renderProfile(sel.value);
        });
    }

    /* ── Individual profile rendering ────────────────────────────────── */

    function renderProfile(researcher) {
        var metricsEl = document.getElementById('researcher-metrics');
        var tableEl   = document.getElementById('researcher-table');

        if (!metricsEl || !tableEl) { return; }

        if (!researcher) {
            metricsEl.hidden = true;
            tableEl.hidden   = true;
            return;
        }

        var rows = Data.getResearcherRows(researcher);

        if (rows.length === 0) {
            metricsEl.innerHTML =
                '<p class="info-message">El investigador seleccionado no presenta carga operativa asignada.</p>';
            metricsEl.hidden = false;
            tableEl.hidden   = true;
            return;
        }

        /* ── KPI computation ── */
        var totalProjects = rows.length;
        var supervisorCount = 0;
        var sumAvance = 0;

        for (var i = 0; i < rows.length; i++) {
            sumAvance += (parseInt(rows[i]['Avance (%)'], 10) || 0);
            if ((rows[i]['Rol Operativo'] || '').indexOf('Revisor') !== -1) {
                supervisorCount++;
            }
        }
        var avgAvance = totalProjects > 0 ? (sumAvance / totalProjects) : 0;

        /* ── KPI cards ── */
        metricsEl.innerHTML =
            '<div class="metrics-grid" style="margin-bottom: 1.5rem;">' +
            _metricCard('Carga de Proyectos',    totalProjects) +
            _metricCard('Rol de Supervisión',    supervisorCount) +
            _metricCard('Tasa de Ejecución Media', avgAvance.toFixed(1) + '%') +
            '</div>';
        metricsEl.hidden = false;

        /* ── Detail table ── */
        var tableHtml =
            '<div class="table-wrapper">' +
            '<table class="data-table profile-table" aria-label="Proyectos del investigador ' + _esc(researcher) + '">' +
            '<thead><tr>' +
            '<th scope="col">Semana</th>' +
            '<th scope="col">Fecha</th>' +
            '<th scope="col">Horario</th>' +
            '<th scope="col">Proyecto</th>' +
            '<th scope="col">Rol Operativo</th>' +
            '<th scope="col">Estado</th>' +
            '<th scope="col" class="progress-cell">Nivel de Ejecución</th>' +
            '</tr></thead><tbody>';

        for (var j = 0; j < rows.length; j++) {
            var r      = rows[j];
            var avance = parseInt(r['Avance (%)'], 10) || 0;
            var badgeCls = Config.statusBadgeClass[r['Estado']] || 'status-badge--pending';

            tableHtml +=
                '<tr>' +
                '<td class="td-readonly">' + _esc(String(r['Semana'] || '')) + '</td>' +
                '<td class="td-readonly">' + _esc(r['Fecha'] || '') + '</td>' +
                '<td class="td-readonly">' + _esc(r['Horario'] || '') + '</td>' +
                '<td>' + _esc(r['Proyecto'] || '') + '</td>' +
                '<td>' + _esc(r['Rol Operativo'] || '') + '</td>' +
                '<td>' +
                    '<span class="status-badge ' + badgeCls + '">' +
                    _esc(r['Estado'] || '') +
                    '</span>' +
                '</td>' +
                '<td class="progress-cell">' +
                    '<div class="progress-bar" role="progressbar" ' +
                    'aria-valuenow="' + avance + '" aria-valuemin="0" aria-valuemax="100" ' +
                    'aria-label="' + avance + '% completado">' +
                        '<div class="progress-bar__fill" style="width:' + avance + '%"></div>' +
                    '</div>' +
                    '<span style="font-size:11px;color:var(--clr-subtext);margin-left:6px;">' +
                    avance + '%' +
                    '</span>' +
                '</td>' +
                '</tr>';
        }

        tableHtml += '</tbody></table></div>';
        tableEl.innerHTML = tableHtml;
        tableEl.hidden    = false;
    }

    /* ── Helper: metric card HTML ────────────────────────────────────── */

    function _metricCard(label, value) {
        return '<article class="metric-card">' +
            '<p class="metric-card__label">' + _esc(String(label)) + '</p>' +
            '<p class="metric-card__value">' + _esc(String(value)) + '</p>' +
            '</article>';
    }

    /* ── Public: initialise the tab ──────────────────────────────────── */

    /**
     * Populate the researcher selector.
     * Call after QC.Data.load() resolves.
     */
    function init() {
        populateResearcherSelect();
        /* Hide profile sections until a researcher is chosen */
        var metricsEl = document.getElementById('researcher-metrics');
        var tableEl   = document.getElementById('researcher-table');
        if (metricsEl) { metricsEl.hidden = true; }
        if (tableEl)   { tableEl.hidden   = true; }
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        init: init
    };

}(QC.Config, QC.Data));
