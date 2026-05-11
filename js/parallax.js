/**
 * parallax.js
 * Mouse-tracking parallax for the hero background on the login page.
 *
 * Single Responsibility: translate .hero-layer elements in response to
 * mouse / device-orientation input using a smooth lerp + rAF loop.
 *
 * Progressive Enhancement:
 *   - Only activates when requestAnimationFrame and CSS transform are available.
 *   - Respects the user's prefers-reduced-motion media preference.
 *   - Falls back silently (CSS float animations from hero.css remain active).
 *
 * Uses only ES5 syntax for compatibility with IE 9+.
 */

/* jshint esversion: 5 */
/* global window, document */

(function (root, doc) {
    'use strict';

    // ── Feature detection ─────────────────────────────────────────────

    var hasRAF = typeof root.requestAnimationFrame === 'function';

    var hasTransform = (function () {
        var el    = doc.createElement('div');
        var props = ['transform', 'WebkitTransform', 'MozTransform', 'msTransform'];
        for (var i = 0; i < props.length; i++) {
            if (typeof el.style[props[i]] !== 'undefined') { return true; }
        }
        return false;
    }());

    var prefersNoMotion = (function () {
        if (typeof root.matchMedia !== 'function') { return false; }
        var mq = root.matchMedia('(prefers-reduced-motion: reduce)');
        return mq && mq.matches;
    }());

    // Bail early if any required feature is absent
    if (!hasRAF || !hasTransform || prefersNoMotion) { return; }

    // ── State ─────────────────────────────────────────────────────────

    /** Normalised pointer position: range [-0.5, 0.5] per axis. */
    var targetX  = 0;
    var targetY  = 0;

    /** Smoothed ("lerped") current position. */
    var currentX = 0;
    var currentY = 0;

    /**
     * Lerp factor — smaller = more sluggish follow (more parallax feel).
     * Chosen so the orbs feel weighty and independent of frame-rate.
     */
    var LERP = 0.055;

    // ── Layer configuration ───────────────────────────────────────────

    /**
     * Each entry maps a CSS selector to a displacement strength (px).
     * Varying strengths create the depth illusion.
     */
    var LAYER_CONFIG = [
        { selector: '.hero-layer--orb-1', strength: 30 },
        { selector: '.hero-layer--orb-2', strength: 18 },
        { selector: '.hero-layer--orb-3', strength: 42 }
    ];

    /** Resolved layer objects: { el, strength } */
    var layers = [];

    // ── Transform helper ──────────────────────────────────────────────

    /**
     * Apply a 2-D translate to an element in a cross-browser way,
     * respecting vendor-prefixed transform properties.
     */
    function setTranslate(el, dx, dy) {
        var val = 'translate(' + dx.toFixed(2) + 'px, ' + dy.toFixed(2) + 'px)';
        el.style.transform        = val;
        el.style.WebkitTransform  = val;
        el.style.MozTransform     = val;
        el.style.msTransform      = val;
    }

    // ── Event handlers ────────────────────────────────────────────────

    function onMouseMove(e) {
        targetX = (e.clientX / root.innerWidth)  - 0.5;
        targetY = (e.clientY / root.innerHeight) - 0.5;
    }

    /** Device-orientation support for touch / mobile visitors. */
    function onDeviceOrientation(e) {
        if (e.gamma === null || e.beta === null) { return; }
        // gamma: left/right tilt, range [-90, 90]
        // beta:  front/back tilt — clamp to a comfortable [-45, 45] range
        targetX =  (e.gamma / 90);
        targetY =  (Math.max(-45, Math.min(45, e.beta)) / 45) * 0.5;
    }

    // ── Animation loop ────────────────────────────────────────────────

    function tick() {
        currentX += (targetX - currentX) * LERP;
        currentY += (targetY - currentY) * LERP;

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            setTranslate(layer.el, currentX * layer.strength, currentY * layer.strength);
        }

        root.requestAnimationFrame(tick);
    }

    // ── Initialisation ────────────────────────────────────────────────

    function init() {
        for (var i = 0; i < LAYER_CONFIG.length; i++) {
            var cfg = LAYER_CONFIG[i];
            var el  = doc.querySelector(cfg.selector);
            if (el) {
                layers.push({ el: el, strength: cfg.strength });
            }
        }

        // No hero layers found on this page — skip silently
        if (!layers.length) { return; }

        doc.addEventListener('mousemove', onMouseMove);

        if (typeof root.DeviceOrientationEvent !== 'undefined') {
            root.addEventListener('deviceorientation', onDeviceOrientation);
        }

        root.requestAnimationFrame(tick);
    }

    // Boot after the DOM is ready
    if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}(window, document));
