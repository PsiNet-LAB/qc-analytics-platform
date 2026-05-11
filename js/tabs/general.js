/**
 * tabs/general.js — General Operations Panel tab.
 * Single Responsibility: render and manage the main operations panel:
 *   - KPI metric cards
 *   - Convergencia Operativa chart
 *   - Inline-edit data table
 *   - CSV download button
 *   - Team assignment section
 *
 * Depends on: QC.Config, QC.Auth, QC.Data, QC.Charts.
 */

/* global QC */
var QC = QC || {};
QC.Tabs = QC.Tabs || {};

QC.Tabs.General = (function (Config, Auth, Data, Charts) {
    'use strict';

    /* ── Toast helper ─────────────────────────────────────────────────── */

    var _toastTimer = null;

    function showToast(message, type) {
        var toast = document.getElementById('toast');
        if (!toast) { return; }

        toast.textContent = message;
        toast.className   = 'toast toast--' + (type || 'success') + ' toast--visible';

        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(function () {
            toast.className = 'toast toast--' + (type || 'success');
        }, 3000);
    }

    /* ══════════════════════════════════════════════════════════════════
       1. KPI METRICS
       ══════════════════════════════════════════════════════════════════ */

    /**
     * Render the four KPI metric cards.
     * The container element must exist in the DOM before calling.
     */
    function renderMetrics() {
        var container = document.getElementById('metrics-grid');
        if (!container) { return; }

        var kpi = Data.getKPIs();

        var cards = [
            { label: 'Instrumentos Totales',      value: kpi.totalProjects                 },
            { label: 'Nivel de Aprobación',        value: kpi.approved                      },
            { label: 'Flujo Activo',               value: kpi.active                        },
            { label: 'Índice de Progreso Medio',   value: kpi.avgProgress.toFixed(1) + '%'  }
        ];

        container.innerHTML = '';

        for (var i = 0; i < cards.length; i++) {
            var c   = cards[i];
            var div = document.createElement('article');
            div.className = 'metric-card';
            div.innerHTML =
                '<p class="metric-card__label">' + _esc(c.label) + '</p>' +
                '<p class="metric-card__value">' + _esc(String(c.value)) + '</p>';
            container.appendChild(div);
        }
    }

    /* ══════════════════════════════════════════════════════════════════
       2. PROGRESS CHART
       ══════════════════════════════════════════════════════════════════ */

    function renderChart() {
        var canvas = document.getElementById('progress-chart');
        if (!canvas) { return; }
        var items = Data.getChartData();
        Charts.render(canvas, items);
    }

    /* ══════════════════════════════════════════════════════════════════
       3. EDIT TABLE
       ══════════════════════════════════════════════════════════════════ */

    function renderEditTable() {
        var container = document.getElementById('edit-table-container');
        if (!container) { return; }

        var canEdit = Auth.canEdit();
        var rows = Data.getRows();

        /* Build table */
        var html =
            (canEdit ? '' :
                '<p class="info-message">Está viendo la plataforma en modo lectura. Solo las cuentas autorizadas pueden editar la matriz.</p>') +
            '<div class="table-wrapper">' +
            '<table class="data-table" aria-label="' +
                (canEdit ? 'Registro de proyectos editable' : 'Registro de proyectos en modo lectura') +
            '">' +
            '<thead><tr>' +
            '<th scope="col">Fecha</th>' +
            '<th scope="col">Horario</th>' +
            '<th scope="col">Proyecto</th>' +
            '<th scope="col">Estado</th>' +
            '<th scope="col">Avance (%)</th>' +
            '<th scope="col">Notas Operativas</th>' +
            '</tr></thead>' +
            '<tbody id="edit-table-body">';

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            html += _buildTableRow(r, canEdit);
        }

        html += '</tbody></table></div>';
        container.innerHTML = html;

        /* Wire change events via delegation */
        var tbody = document.getElementById('edit-table-body');
        if (tbody) {
            tbody.addEventListener('change', _onTableChange);
        }
    }

    function _buildTableRow(r, canEdit) {
        var id      = r._id;
        var fecha   = _esc(r['Fecha']   || '');
        var horario = _esc(r['Horario'] || '');
        var project = _esc(r['Proyecto'] || '');
        var estado  = r['Estado'] || 'Pendiente';
        var avance  = parseInt(r['Avance (%)'], 10) || 0;
        var notas   = _esc(r['Observaciones'] || '');
        var badgeCls = Config.statusBadgeClass[estado] || 'status-badge--pending';

        if (!canEdit) {
            return '<tr data-row-id="' + id + '">' +
                '<td class="td-readonly">' + fecha   + '</td>' +
                '<td class="td-readonly">' + horario + '</td>' +
                '<td class="td-readonly">' + project + '</td>' +
                '<td><span class="status-badge ' + badgeCls + '">' + _esc(estado) + '</span></td>' +
                '<td class="td-readonly">' + avance + '%</td>' +
                '<td class="td-readonly">' + (notas || '—') + '</td>' +
                '</tr>';
        }

        /* Build Estado <select> */
        var selectOpts = '';
        var opts = Config.statusOptions;
        for (var j = 0; j < opts.length; j++) {
            var sel = opts[j] === estado ? ' selected' : '';
            selectOpts += '<option value="' + _esc(opts[j]) + '"' + sel + '>' + _esc(opts[j]) + '</option>';
        }

        return '<tr data-row-id="' + id + '">' +
            '<td class="td-readonly">' + fecha   + '</td>' +
            '<td class="td-readonly">' + horario + '</td>' +
            '<td class="td-readonly">' + project + '</td>' +
            '<td>' +
                '<select class="td-select" data-field="Estado" aria-label="Estado de ' + project + '">' +
                selectOpts +
                '</select>' +
            '</td>' +
            '<td>' +
                '<input type="number" class="td-number" data-field="Avance (%)" ' +
                'min="0" max="100" step="5" value="' + avance + '" ' +
                'aria-label="Avance de ' + project + '">' +
            '</td>' +
            '<td>' +
                '<input type="text" class="td-input" data-field="Observaciones" ' +
                'value="' + notas + '" ' +
                'aria-label="Notas de ' + project + '">' +
            '</td>' +
            '</tr>';
    }

    function _onTableChange(evt) {
        if (!Auth.canEdit()) { return; }

        var target = evt.target || evt.srcElement;
        if (!target) { return; }

        var tr = target.closest ? target.closest('tr[data-row-id]') :
                 _closestTr(target);
        if (!tr) { return; }

        var rowId = parseInt(tr.getAttribute('data-row-id'), 10);
        var field = target.getAttribute('data-field');
        if (!field) { return; }

        var value = target.value;
        if (field === 'Avance (%)') { value = parseInt(value, 10) || 0; }

        Data.updateField(rowId, field, value);
        tr.classList.add('row--modified');

        /* Refresh KPI cards and chart silently */
        renderMetrics();
        renderChart();

        showToast('Cambio guardado.', 'success');
    }

    /** Fallback for Element.closest in IE */
    function _closestTr(el) {
        while (el && el.tagName) {
            if (el.tagName.toLowerCase() === 'tr' && el.getAttribute('data-row-id')) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        }
        return null;
    }

    /* ══════════════════════════════════════════════════════════════════
       4. CSV DOWNLOAD
       ══════════════════════════════════════════════════════════════════ */

    function wireDownload() {
        var btn = document.getElementById('download-btn');
        if (!btn) { return; }

        btn.addEventListener('click', function () {
            var csv  = Data.toCSV();
            var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });

            /* Modern download approach */
            if (window.URL && window.URL.createObjectURL) {
                var url  = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href     = url;
                link.download = 'Matriz_QC_Actualizada.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(function () { URL.revokeObjectURL(url); }, 100);
            } else if (navigator.msSaveBlob) {
                /* IE 10 / 11 */
                navigator.msSaveBlob(blob, 'Matriz_QC_Actualizada.csv');
            } else {
                showToast('Descarga no soportada en este navegador.', 'error');
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════════
       5. TEAM ASSIGNMENT
       ══════════════════════════════════════════════════════════════════ */

    function renderTeamAssignment() {
        if (!Auth.canEdit()) {
            _renderReadOnlyTeamAssignment();
            return;
        }

        _populateProjectSelect();
        _populateAuthorMultiselect();
        _wireTeamAssignment();
    }

    function _renderReadOnlyTeamAssignment() {
        var section = document.getElementById('team-assignment');
        if (!section) { return; }

        section.innerHTML =
            '<h3 class="section-title" id="team-assignment-title">Gestión de Equipos de Asignación</h3>' +
            '<p class="info-message">La gestión de equipos está disponible solo para cuentas autenticadas.</p>';
    }

    function _populateProjectSelect() {
        var sel      = document.getElementById('project-select');
        if (!sel) { return; }

        var projects = Data.getProjects();
        sel.innerHTML = '';
        for (var i = 0; i < projects.length; i++) {
            var opt   = document.createElement('option');
            opt.value = projects[i];
            opt.textContent = projects[i];
            sel.appendChild(opt);
        }

        /* Update authors multiselect when project changes */
        sel.addEventListener('change', function () {
            _syncAuthorsToProject(sel.value);
        });

        /* Trigger once to initialise */
        if (projects.length > 0) { _syncAuthorsToProject(projects[0]); }
    }

    function _populateAuthorMultiselect() {
        var ms = document.getElementById('authors-multiselect');
        if (!ms) { return; }

        var authors = Data.getAuthors();
        ms.innerHTML = '';
        for (var i = 0; i < authors.length; i++) {
            var opt = document.createElement('option');
            opt.value = authors[i];
            opt.textContent = authors[i];
            ms.appendChild(opt);
        }
    }

    function _syncAuthorsToProject(project) {
        var ms   = document.getElementById('authors-multiselect');
        var rows = Data.getRows();
        if (!ms || !project) { return; }

        /* Find current authors for this project */
        var current = [];
        for (var i = 0; i < rows.length; i++) {
            if (rows[i]['Proyecto'] === project) {
                var autores = rows[i]['Autores'] || '';
                if (autores) { current = autores.split('; '); }
                break;
            }
        }

        /* Refresh option list from master list */
        var allAuthors = Data.getAuthors();
        ms.innerHTML = '';
        for (var j = 0; j < allAuthors.length; j++) {
            var opt = document.createElement('option');
            opt.value = allAuthors[j];
            opt.textContent = allAuthors[j];
            if (current.indexOf(allAuthors[j]) !== -1) { opt.selected = true; }
            ms.appendChild(opt);
        }
    }

    function _wireTeamAssignment() {
        var addInput = document.getElementById('new-author-input');
        var updateBtn = document.getElementById('update-team-btn');
        var projectSel = document.getElementById('project-select');

        if (addInput) {
            addInput.addEventListener('keydown', function (evt) {
                var key = evt.key || evt.keyCode;
                if (key === 'Enter' || key === 13) {
                    evt.preventDefault();
                    _addNewAuthor(addInput.value);
                    addInput.value = '';
                }
            });
        }

        if (updateBtn) {
            updateBtn.addEventListener('click', function () {
                /* Add any pending new author first */
                if (addInput && addInput.value.trim()) {
                    _addNewAuthor(addInput.value.trim());
                    addInput.value = '';
                }

                var project = projectSel ? projectSel.value : '';
                var ms      = document.getElementById('authors-multiselect');
                if (!project || !ms) { return; }

                /* Collect selected options */
                var selected = [];
                var opts = ms.options;
                for (var i = 0; i < opts.length; i++) {
                    if (opts[i].selected) { selected.push(opts[i].value); }
                }

                Data.updateProjectAuthors(project, selected);
                showToast('Equipo actualizado.', 'success');

                /* Refresh the author list in case new names were added */
                _populateAuthorMultiselect();
                _syncAuthorsToProject(project);
            });
        }
    }

    function _addNewAuthor(name) {
        var trimmed = (name || '').trim();
        if (!trimmed) { return; }
        Data.addAuthor(trimmed);

        /* Add to multiselect if not already present */
        var ms = document.getElementById('authors-multiselect');
        if (!ms) { return; }
        for (var i = 0; i < ms.options.length; i++) {
            if (ms.options[i].value === trimmed) { return; }
        }
        var opt = document.createElement('option');
        opt.value = trimmed;
        opt.textContent = trimmed;
        ms.appendChild(opt);
    }

    /* ── HTML escape helper ──────────────────────────────────────────── */

    function _esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ── Public: full render ─────────────────────────────────────────── */

    /**
     * Render all sub-sections of the General tab.
     * Call after QC.Data.load() resolves.
     */
    function render() {
        renderMetrics();
        renderChart();
        renderEditTable();
        wireDownload();
        renderTeamAssignment();
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        render:       render,
        renderMetrics: renderMetrics,
        renderChart:   renderChart
    };

}(QC.Config, QC.Auth, QC.Data, QC.Charts));
