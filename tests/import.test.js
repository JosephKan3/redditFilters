// Import regression tests exercise the durable extension page (not a toolbar popup).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness(opts = {}) {
  const store = { hiddenUsers: ["old_user"], hiddenKeywords: ["old_keyword"], loggingEnabled: true };
  const writes = [], elements = new Map(), listeners = new Map(), tabs = [];
  function node(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id, files: [], value: "", textContent: "", dataset: {}, hidden: false,
        disabled: id === "importBtn",
        addEventListener(event, callback) { listeners.set(id + ":" + event, callback); }
      });
    }
    return elements.get(id);
  }
  const chrome = {
    runtime: {
      getURL(path) { return "moz-extension://test-addon/" + path; },
      lastError: undefined
    },
    tabs: {
      create(info, callback) { tabs.push(info); if (callback) callback(); }
    },
    storage: { local: {
      set(data, cb) {
        writes.push(data);
        if (opts.failWrite) {
          chrome.runtime.lastError = { message: "simulated write failure" };
          cb();
          chrome.runtime.lastError = undefined;
          return;
        }
        Object.assign(store, data);
        cb();
      },
      get(keys, cb) {
        if (opts.failRead) {
          chrome.runtime.lastError = { message: "simulated read failure" };
          cb();
          chrome.runtime.lastError = undefined;
          return;
        }
        const result = {};
        for (const key of keys) {
          if (Object.hasOwn(store, key)) result[key] = store[key];
        }
        if (opts.corruptRead && Object.hasOwn(result, "hiddenUsers"))
          result.hiddenUsers = ["other_user"];
        cb(result);
      }
    }}
  };
  const doc = {
    getElementById: node,
    querySelector() { return node("query"); },
    querySelectorAll() { return []; },
    addEventListener() {},
    body: { insertBefore() {} },
  };
  const ctx = {
    chrome, document: doc, console,
    confirm() { return opts.confirm !== false; },
    FileReader: class {
      readAsText(file) {
        if (file.failRead) this.onerror();
        else this.onload({ target: { result: file.text } });
      }
    },
    alert() { throw new Error("Unexpected alert"); }
  };
  vm.createContext(ctx);
  const load = (file) => vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    ctx, { filename: file });
  load("import.js");
  const choose = (text, failRead = false) => {
    node("importFileInput").files = [{ text, failRead }];
    listeners.get("importFileInput:change")();
  };
  const click = async () => {
    await listeners.get("importBtn:click")();
  };
  return { store, writes, elements, tabs, node, choose, click, ctx, load, listeners };
}

test("file picker runs in persistent import page; selection cannot cause storage writes", async () => {
  const h = harness();
  h.choose('{"category":"blockedUsers","items":["new_user"]}');
  assert.equal(h.writes.length, 0);
  assert.equal(h.node("importBtn").disabled, false);
  assert.match(h.node("preview").textContent, /Users: 1/);
  await h.click();
  assert.equal(h.writes.length, 1);
  assert.deepEqual(Array.from(h.store.hiddenUsers), ["new_user"]);
  assert.match(h.node("status").textContent, /Imported and verified/);
});

test("full exported JSONL persists all categories and preferences; verifies read-back", async () => {
  const h = harness();
  const lines = [
    { category: "preferences", blockUsers: false, blockKeywords: true,
      blockSubreddits: true, blockDomains: false, blockAds: false,
      nukeConfirm: true, requireBlockConfirm: false },
    { category: "blockedDomains", items: ["example.com"] },
    { category: "blockedKeywords", items: ["AI", "ChatGPT"] },
    { category: "blockedSubreddits", items: ["test"] },
    { category: "blockedUsers", items: ["new_user"] }
  ];
  h.choose(lines.map(JSON.stringify).join("\r\n") + "\r\n");
  await h.click();
  assert.deepEqual(Array.from(h.store.hiddenUsers), ["new_user"]);
  assert.deepEqual(Array.from(h.store.hiddenKeywords), ["AI", "ChatGPT"]);
  assert.deepEqual(Array.from(h.store.hiddenSubreddits), ["test"]);
  assert.deepEqual(Array.from(h.store.hiddenDomains), ["example.com"]);
  assert.equal(h.store.blockUsers, false);
  assert.equal(h.store.blockAds, false);
  assert.equal(h.store.requireBlockConfirm, false);
  assert.equal(h.store.loggingEnabled, true);
  assert.match(h.node("status").textContent, /Imported and verified/);
});

test("preferences-only export clears block lists while retaining omitted settings", async () => {
  const h = harness();
  h.choose('{"category":"preferences","blockUsers":true}');
  await h.click();
  assert.deepEqual(Array.from(h.store.hiddenUsers), []);
  assert.deepEqual(Array.from(h.store.hiddenKeywords), []);
  assert.equal(h.store.loggingEnabled, true);
  assert.equal(h.store.blockUsers, true);
});

test("malformed JSONL is rejected without writing or enabling Import", async () => {
  for (const input of [
    '{"category":"unknown","items":["a"]}',
    '{"category":"blockedUsers"}',
    '{"category":"blockedUsers","items":[7]}',
    '{"category":"preferences","blockUsers":"false"}',
    '{"category":"blockedUsers","items":["valid"]}\ncorrupt',
    '{"category":"blockedUsers","items":["a"]}\n{"category":"blockedUsers","items":["b"]}',
    ""
  ]) {
    const h = harness();
    h.choose(input);
    assert.equal(h.writes.length, 0, input);
    assert.equal(h.node("importBtn").disabled, true, input);
    assert.match(h.node("status").textContent, /Import rejected:/, input);
    assert.deepEqual(h.store.hiddenUsers, ["old_user"], input);
  }
});

test("read error and canceled confirmation preserve storage", async () => {
  const h = harness();
  h.choose("ignored", true);
  assert.equal(h.node("importBtn").disabled, true);
  assert.match(h.node("status").textContent, /Unable to read/);
  const canceled = harness({ confirm: false });
  canceled.choose('{"category":"blockedUsers","items":["new"]}');
  await canceled.click();
  assert.equal(canceled.writes.length, 0);
  assert.deepEqual(canceled.store.hiddenUsers, ["old_user"]);
});

test("storage write failures and read-back mismatches do not report success", async () => {
  for (const opts of [{ failWrite: true }, { failRead: true }, { corruptRead: true }]) {
    const h = harness(opts);
    h.choose('{"category":"blockedUsers","items":["new_user"]}');
    await h.click();
    assert.equal(h.node("status").dataset.kind, "error");
    assert.match(h.node("status").textContent, /Import failed:/);
  }
});

test("popup Import opens the durable extension tab, never a native file picker", () => {
  const h = harness();
  const openerListeners = new Map();
  const mockNode = (id) => ({
    checked: false, value: "", dataset: {}, style: {},
    addEventListener(type, cb) { openerListeners.set(id + ":" + type, cb); },
    classList: {toggle(){}}
  });
  // Popup invokes event handlers on this separate simulated document.
  const popupNodes = new Map();
  h.ctx.document = {
    getElementById(id) {
      if(!popupNodes.has(id)) popupNodes.set(id,mockNode(id));
      return popupNodes.get(id);
    },
    querySelector() { return mockNode("query"); },
    querySelectorAll() { return []; },
    addEventListener() {},
    body:{insertBefore(){}}
  };
  h.load("popup.js");
  openerListeners.get("importBtn:click")();
  assert.equal(h.tabs.length, 1);
  assert.equal(h.tabs[0].url, "moz-extension://test-addon/import.html");
});
