/* global IDOM */

(function (Object, window, document) {
    "use strict";

    const pretty = function (it) {
        return JSON.stringify(it, null, 2);
    };
    const slice = [].slice;

    function createElement(tagName) {
        const node = document.createElement(tagName);
        const api = {
            $: node,
            prop: function (name, value) {
                node[name] = value;
                return api;
            },
        };
        return api;
    }

    const subscribers = [];

    window.IDOM = Object.freeze({
        createElement: function (tagName, props, children) {
            if (typeof tagName === "function") {
                return tagName(props, children);
            }

            return [tagName, props || {}, children];
        },
        invalidate: function (path) {
            console.log("IDOM.invalidate", path);
        },
        render: function render(app, rootNode) {
            console.log("IDOM.render", pretty(app), rootNode);

            if (typeof app === "string") {
                const textNode = document.createTextNode(app);
                rootNode.appendChild(textNode);
                return;
            }

            const tagName = app[0];
            const props = app[1] || {};
            const children = app[2] || [];

            const el = createElement(tagName);
            Object.keys(props).forEach(function (key) {
                el.prop(key, props[key]);
            });
            if (Array.isArray(children)) {
                children.forEach(function (child) {
                    render(child, el.$);
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
const lens = IDOM.lens;

function App(props, children) {
    return h("div", { id: props.mainId, onclick: props.onclick }, [
        h("pre", null, [
            "module Main exposing (main)",
        ].concat(children || [])),
    ]);
}

const state = {
    mainId: "main",
    onclick: function () {
        console.log("onclick", arguments);
        state.mainId = "main2";
        IDOM.invalidate();
    },
};

const app = h(App, state, [
    h("i", null, ["italics"]),
]);
IDOM.render(app, document.querySelector("#root"));
