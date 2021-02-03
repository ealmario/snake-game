
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.op = factory());
}(this, (function () { 'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const CONSTANTS = 
    { 
        AUTH_SERVER_TYPES : 
        {
            NAKAMA: "nakama"
        }, 

        TOURNEY_SERVER_TYPES : 
        {
            NAKAMA: "nakama"
        },     
        
        SDK_STATES: 
        {
            NOT_READY: "not_ready",
            INITIALIZING: "initializing",
            READY: "ready"
        },
        
        LOGIN_STATES:
        {
            LOGGED_OUT: "logged_out",
            LOGIN_IN_PROGRESS: "login_in_progress",
            LOGGED_IN: "logged_in",
        }
    };

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src\TailwindCss.svelte generated by Svelte v3.31.0 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-1k5bkhw-style";
    	append(document.head, style);
    }

    class TailwindCss extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-1k5bkhw-style")) add_css();
    		init(this, options, null, null, safe_not_equal, {});
    	}
    }

    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __assign = Object.assign;
    var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
    var __commonJS = (callback, module) => () => {
      if (!module) {
        module = {exports: {}};
        callback(module.exports, module);
      }
      return module.exports;
    };
    var __exportStar = (target, module, desc) => {
      __markAsModule(target);
      if (module && typeof module === "object" || typeof module === "function") {
        for (let key of __getOwnPropNames(module))
          if (!__hasOwnProp.call(target, key) && key !== "default")
            __defProp(target, key, {get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable});
      }
      return target;
    };
    var __toModule = (module) => {
      if (module && module.__esModule)
        return module;
      return __exportStar(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", {value: module, enumerable: true}), module);
    };
    var __async = (__this, __arguments, generator) => {
      return new Promise((resolve, reject) => {
        var fulfilled = (value) => {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        };
        var rejected = (value) => {
          try {
            step(generator.throw(value));
          } catch (e) {
            reject(e);
          }
        };
        var step = (result) => {
          return result.done ? resolve(result.value) : Promise.resolve(result.value).then(fulfilled, rejected);
        };
        step((generator = generator.apply(__this, __arguments)).next());
      });
    };

    // ../../node_modules/Base64/base64.js
    var require_base64 = __commonJS((exports) => {
      (function() {
        var object = typeof exports != "undefined" ? exports : typeof self != "undefined" ? self : $.global;
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        function InvalidCharacterError(message) {
          this.message = message;
        }
        InvalidCharacterError.prototype = new Error();
        InvalidCharacterError.prototype.name = "InvalidCharacterError";
        object.btoa || (object.btoa = function(input) {
          var str = String(input);
          for (var block, charCode, idx = 0, map = chars, output = ""; str.charAt(idx | 0) || (map = "=", idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 255) {
              throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
          }
          return output;
        });
        object.atob || (object.atob = function(input) {
          var str = String(input).replace(/[=]+$/, "");
          if (str.length % 4 == 1) {
            throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
          }
          for (var bc = 0, bs, buffer, idx = 0, output = ""; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = chars.indexOf(buffer);
          }
          return output;
        });
      })();
    });

    // ../../node_modules/whatwg-fetch/fetch.js
    var require_fetch = __commonJS((exports) => {
      (function(self2) {
        if (self2.fetch) {
          return;
        }
        var support = {
          searchParams: "URLSearchParams" in self2,
          iterable: "Symbol" in self2 && "iterator" in Symbol,
          blob: "FileReader" in self2 && "Blob" in self2 && function() {
            try {
              new Blob();
              return true;
            } catch (e) {
              return false;
            }
          }(),
          formData: "FormData" in self2,
          arrayBuffer: "ArrayBuffer" in self2
        };
        if (support.arrayBuffer) {
          var viewClasses = [
            "[object Int8Array]",
            "[object Uint8Array]",
            "[object Uint8ClampedArray]",
            "[object Int16Array]",
            "[object Uint16Array]",
            "[object Int32Array]",
            "[object Uint32Array]",
            "[object Float32Array]",
            "[object Float64Array]"
          ];
          var isDataView = function(obj) {
            return obj && DataView.prototype.isPrototypeOf(obj);
          };
          var isArrayBufferView = ArrayBuffer.isView || function(obj) {
            return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
          };
        }
        function normalizeName(name) {
          if (typeof name !== "string") {
            name = String(name);
          }
          if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
            throw new TypeError("Invalid character in header field name");
          }
          return name.toLowerCase();
        }
        function normalizeValue(value) {
          if (typeof value !== "string") {
            value = String(value);
          }
          return value;
        }
        function iteratorFor(items) {
          var iterator = {
            next: function() {
              var value = items.shift();
              return {done: value === void 0, value};
            }
          };
          if (support.iterable) {
            iterator[Symbol.iterator] = function() {
              return iterator;
            };
          }
          return iterator;
        }
        function Headers(headers) {
          this.map = {};
          if (headers instanceof Headers) {
            headers.forEach(function(value, name) {
              this.append(name, value);
            }, this);
          } else if (Array.isArray(headers)) {
            headers.forEach(function(header) {
              this.append(header[0], header[1]);
            }, this);
          } else if (headers) {
            Object.getOwnPropertyNames(headers).forEach(function(name) {
              this.append(name, headers[name]);
            }, this);
          }
        }
        Headers.prototype.append = function(name, value) {
          name = normalizeName(name);
          value = normalizeValue(value);
          var oldValue = this.map[name];
          this.map[name] = oldValue ? oldValue + "," + value : value;
        };
        Headers.prototype["delete"] = function(name) {
          delete this.map[normalizeName(name)];
        };
        Headers.prototype.get = function(name) {
          name = normalizeName(name);
          return this.has(name) ? this.map[name] : null;
        };
        Headers.prototype.has = function(name) {
          return this.map.hasOwnProperty(normalizeName(name));
        };
        Headers.prototype.set = function(name, value) {
          this.map[normalizeName(name)] = normalizeValue(value);
        };
        Headers.prototype.forEach = function(callback, thisArg) {
          for (var name in this.map) {
            if (this.map.hasOwnProperty(name)) {
              callback.call(thisArg, this.map[name], name, this);
            }
          }
        };
        Headers.prototype.keys = function() {
          var items = [];
          this.forEach(function(value, name) {
            items.push(name);
          });
          return iteratorFor(items);
        };
        Headers.prototype.values = function() {
          var items = [];
          this.forEach(function(value) {
            items.push(value);
          });
          return iteratorFor(items);
        };
        Headers.prototype.entries = function() {
          var items = [];
          this.forEach(function(value, name) {
            items.push([name, value]);
          });
          return iteratorFor(items);
        };
        if (support.iterable) {
          Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
        }
        function consumed(body) {
          if (body.bodyUsed) {
            return Promise.reject(new TypeError("Already read"));
          }
          body.bodyUsed = true;
        }
        function fileReaderReady(reader) {
          return new Promise(function(resolve, reject) {
            reader.onload = function() {
              resolve(reader.result);
            };
            reader.onerror = function() {
              reject(reader.error);
            };
          });
        }
        function readBlobAsArrayBuffer(blob) {
          var reader = new FileReader();
          var promise = fileReaderReady(reader);
          reader.readAsArrayBuffer(blob);
          return promise;
        }
        function readBlobAsText(blob) {
          var reader = new FileReader();
          var promise = fileReaderReady(reader);
          reader.readAsText(blob);
          return promise;
        }
        function readArrayBufferAsText(buf) {
          var view = new Uint8Array(buf);
          var chars = new Array(view.length);
          for (var i = 0; i < view.length; i++) {
            chars[i] = String.fromCharCode(view[i]);
          }
          return chars.join("");
        }
        function bufferClone(buf) {
          if (buf.slice) {
            return buf.slice(0);
          } else {
            var view = new Uint8Array(buf.byteLength);
            view.set(new Uint8Array(buf));
            return view.buffer;
          }
        }
        function Body() {
          this.bodyUsed = false;
          this._initBody = function(body) {
            this._bodyInit = body;
            if (!body) {
              this._bodyText = "";
            } else if (typeof body === "string") {
              this._bodyText = body;
            } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
              this._bodyBlob = body;
            } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
              this._bodyFormData = body;
            } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
              this._bodyText = body.toString();
            } else if (support.arrayBuffer && support.blob && isDataView(body)) {
              this._bodyArrayBuffer = bufferClone(body.buffer);
              this._bodyInit = new Blob([this._bodyArrayBuffer]);
            } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
              this._bodyArrayBuffer = bufferClone(body);
            } else {
              throw new Error("unsupported BodyInit type");
            }
            if (!this.headers.get("content-type")) {
              if (typeof body === "string") {
                this.headers.set("content-type", "text/plain;charset=UTF-8");
              } else if (this._bodyBlob && this._bodyBlob.type) {
                this.headers.set("content-type", this._bodyBlob.type);
              } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
              }
            }
          };
          if (support.blob) {
            this.blob = function() {
              var rejected = consumed(this);
              if (rejected) {
                return rejected;
              }
              if (this._bodyBlob) {
                return Promise.resolve(this._bodyBlob);
              } else if (this._bodyArrayBuffer) {
                return Promise.resolve(new Blob([this._bodyArrayBuffer]));
              } else if (this._bodyFormData) {
                throw new Error("could not read FormData body as blob");
              } else {
                return Promise.resolve(new Blob([this._bodyText]));
              }
            };
            this.arrayBuffer = function() {
              if (this._bodyArrayBuffer) {
                return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
              } else {
                return this.blob().then(readBlobAsArrayBuffer);
              }
            };
          }
          this.text = function() {
            var rejected = consumed(this);
            if (rejected) {
              return rejected;
            }
            if (this._bodyBlob) {
              return readBlobAsText(this._bodyBlob);
            } else if (this._bodyArrayBuffer) {
              return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
            } else if (this._bodyFormData) {
              throw new Error("could not read FormData body as text");
            } else {
              return Promise.resolve(this._bodyText);
            }
          };
          if (support.formData) {
            this.formData = function() {
              return this.text().then(decode);
            };
          }
          this.json = function() {
            return this.text().then(JSON.parse);
          };
          return this;
        }
        var methods = ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"];
        function normalizeMethod(method) {
          var upcased = method.toUpperCase();
          return methods.indexOf(upcased) > -1 ? upcased : method;
        }
        function Request(input, options) {
          options = options || {};
          var body = options.body;
          if (input instanceof Request) {
            if (input.bodyUsed) {
              throw new TypeError("Already read");
            }
            this.url = input.url;
            this.credentials = input.credentials;
            if (!options.headers) {
              this.headers = new Headers(input.headers);
            }
            this.method = input.method;
            this.mode = input.mode;
            if (!body && input._bodyInit != null) {
              body = input._bodyInit;
              input.bodyUsed = true;
            }
          } else {
            this.url = String(input);
          }
          this.credentials = options.credentials || this.credentials || "omit";
          if (options.headers || !this.headers) {
            this.headers = new Headers(options.headers);
          }
          this.method = normalizeMethod(options.method || this.method || "GET");
          this.mode = options.mode || this.mode || null;
          this.referrer = null;
          if ((this.method === "GET" || this.method === "HEAD") && body) {
            throw new TypeError("Body not allowed for GET or HEAD requests");
          }
          this._initBody(body);
        }
        Request.prototype.clone = function() {
          return new Request(this, {body: this._bodyInit});
        };
        function decode(body) {
          var form = new FormData();
          body.trim().split("&").forEach(function(bytes) {
            if (bytes) {
              var split = bytes.split("=");
              var name = split.shift().replace(/\+/g, " ");
              var value = split.join("=").replace(/\+/g, " ");
              form.append(decodeURIComponent(name), decodeURIComponent(value));
            }
          });
          return form;
        }
        function parseHeaders(rawHeaders) {
          var headers = new Headers();
          var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");
          preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
            var parts = line.split(":");
            var key = parts.shift().trim();
            if (key) {
              var value = parts.join(":").trim();
              headers.append(key, value);
            }
          });
          return headers;
        }
        Body.call(Request.prototype);
        function Response(bodyInit, options) {
          if (!options) {
            options = {};
          }
          this.type = "default";
          this.status = options.status === void 0 ? 200 : options.status;
          this.ok = this.status >= 200 && this.status < 300;
          this.statusText = "statusText" in options ? options.statusText : "OK";
          this.headers = new Headers(options.headers);
          this.url = options.url || "";
          this._initBody(bodyInit);
        }
        Body.call(Response.prototype);
        Response.prototype.clone = function() {
          return new Response(this._bodyInit, {
            status: this.status,
            statusText: this.statusText,
            headers: new Headers(this.headers),
            url: this.url
          });
        };
        Response.error = function() {
          var response = new Response(null, {status: 0, statusText: ""});
          response.type = "error";
          return response;
        };
        var redirectStatuses = [301, 302, 303, 307, 308];
        Response.redirect = function(url, status) {
          if (redirectStatuses.indexOf(status) === -1) {
            throw new RangeError("Invalid status code");
          }
          return new Response(null, {status, headers: {location: url}});
        };
        self2.Headers = Headers;
        self2.Request = Request;
        self2.Response = Response;
        self2.fetch = function(input, init) {
          return new Promise(function(resolve, reject) {
            var request = new Request(input, init);
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
              var options = {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: parseHeaders(xhr.getAllResponseHeaders() || "")
              };
              options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
              var body = "response" in xhr ? xhr.response : xhr.responseText;
              resolve(new Response(body, options));
            };
            xhr.onerror = function() {
              reject(new TypeError("Network request failed"));
            };
            xhr.ontimeout = function() {
              reject(new TypeError("Network request failed"));
            };
            xhr.open(request.method, request.url, true);
            if (request.credentials === "include") {
              xhr.withCredentials = true;
            } else if (request.credentials === "omit") {
              xhr.withCredentials = false;
            }
            if ("responseType" in xhr && support.blob) {
              xhr.responseType = "blob";
            }
            request.headers.forEach(function(value, name) {
              xhr.setRequestHeader(name, value);
            });
            xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
          });
        };
        self2.fetch.polyfill = true;
      })(typeof self !== "undefined" ? self : exports);
    });

    // index.ts
    var import_Base64 = __toModule(require_base64());
    var import_whatwg_fetch = __toModule(require_fetch());

    // api.gen.ts
    var NakamaApi = class {
      constructor(configuration) {
        this.configuration = configuration;
      }
      doFetch(urlPath, method, queryParams, body, options) {
        const urlQuery = "?" + Object.keys(queryParams).map((k) => {
          if (queryParams[k] instanceof Array) {
            return queryParams[k].reduce((prev, curr) => {
              return prev + encodeURIComponent(k) + "=" + encodeURIComponent(curr) + "&";
            }, "");
          } else {
            if (queryParams[k] != null) {
              return encodeURIComponent(k) + "=" + encodeURIComponent(queryParams[k]) + "&";
            }
          }
        }).join("");
        const fetchOptions = __assign(__assign({}, {method}), options);
        fetchOptions.headers = __assign({}, options.headers);
        const descriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "withCredentials");
        if (!(descriptor == null ? void 0 : descriptor.set)) {
          fetchOptions.credentials = "cocos-ignore";
        }
        if (this.configuration.bearerToken) {
          fetchOptions.headers["Authorization"] = "Bearer " + this.configuration.bearerToken;
        } else if (this.configuration.username) {
          fetchOptions.headers["Authorization"] = "Basic " + btoa(this.configuration.username + ":" + this.configuration.password);
        }
        if (!Object.keys(fetchOptions.headers).includes("Accept")) {
          fetchOptions.headers["Accept"] = "application/json";
        }
        if (!Object.keys(fetchOptions.headers).includes("Content-Type")) {
          fetchOptions.headers["Content-Type"] = "application/json";
        }
        Object.keys(fetchOptions.headers).forEach((key) => {
          if (!fetchOptions.headers[key]) {
            delete fetchOptions.headers[key];
          }
        });
        fetchOptions.body = body;
        return Promise.race([
          fetch(this.configuration.basePath + urlPath + urlQuery, fetchOptions).then((response) => {
            if (response.status == 204) {
              return response;
            } else if (response.status >= 200 && response.status < 300) {
              return response.json();
            } else {
              throw response;
            }
          }),
          new Promise((_, reject) => setTimeout(reject, this.configuration.timeoutMs, "Request timed out."))
        ]);
      }
      healthcheck(options = {}) {
        const urlPath = "/healthcheck";
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      getAccount(options = {}) {
        const urlPath = "/v2/account";
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      updateAccount(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      authenticateApple(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/apple";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateCustom(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/custom";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateDevice(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/device";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateEmail(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/email";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateFacebook(body, create, username, sync, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/facebook";
        const queryParams = {
          create,
          username,
          sync
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateFacebookInstantGame(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/facebookinstantgame";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateGameCenter(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/gamecenter";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateGoogle(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/google";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateSteam(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/steam";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkApple(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/apple";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkCustom(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/custom";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkDevice(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/device";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkEmail(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/email";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkFacebook(body, sync, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/facebook";
        const queryParams = {
          sync
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkFacebookInstantGame(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/facebookinstantgame";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkGameCenter(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/gamecenter";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkGoogle(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/google";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkSteam(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/steam";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkApple(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/apple";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkCustom(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/custom";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkDevice(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/device";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkEmail(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/email";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkFacebook(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/facebook";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkFacebookInstantGame(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/facebookinstantgame";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkGameCenter(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/gamecenter";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkGoogle(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/google";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkSteam(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/steam";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listChannelMessages(channelId, limit, forward, cursor, options = {}) {
        if (channelId === null || channelId === void 0) {
          throw new Error("'channelId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/channel/{channelId}".replace("{channelId}", encodeURIComponent(String(channelId)));
        const queryParams = {
          limit,
          forward,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      event(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/event";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      deleteFriends(ids, usernames, options = {}) {
        const urlPath = "/v2/friend";
        const queryParams = {
          ids,
          usernames
        };
        let _body = null;
        return this.doFetch(urlPath, "DELETE", queryParams, _body, options);
      }
      listFriends(limit, state, cursor, options = {}) {
        const urlPath = "/v2/friend";
        const queryParams = {
          limit,
          state,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      addFriends(ids, usernames, options = {}) {
        const urlPath = "/v2/friend";
        const queryParams = {
          ids,
          usernames
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      blockFriends(ids, usernames, options = {}) {
        const urlPath = "/v2/friend/block";
        const queryParams = {
          ids,
          usernames
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      importFacebookFriends(body, reset, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/friend/facebook";
        const queryParams = {
          reset
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listGroups(name, cursor, limit, options = {}) {
        const urlPath = "/v2/group";
        const queryParams = {
          name,
          cursor,
          limit
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      createGroup(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      deleteGroup(groupId, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "DELETE", queryParams, _body, options);
      }
      updateGroup(groupId, body, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      addGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/add".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      banGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/ban".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      demoteGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        if (userIds === null || userIds === void 0) {
          throw new Error("'userIds' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/demote".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      joinGroup(groupId, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/join".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      kickGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/kick".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      leaveGroup(groupId, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/leave".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      promoteGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
        }
        };

