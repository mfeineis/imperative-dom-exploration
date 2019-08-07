/* global IDOM */

(function (Object, window, document) {
    "use strict";

    const pretty = function (it) {
        return JSON.stringify(it, null, 2);
    };
    const slice = [].slice;

    function nextTick(fn) {
        window.setTimeout(fn, 1);
    }

    function createElement(store, tagName) {
        const node = document.createElement(tagName);
        const api = Object.freeze({
            $: node,
            prop: function (name, value) {
                if (/^on/.test(name) && typeof value === "function") {
                    node[name] = function () {
                        const result = value.apply(this, arguments);
                        nextTick(store.invalidate);
                        return result;
                    };
                    return api;
                }
                node[name] = value;
                return api;
            },
        });
        return api;
    }

    window.IDOM = Object.freeze({
        createElement: function (tagName, props, children) {
            if (typeof tagName === "function") {
                return tagName(props, children);
            }

            return [tagName, props, children];
        },
        render: function render(app, store, rootNode) {
            console.log("IDOM.render", pretty(app), "with", pretty(store.state), rootNode);

            if (typeof app === "string") {
                const textNode = document.createTextNode(app);
                rootNode.appendChild(textNode);
                return;
            }

            const tagName = app[0];
            const selectProps = app[1] || function (it) { return it; };
            const children = app[2] || [];

            const el = createElement(store, tagName);

            if (Object.keys(selectProps(store.state)).length) {
                store.subscribe(function (state) {
                    const props = selectProps(state);
                    Object.keys(props).forEach(function (key) {
                        el.prop(key, props[key]);
                    });
                });
            }

            if (Array.isArray(children)) {
                children.forEach(function (child) {
                    render(child, store, el.$);
                });
            }
            rootNode.appendChild(el.$);
        },
        toString: function () {
            return "You are using IDOM@0.1.0";
        },
    });

}(Object, window, window.document));

console.log("IDOM", IDOM, IDOM.createElement);

const h = IDOM.createElement;

function createStore(initialState) {
    const _subscriptions = [];
    const store = Object.defineProperties({}, {
        invalidate: {
            value: function () {
                _subscriptions.forEach(function (fn) {
                    fn(store.state);
                });
            },
        },
        state: {
            value: initialState,
        },
        subscribe: {
            value: function (fn) {
                _subscriptions.push(fn);
                fn(store.state);
            },
        },
    });
    return store;
}

function select(selector) {
    return function (props) {
        return selector(props);
    };
}

function App(props, children) {
    return h("div", select(function (state) { return { id: state.mainId, onclick: state.onclick }; }), [
        h("pre", null, [
            "module Main exposing (main)",
        ].concat(children || [])),
    ]);
}

const app = h(App, null, [
    h("i", null, ["italics"]),
]);
const store = createStore({
    mainId: "main",
    onclick: function () {
        console.log("onclick", arguments);
        store.state.mainId = "main2";
    },
});
IDOM.render(app, store, document.querySelector("#root"));
