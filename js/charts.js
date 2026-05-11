/**
 * charts.js — Chart rendering wrapper.
 * Single Responsibility: create and update the horizontal-bar progress chart
 * using Chart.js. Isolates all Chart.js specifics from the tab modules.
 *
 * Depends on: QC.Config, Chart.js (loaded via CDN before this script).
 */

/* global QC, Chart */
var QC = QC || {};

QC.Charts = (function (Config) {
    'use strict';

    var _chart = null;   // Chart.js instance

    /* ── Colour helpers ──────────────────────────────────────────────── */

    /**
     * Return the background colour for a given status string.
     * @param {string} status
     * @returns {string} CSS colour
     */
    function colorForStatus(status) {
        return Config.statusColors[status] || '#CCCCCC';
    }

    /* ── Chart construction ──────────────────────────────────────────── */

    /**
     * Build Chart.js dataset objects from chart data items.
     * Each status becomes a separate dataset (to support per-bar colouring).
     *
     * @param {Array<{ project: string, estado: string, avance: number }>} items
     * @param {string[]} labels  - Ordered project names (Y axis)
     * @returns {Array} Chart.js datasets
     */
    function buildDatasets(items, labels) {
        var statuses = Config.statusOptions;
        var datasets = [];

        for (var s = 0; s < statuses.length; s++) {
            var status = statuses[s];
            var data   = labels.map(function (label) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].project === label && items[i].estado === status) {
                        return items[i].avance;
                    }
                }
                return 0;
            });

            /* Only include datasets that have at least one non-zero value */
            var hasData = false;
            for (var d = 0; d < data.length; d++) {
                if (data[d] > 0) { hasData = true; break; }
            }
            if (!hasData) { continue; }

            datasets.push({
                label:           status,
                data:            data,
                backgroundColor: colorForStatus(status),
                borderWidth:     0,
                barThickness:    18
            });
        }

        return datasets;
    }

    /* ── Chart text colour ───────────────────────────────────────────── */

    function getTextColor() {
        var body = document.body;
        if (body && body.classList && body.classList.contains('theme-dark')) {
            return '#ECECEC';
        }
        return '#1A2332';
    }

    function getGridColor() {
        var body = document.body;
        if (body && body.classList && body.classList.contains('theme-dark')) {
            return '#333333';
        }
        return '#D0D7DE';
    }

    /* ── Public: render or refresh the chart ─────────────────────────── */

    /**
     * Render (or re-render) the progress chart on the given canvas element.
     * Safely handles the case where Chart.js is not loaded (e.g., offline).
     *
     * @param {HTMLCanvasElement} canvas
     * @param {Array<{ project: string, estado: string, avance: number }>} items
     */
    function render(canvas, items) {
        if (typeof Chart === 'undefined') {
            /* Chart.js not available — show a simple table fallback */
            var parent = canvas.parentNode;
            if (parent) {
                var fallback = document.createElement('p');
                fallback.className = 'info-message';
                fallback.textContent = 'Gráfico no disponible (Chart.js no cargado). Por favor, verifique su conexión.';
                parent.replaceChild(fallback, canvas);
            }
            return;
        }

        /* Destroy previous instance to avoid memory leaks on re-renders */
        if (_chart) {
            _chart.destroy();
            _chart = null;
        }

        /* Unique, sorted project labels */
        var labelSet = {};
        for (var i = 0; i < items.length; i++) { labelSet[items[i].project] = items[i].avance; }
        /* Sort labels by avance ascending (mirrors Streamlit's sort_values) */
        var labels = items
            .slice()
            .sort(function (a, b) { return a.avance - b.avance; })
            .reduce(function (acc, item) {
                if (acc.indexOf(item.project) === -1) { acc.push(item.project); }
                return acc;
            }, []);

        var textColor = getTextColor();
        var gridColor = getGridColor();
        var datasets  = buildDatasets(items, labels);

        _chart = new Chart(canvas, {
            type: 'horizontalBar',   /* Chart.js 2.x */
            data: {
                labels:   labels,
                datasets: datasets
            },
            options: {
                responsive:          true,
                maintainAspectRatio: false,
                legend: {
                    display:  true,
                    position: 'top',
                    labels: {
                        fontColor:  textColor,
                        fontSize:   11,
                        fontFamily: 'Montserrat, sans-serif',
                        boxWidth:   14
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function (item, data) {
                            var ds  = data.datasets[item.datasetIndex];
                            var val = item.xLabel;
                            return ' ' + ds.label + ': ' + val + '%';
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        stacked:  false,
                        ticks:    { display: false, min: 0, max: 100 },
                        gridLines: { display: false },
                        scaleLabel: { display: false }
                    }],
                    yAxes: [{
                        stacked: false,
                        ticks: {
                            fontColor:  textColor,
                            fontSize:   13,
                            fontFamily: 'Montserrat, sans-serif'
                        },
                        gridLines: { display: false }
                    }]
                },
                layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
                plugins: {
                    datalabels: false
                }
            }
        });
    }

    /**
     * Update chart colours when the theme changes (without refetching data).
     */
    function updateTheme() {
        if (!_chart) { return; }
        var textColor = getTextColor();

        /* Update legend font colour */
        if (_chart.options.legend && _chart.options.legend.labels) {
            _chart.options.legend.labels.fontColor = textColor;
        }
        /* Update Y axis tick colour */
        if (_chart.options.scales && _chart.options.scales.yAxes) {
            for (var i = 0; i < _chart.options.scales.yAxes.length; i++) {
                if (_chart.options.scales.yAxes[i].ticks) {
                    _chart.options.scales.yAxes[i].ticks.fontColor = textColor;
                }
            }
        }
        _chart.update();
    }

    /** Destroy the chart instance (call on page unload if needed). */
    function destroy() {
        if (_chart) { _chart.destroy(); _chart = null; }
    }

    /* ── Public API ──────────────────────────────────────────────────── */
    return {
        render:      render,
        updateTheme: updateTheme,
        destroy:     destroy
    };

}(QC.Config));
