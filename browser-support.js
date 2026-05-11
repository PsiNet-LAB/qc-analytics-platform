/**
 * browser-support.js
 * Legacy browser compatibility layer for Plataforma Analítica QC.
 *
 * Responsibilities:
 *   1. Feature detection  — identify missing CSS / JS APIs.
 *   2. Class flags        — add `no-*` classes to <html> so CSS can adapt.
 *   3. Polyfills          — patch missing functionality inline where feasible.
 *   4. Developer guidance — warn in the console about APIs that need external shims.
 *
 * This file intentionally uses only ES5 syntax so it can run in IE 9+
 * without any transpilation step.
 */

/* jshint esversion: 5 */
/* global window, document, CSS */

(function (root, doc) {
    'use strict';

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    /** Add a class to the <html> element. */
    function addHtmlClass(cls) {
        var el = doc.documentElement;
        if (el.classList) {
            el.classList.add(cls);
        } else {
            el.className += (el.className ? ' ' : '') + cls;
        }
    }

    /** Safely test a CSS feature via CSS.supports (absent in IE). */
    function cssSupports(property, value) {
        try {
            return typeof CSS !== 'undefined' &&
                typeof CSS.supports === 'function' &&
                CSS.supports(property, value);
        } catch (e) {
            return false;
        }
    }

    // ------------------------------------------------------------------
    // 1. CSS CUSTOM PROPERTIES (CSS Variables)
    //    Not supported in IE 11 and below.
    // ------------------------------------------------------------------
    var hasCSSVars = cssSupports('--test', '0');

    if (!hasCSSVars) {
        addHtmlClass('no-css-vars');

        // Inject static fallback styles so the page remains usable
        var fallback = doc.createElement('style');
        fallback.textContent =
            'body { background-color: #F5F7FA; color: #1A2332; }' +
            'iframe { border: none; width: 100%; height: 100%; display: block; }';
        doc.head.appendChild(fallback);
    }

    // ------------------------------------------------------------------
    // 2. CSS GRID
    //    Add a flag class for browsers that lack Grid support.
    // ------------------------------------------------------------------
    var hasCSSGrid = cssSupports('display', 'grid');
    if (!hasCSSGrid) {
        addHtmlClass('no-css-grid');
    }

    // ------------------------------------------------------------------
    // 3. FLEXBOX (older IE uses the -ms- prefix)
    // ------------------------------------------------------------------
    var hasFlexbox = cssSupports('display', 'flex');
    if (!hasFlexbox) {
        addHtmlClass('no-flexbox');
    }

    // ------------------------------------------------------------------
    // 4. Object.assign polyfill (absent in IE 11)
    // ------------------------------------------------------------------
    if (typeof Object.assign !== 'function') {
        Object.assign = function assign(target) {
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var output = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if (source != null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            output[key] = source[key];
                        }
                    }
                }
            }
            return output;
        };
    }

    // ------------------------------------------------------------------
    // 5. Array.prototype.includes polyfill (absent in IE 11)
    // ------------------------------------------------------------------
    if (!Array.prototype.includes) {
        /* eslint-disable no-extend-native */
        Array.prototype.includes = function includes(searchEl, fromIndex) {
            var len = this.length >>> 0;
            var k = Math.max((fromIndex | 0) >= 0 ? (fromIndex | 0) : len + (fromIndex | 0), 0);
            while (k < len) {
                var el = this[k];
                // SameValueZero comparison (handles NaN)
                if (el === searchEl || (el !== el && searchEl !== searchEl)) {
                    return true;
                }
                k++;
            }
            return false;
        };
        /* eslint-enable no-extend-native */
    }

    // ------------------------------------------------------------------
    // 6. String.prototype.includes polyfill
    // ------------------------------------------------------------------
    if (!String.prototype.includes) {
        /* eslint-disable no-extend-native */
        String.prototype.includes = function includes(search, start) {
            var pos = typeof start === 'number' ? start : 0;
            if (pos + search.length > this.length) { return false; }
            return this.indexOf(search, pos) !== -1;
        };
        /* eslint-enable no-extend-native */
    }

    // ------------------------------------------------------------------
    // 7. NodeList.forEach polyfill (absent in IE)
    // ------------------------------------------------------------------
    if (typeof NodeList !== 'undefined' &&
        NodeList.prototype &&
        !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    // ------------------------------------------------------------------
    // 8. Element.closest polyfill (absent in IE)
    // ------------------------------------------------------------------
    if (typeof Element !== 'undefined' && !Element.prototype.closest) {
        Element.prototype.closest = function closest(selector) {
            var el = this;
            while (el && el.nodeType === 1) {
                var matches = el.matches || el.msMatchesSelector;
                if (matches && matches.call(el, selector)) {
                    return el;
                }
                el = el.parentElement || el.parentNode;
            }
            return null;
        };
    }

    // ------------------------------------------------------------------
    // 9. CustomEvent constructor polyfill (IE 11 uses createEvent)
    // ------------------------------------------------------------------
    if (typeof root.CustomEvent !== 'function') {
        function CustomEvent(event, params) {
            var p = params || { bubbles: false, cancelable: false, detail: null };
            var evt = doc.createEvent('CustomEvent');
            evt.initCustomEvent(event, p.bubbles, p.cancelable, p.detail);
            return evt;
        }
        CustomEvent.prototype = root.Event.prototype;
        root.CustomEvent = CustomEvent;
    }

    // ------------------------------------------------------------------
    // 10. Promise detection — warn and flag; load a shim externally if needed
    // ------------------------------------------------------------------
    if (typeof root.Promise === 'undefined') {
        addHtmlClass('no-promise');
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(
                '[browser-support] Promise is unavailable. ' +
                'Add a Promise polyfill (e.g. es6-promise) before application scripts.'
            );
        }
    }

    // ------------------------------------------------------------------
    // 11. Fetch API detection
    // ------------------------------------------------------------------
    if (typeof root.fetch === 'undefined') {
        addHtmlClass('no-fetch');
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(
                '[browser-support] Fetch API is unavailable. ' +
                'Add a Fetch polyfill (e.g. whatwg-fetch) if needed.'
            );
        }
    }

    // ------------------------------------------------------------------
    // 12. IntersectionObserver detection
    // ------------------------------------------------------------------
    if (typeof root.IntersectionObserver === 'undefined') {
        addHtmlClass('no-intersection-observer');
    }

    // ------------------------------------------------------------------
    // CAPABILITY REPORT (visible in DevTools console)
    // ------------------------------------------------------------------
    if (typeof console !== 'undefined' && console.info) {
        console.info('[browser-support] Feature report:', {
            cssCustomProperties: hasCSSVars,
            cssGrid: hasCSSGrid,
            cssFlexbox: hasFlexbox,
            promise: typeof root.Promise !== 'undefined',
            fetch: typeof root.fetch !== 'undefined',
            intersectionObserver: typeof root.IntersectionObserver !== 'undefined'
        });
    }

}(window, document));
