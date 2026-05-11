/**
 * data.js — Data loading and persistence layer.
 * Single Responsibility: fetch the CSV, parse it, persist edits to
 * localStorage, and expose the current data matrix to the rest of the app.
 *
 * Depends on: QC.Config.
 * Storage format: JSON array of row objects keyed by CSV column names.
 *
 * ARCHITECTURE NOTE: Because this site is hosted on GitHub Pages (static),
 * data edits are stored in each user's browser localStorage only. Changes
 * made by one team member are NOT automatically visible to others. To share
 * edits, users must export the updated CSV (download button) and commit it
 * to the repository. For real-time collaboration, consider integrating a
 * cloud database service. See README.md § Limitaciones conocidas.
 */

/* global QC */
var QC = QC || {};

QC.Data = (function (Config) {
    'use strict';

    /* ── Internal state ──────────────────────────────────────────────── */
    var _rows      = [];   // Current in-memory data matrix
    var _allAuthors = [];  // Sorted unique author list

    /* ── CSV parser ──────────────────────────────────────────────────── */

    /**
     * Parse a CSV string into an array of plain objects.
     * Handles quoted fields that contain commas or newlines.
     * @param {string} csvText
     * @returns {Array<Object>}
     */
    function parseCSV(csvText) {
        /* Normalise line endings */
        var text  = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        var lines = splitCSVLines(text);

        if (lines.length < 2) { return []; }

        var headers = parseCSVLine(lines[0]);
        var rows    = [];

        for (var i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) { continue; }
            var values = parseCSVLine(lines[i]);
            var obj    = {};
            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = (values[j] !== undefined ? values[j] : '');
            }
            rows.push(obj);
        }

        return rows;
    }

    /** Split CSV text into logical lines (respecting quoted newlines). */
    function splitCSVLines(text) {
        var lines  = [];
        var line   = '';
        var inQuote = false;

        for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            if (ch === '"') {
                inQuote = !inQuote;
                line += ch;
            } else if (ch === '\n' && !inQuote) {
                lines.push(line);
                line = '';
            } else {
                line += ch;
            }
        }
        if (line) { lines.push(line); }
        return lines;
    }

    /** Parse a single CSV line into an array of field strings. */
    function parseCSVLine(line) {
        var fields = [];
        var field  = '';
        var inQ    = false;

        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            if (c === '"') {
                if (inQ && line[i + 1] === '"') { field += '"'; i++; }
                else { inQ = !inQ; }
            } else if (c === ',' && !inQ) {
                fields.push(field);
                field = '';
            } else {
                field += c;
            }
        }
        fields.push(field);
        return fields;
    }

    /* ── Data normalisation ──────────────────────────────────────────── */

    /**
     * Ensure required columns exist and have correct types.
     * Mirrors data_io.py logic from the Streamlit platform.
     * @param {Array<Object>} rows
     * @returns {Array<Object>}
     */
    function normalise(rows) {
        return rows.map(function (row, idx) {
            var r = Object.assign({}, row);

            /* Inject missing control columns */
            if (!r.hasOwnProperty('Estado'))        { r['Estado']        = 'Pendiente'; }
            if (!r.hasOwnProperty('Avance (%)'))    { r['Avance (%)']    = '0'; }
            if (!r.hasOwnProperty('Observaciones')) { r['Observaciones'] = ''; }

            /* Sanitise types */
            r['Avance (%)']    = parseInt(r['Avance (%)'], 10) || 0;
            r['Observaciones'] = String(r['Observaciones'] || '');
            r['Estado']        = String(r['Estado']        || 'Pendiente');
            r['Proyecto']      = String(r['Proyecto']      || '');

            /* Internal row ID (not written to CSV) */
            r._id = idx;

            return r;
        });
    }

    /* ── Author extraction ───────────────────────────────────────────── */

    /**
     * Build a sorted array of unique researcher names from the data.
     * @param {Array<Object>} rows
     * @returns {string[]}
     */
    function extractAuthors(rows) {
        var set = {};
        for (var i = 0; i < rows.length; i++) {
            var autores = rows[i]['Autores'] || '';
            if (!autores) { continue; }
            var parts = autores.split('; ');
            for (var j = 0; j < parts.length; j++) {
                var name = parts[j].trim();
                if (name) { set[name] = true; }
            }
        }
        return Object.keys(set).sort();
    }

    /* ── Persistence ─────────────────────────────────────────────────── */

    /**
     * Save the current data matrix to localStorage.
     * Only the editable columns are persisted per-row (keyed by _id).
     */
    function saveToStorage() {
        try {
            var editable = {};
            for (var i = 0; i < _rows.length; i++) {
                var r = _rows[i];
                editable[r._id] = {
                    'Estado':        r['Estado'],
                    'Avance (%)':    r['Avance (%)'],
                    'Observaciones': r['Observaciones'],
                    'Autores':       r['Autores']
                };
            }
            localStorage.setItem(Config.storageKey, JSON.stringify(editable));
        } catch (e) {
            /* localStorage unavailable — edits are in-memory only */
        }
    }

    /**
     * Merge persisted edits from localStorage back into the data matrix.
     * @param {Array<Object>} rows
     * @returns {Array<Object>}
     */
    function applyStoredEdits(rows) {
        try {
            var raw = localStorage.getItem(Config.storageKey);
            if (!raw) { return rows; }
            var stored = JSON.parse(raw);
            return rows.map(function (r) {
                var patch = stored[r._id];
                if (!patch) { return r; }
                var updated = Object.assign({}, r);
                if (patch.hasOwnProperty('Estado'))        { updated['Estado']        = patch['Estado']; }
                if (patch.hasOwnProperty('Avance (%)'))    { updated['Avance (%)']    = parseInt(patch['Avance (%)'], 10) || 0; }
                if (patch.hasOwnProperty('Observaciones')) { updated['Observaciones'] = patch['Observaciones']; }
                if (patch.hasOwnProperty('Autores'))       { updated['Autores']       = patch['Autores']; }
                return updated;
            });
        } catch (e) {
            return rows;
        }
    }

    /* ── Fetch and load ──────────────────────────────────────────────── */

    /**
     * Load data from CSV, apply stored edits, and resolve.
     * @returns {Promise}  Resolves when data is ready.
     */
    function load() {
        return fetch(Config.dataCsvUrl)
            .then(function (res) {
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                return res.text();
            })
            .then(function (text) {
                var raw  = parseCSV(text);
                var norm = normalise(raw);
                _rows       = applyStoredEdits(norm);
                _allAuthors = extractAuthors(_rows);
            });
    }

    /* ── Mutation API ────────────────────────────────────────────────── */

    /**
     * Update an editable field on a single row and persist.
     * @param {number} rowId   - The row's _id
     * @param {string} field   - Column name
     * @param {*}      value
     */
    function updateField(rowId, field, value) {
        for (var i = 0; i < _rows.length; i++) {
            if (_rows[i]._id === rowId) {
                _rows[i][field] = value;
                break;
            }
        }
        saveToStorage();
    }

    /**
     * Update the Autores field for all rows of a given project.
     * @param {string}   project
     * @param {string[]} authors  - Array of author names
     */
    function updateProjectAuthors(project, authors) {
        var value = authors.join('; ');
        for (var i = 0; i < _rows.length; i++) {
            if (_rows[i]['Proyecto'] === project) {
                _rows[i]['Autores'] = value;
            }
        }
        /* Rebuild author list */
        _allAuthors = extractAuthors(_rows);
        saveToStorage();
    }

    /**
     * Add a new researcher name if not already in the list.
     * @param {string} name
     */
    function addAuthor(name) {
        var trimmed = name.trim();
        if (!trimmed) { return; }
        if (_allAuthors.indexOf(trimmed) === -1) {
            _allAuthors.push(trimmed);
            _allAuthors.sort();
        }
    }

    /* ── CSV export ──────────────────────────────────────────────────── */

    /**
     * Serialise the current data matrix to a CSV string.
     * @returns {string}
     */
    function toCSV() {
        var cols = ['Semana', 'Fecha', 'Horario', 'Proyecto', 'Autores', 'Revisor', 'Estado', 'Avance (%)', 'Observaciones'];
        var lines = [cols.join(',')];

        for (var i = 0; i < _rows.length; i++) {
            var row    = _rows[i];
            var fields = cols.map(function (col) {
                var val = (row[col] !== undefined && row[col] !== null) ? String(row[col]) : '';
                /* Quote fields that contain commas, quotes, or newlines */
                if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                return val;
            });
            lines.push(fields.join(','));
        }

        return lines.join('\n');
    }

    /* ── Read accessors ──────────────────────────────────────────────── */

    /** @returns {Array<Object>} Shallow copy of the current data rows. */
    function getRows()    { return _rows.slice();    }

    /** @returns {string[]} Sorted list of all known researcher names. */
    function getAuthors() { return _allAuthors.slice(); }

    /**
     * Return unique project names preserving original order.
     * @returns {string[]}
     */
    function getProjects() {
        var seen = {};
        var list = [];
        for (var i = 0; i < _rows.length; i++) {
            var p = _rows[i]['Proyecto'];
            if (p && !seen[p]) { seen[p] = true; list.push(p); }
        }
        return list;
    }

    /**
     * For the progress chart: per unique (Proyecto, Estado), keep the row
     * with the maximum Avance (%) value — mirrors Streamlit's idxmax logic.
     * @returns {Array<{ project: string, estado: string, avance: number }>}
     */
    function getChartData() {
        var map = {};   // key: "project||estado"
        for (var i = 0; i < _rows.length; i++) {
            var r   = _rows[i];
            var key = r['Proyecto'] + '||' + r['Estado'];
            if (!map[key] || r['Avance (%)'] > map[key].avance) {
                map[key] = {
                    project: r['Proyecto'],
                    estado:  r['Estado'],
                    avance:  r['Avance (%)']
                };
            }
        }
        /* Collect and sort by avance ascending (matching Streamlit chart) */
        var items = [];
        for (var k in map) {
            if (Object.prototype.hasOwnProperty.call(map, k)) {
                items.push(map[k]);
            }
        }
        items.sort(function (a, b) { return a.avance - b.avance; });
        return items;
    }

    /**
     * Compute aggregate KPI values from the current data.
     * @returns {{ totalProjects: number, approved: number, active: number, avgProgress: number }}
     */
    function getKPIs() {
        var projects = {};
        var approved = 0;
        var active   = 0;
        var total    = 0;
        var sumAvance = 0;

        /* Per-project: use the highest-avance row as the representative */
        var projectBest = {};
        for (var i = 0; i < _rows.length; i++) {
            var r = _rows[i];
            var p = r['Proyecto'];
            if (!p) { continue; }
            if (!projectBest[p] || r['Avance (%)'] > projectBest[p]['Avance (%)']) {
                projectBest[p] = r;
            }
        }

        for (var proj in projectBest) {
            if (!Object.prototype.hasOwnProperty.call(projectBest, proj)) { continue; }
            var row = projectBest[proj];
            projects[proj] = true;
            total++;
            sumAvance += row['Avance (%)'];
            if (row['Estado'] === 'Aprobado')  { approved++; }
            if (row['Estado'] === 'En progreso' || row['Estado'] === 'En revisión') { active++; }
        }

        return {
            totalProjects: Object.keys(projects).length,
            approved:      approved,
            active:        active,
            avgProgress:   total > 0 ? (sumAvance / total) : 0
        };
    }

    /**
     * Return rows for a specific researcher (as author or reviewer).
     * Adds a 'Rol Operativo' computed column.
     * @param {string} researcher
     * @returns {Array<Object>}
     */
    function getResearcherRows(researcher) {
        var result = [];
        for (var i = 0; i < _rows.length; i++) {
            var r        = _rows[i];
            var isAuthor = (r['Autores']  || '').indexOf(researcher) !== -1;
            var isReview = (r['Revisor']  || '').indexOf(researcher) !== -1;
            if (!isAuthor && !isReview) { continue; }

            var roles = [];
            if (isAuthor) { roles.push('Autor QC'); }
            if (isReview) { roles.push('Revisor Principal'); }

            var copy            = Object.assign({}, r);
            copy['Rol Operativo'] = roles.join(' & ');
            result.push(copy);
        }
        return result;
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        load:                 load,
        getRows:              getRows,
        getAuthors:           getAuthors,
        getProjects:          getProjects,
        getChartData:         getChartData,
        getKPIs:              getKPIs,
        getResearcherRows:    getResearcherRows,
        updateField:          updateField,
        updateProjectAuthors: updateProjectAuthors,
        addAuthor:            addAuthor,
        toCSV:                toCSV
    };

}(QC.Config));
