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
 *
 * Extended for the native HTML/CSS/JS platform migration:
 *   - Promise polyfill (IE 11 and below)
 *   - Fetch polyfill hint
 *   - Element.classList shim for IE 9
 *   - sessionStorage / localStorage availability check
 *   - JSON availability check (IE 7 and below)
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
    // 11. Fetch API detection and minimal polyfill hint
    // ------------------------------------------------------------------
    if (typeof root.fetch === 'undefined') {
        addHtmlClass('no-fetch');
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(
                '[browser-support] Fetch API is unavailable. ' +
                'Add a Fetch polyfill (e.g. whatwg-fetch) if needed.'
            );
        }

        // Minimal XMLHttpRequest-based fetch shim for GET text/JSON requests.
        // Covers the single use-case in data.js: fetch(csvUrl) → response.text().
        root.fetch = function fetch(url) {
            return new root.Promise(function (resolve, reject) {
                var xhr = new root.XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({
                            ok:   true,
                            status: xhr.status,
                            text: function () { return root.Promise.resolve(xhr.responseText); },
                            json: function () { return root.Promise.resolve(JSON.parse(xhr.responseText)); }
                        });
                    } else {
                        reject(new Error('HTTP ' + xhr.status));
                    }
                };
                xhr.onerror = function () { reject(new Error('Network error')); };
                xhr.send();
            });
        };
    }

    // ------------------------------------------------------------------
    // 12. IntersectionObserver detection
    // ------------------------------------------------------------------
    if (typeof root.IntersectionObserver === 'undefined') {
        addHtmlClass('no-intersection-observer');
    }

    // ------------------------------------------------------------------
    // 13. Element.classList shim for IE 9 (does not support classList)
    // ------------------------------------------------------------------
    if (typeof doc.createElement('div').classList === 'undefined') {
        addHtmlClass('no-classlist');
        // Minimal classList shim
        var classListShim = {
            add: function (el, cls) {
                if ((' ' + el.className + ' ').indexOf(' ' + cls + ' ') === -1) {
                    el.className += (el.className ? ' ' : '') + cls;
                }
            },
            remove: function (el, cls) {
                el.className = (' ' + el.className + ' ')
                    .replace(' ' + cls + ' ', ' ').trim();
            },
            contains: function (el, cls) {
                return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') !== -1;
            },
            toggle: function (el, cls) {
                if (classListShim.contains(el, cls)) { classListShim.remove(el, cls); }
                else { classListShim.add(el, cls); }
            }
        };
        // Patch individual elements via defineProperty is complex in IE9;
        // expose as root.classListShim for use by application scripts.
        root.classListShim = classListShim;
    }

    // ------------------------------------------------------------------
    // 14. sessionStorage / localStorage availability
    // ------------------------------------------------------------------
    (function () {
        function testStorage(name) {
            try {
                var s = root[name];
                s.setItem('__test__', '1');
                s.removeItem('__test__');
                return true;
            } catch (e) {
                return false;
            }
        }
        if (!testStorage('sessionStorage')) { addHtmlClass('no-session-storage'); }
        if (!testStorage('localStorage'))   { addHtmlClass('no-local-storage'); }
    }());

    // ------------------------------------------------------------------
    // 15. JSON availability (IE 7 and below)
    // ------------------------------------------------------------------
    if (typeof root.JSON === 'undefined') {
        addHtmlClass('no-json');
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(
                '[browser-support] JSON is unavailable. ' +
                'Add a JSON polyfill (e.g. json3) before application scripts.'
            );
        }
    }

    // ------------------------------------------------------------------
    // 16. Promise polyfill — minimal implementation for IE 11 and below.
    //     Only installed when the native Promise is absent.
    //     Covers the subset used by auth.js and data.js.
    // ------------------------------------------------------------------
    if (typeof root.Promise === 'undefined') {
        addHtmlClass('no-promise');

        root.Promise = (function () {
            var PENDING  = 0;
            var RESOLVED = 1;
            var REJECTED = 2;

            function Promise(executor) {
                var self      = this;
                self._state   = PENDING;
                self._value   = undefined;
                self._deferreds = [];

                function resolve(val) {
                    if (self._state !== PENDING) { return; }
                    self._state = RESOLVED;
                    self._value = val;
                    _finale(self);
                }
                function reject(reason) {
                    if (self._state !== PENDING) { return; }
                    self._state = REJECTED;
                    self._value = reason;
                    _finale(self);
                }

                try { executor(resolve, reject); }
                catch (e) { reject(e); }
            }

            function _finale(self) {
                for (var i = 0; i < self._deferreds.length; i++) {
                    _handle(self, self._deferreds[i]);
                }
                self._deferreds = null;
            }

            function _handle(self, deferred) {
                if (self._state === PENDING) {
                    self._deferreds.push(deferred);
                    return;
                }
                setTimeout(function () {
                    var cb = self._state === RESOLVED ? deferred.onFulfilled : deferred.onRejected;
                    if (!cb) {
                        if (self._state === RESOLVED) { deferred.resolve(self._value); }
                        else { deferred.reject(self._value); }
                        return;
                    }
                    try {
                        deferred.resolve(cb(self._value));
                    } catch (e) {
                        deferred.reject(e);
                    }
                }, 0);
            }

            Promise.prototype['then'] = function (onFulfilled, onRejected) {
                var self = this;
                return new Promise(function (resolve, reject) {
                    _handle(self, {
                        onFulfilled: typeof onFulfilled === 'function' ? onFulfilled : null,
                        onRejected:  typeof onRejected  === 'function' ? onRejected  : null,
                        resolve: resolve,
                        reject:  reject
                    });
                });
            };

            Promise.prototype['catch'] = function (onRejected) {
                return this['then'](null, onRejected);
            };

            Promise.resolve = function (val) {
                return new Promise(function (res) { res(val); });
            };

            Promise.reject = function (reason) {
                return new Promise(function (res, rej) { rej(reason); });
            };

            return Promise;
        }());
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
            intersectionObserver: typeof root.IntersectionObserver !== 'undefined',
            sessionStorage: typeof root.sessionStorage !== 'undefined',
            localStorage: typeof root.localStorage !== 'undefined',
            json: typeof root.JSON !== 'undefined'
        });
    }

}(window, document));
