import fs from "fs";
import path from "path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

function createElement(tagName = "div") {
  return {
    tagName: tagName.toUpperCase(),
    style: {},
    children: [],
    isContentEditable: false,
    addEventListener: () => {},
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((item) => item !== child);
    },
    set id(value) {
      this._id = value;
    },
    get id() {
      return this._id;
    },
  };
}

function loadEventHelpers({
  userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
  platform = "MacIntel",
  disabledWebShortcuts = false,
  initialFullscreen = false,
  hideTitleBar = false,
} = {}) {
  const source = ["link_policy.js", "event.js"]
    .map((file) =>
      fs.readFileSync(
        path.join(process.cwd(), "src-tauri/src/inject", file),
        "utf-8",
      ),
    )
    .join("\n");

  const eventListeners = {};
  const elementsById = new Map();
  const fullscreenCalls = [];
  const reloadCalls = [];
  const navigateCalls = [];
  const body = createElement("body");
  body.appendChild = (child) => {
    body.children.push(child);
    if (child.id) elementsById.set(child.id, child);
    return child;
  };

  const registerListener = (type, handler, options) => {
    eventListeners[type] = eventListeners[type] || [];
    eventListeners[type].push({ handler, options });
  };

  let isFullscreen = initialFullscreen;

  const context = {
    console,
    URL,
    Event,
    EventTarget,
    Notification: function Notification() {},
    setTimeout,
    clearTimeout,
    scrollTo: () => {},
    navigator: {
      userAgent,
      platform,
      language: "en-US",
      clipboard: {
        readText: () => Promise.resolve(""),
      },
    },
    window: {
      history: {
        back: () => {},
        forward: () => {},
      },
      location: {
        href: "https://example.com/app",
        origin: "https://example.com",
        pathname: "/app",
        reload: () => reloadCalls.push(true),
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
      },
      addEventListener: registerListener,
      dispatchEvent: () => {},
      getSelection: () => ({
        toString: () => "",
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
      }),
      open: () => ({}),
      isAuthLink: () => false,
      isAuthPopup: () => false,
      pakeConfig: {
        disabled_web_shortcuts: disabledWebShortcuts,
        hide_title_bar: hideTitleBar,
      },
      __TAURI__: {
        core: {
          invoke: (command, payload) => {
            if (command === "webview_navigate") {
              navigateCalls.push(payload?.action);
            }
            return Promise.resolve();
          },
        },
        window: {
          getCurrentWindow: () => ({
            startDragging: () => {},
            isFullscreen: () => Promise.resolve(isFullscreen),
            setFullscreen: (value) => {
              fullscreenCalls.push(value);
              isFullscreen = value;
              return Promise.resolve();
            },
          }),
        },
      },
    },
    document: {
      addEventListener: registerListener,
      createElement: (tagName) => {
        const element = createElement(tagName);
        if (element.id) elementsById.set(element.id, element);
        return element;
      },
      createRange: () => ({
        selectNodeContents: vi.fn(),
      }),
      getElementById: (id) => elementsById.get(id) || null,
      getElementsByTagName: () => [{ style: {} }],
      body,
      activeElement: body,
      execCommand: () => true,
    },
  };
  context.window.navigator = context.navigator;

  runInNewContext(source, context);
  eventListeners.DOMContentLoaded[0].handler();

  return {
    ...context,
    eventListeners,
    fullscreenCalls,
    reloadCalls,
    navigateCalls,
    get isFullscreen() {
      return isFullscreen;
    },
  };
}

function getWebShortcutHandler(context) {
  return context.eventListeners.keyup.find(
    ({ handler }) => handler.name === "handleWebShortcut",
  ).handler;
}

function createKeyEvent(key, overrides = {}) {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isTrusted: true,
    repeat: false,
    preventDefault: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...overrides,
  };
}

describe("event fullscreen shortcuts", () => {
  it("installs the macOS fullscreen bridge once", () => {
    const source = fs.readFileSync("src-tauri/src/app/window.rs", "utf8");
    const injection =
      /\{\s*window_builder =\s*window_builder\.initialization_script\(include_str!\("\.\.\/inject\/fullscreen\.js"\)\);\s*\}/;
    expect(source).toMatch(injection);
    expect(
      source.match(/include_str!\("\.\.\/inject\/fullscreen\.js"\)/g),
    ).toHaveLength(1);
  });

  it("leaves macOS reload shortcuts to the native menu", () => {
    const context = loadEventHelpers();
    const event = createKeyEvent("r", { metaKey: true });

    getWebShortcutHandler(context)(event);

    expect(context.reloadCalls).toEqual([]);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("does not hijack Ctrl+R in the webview", () => {
    const context = loadEventHelpers();
    const event = createKeyEvent("r", { ctrlKey: true });

    getWebShortcutHandler(context)(event);

    expect(context.navigateCalls).toEqual([]);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("keeps macOS scroll-to-edge shortcuts in the webview", () => {
    const context = loadEventHelpers();
    const event = createKeyEvent("ArrowUp", { metaKey: true });

    getWebShortcutHandler(context)(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("registers no F11 or Ctrl-clipboard handlers (Windows/Linux only upstream)", () => {
    const context = loadEventHelpers();
    const names = [
      ...(context.eventListeners.keydown || []),
      ...(context.eventListeners.keyup || []),
    ].map(({ handler }) => handler.name);

    expect(names).not.toContain("handleWindowFullscreenShortcut");
    expect(names).not.toContain("handleClipboardShortcut");
    expect(names).not.toContain("handleClipboardPasteFallback");
  });

  it("creates the drag region only when hide_title_bar is set", () => {
    expect(
      loadEventHelpers().document.getElementById("pake-top-dom"),
    ).toBeNull();
    expect(
      loadEventHelpers({ hideTitleBar: true }).document.getElementById(
        "pake-top-dom",
      ),
    ).not.toBeNull();
  });
});
