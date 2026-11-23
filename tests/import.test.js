// Regression coverage for the popup's actual import flow and persisted state.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function setup(options = {}) {
  const store = { hiddenUsers: ["old_user"], hiddenKeywords: ["old_keyword"] };
  const alerts = [];
  const writes = [];
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {
        id, value: "", checked: false, disabled: false, style: {},
        addEventListener() {},
        getBoundingClientRect() { return {}; },
        classList: {
          add(key) { classes.add(key); },
          remove(key) { classes.delete(key); },
          toggle(key, flag) { if (flag) classes.add(key); else classes.delete(key); },
          contains(key) { return classes.has(key); }
        }
      });
    }
    return elements.get(id);
  }

  const chrome = {
    runtime: { lastError: undefined },
    storage: { local: {
      get(keys, callback) {
        const result = {};
        for (const key of keys) if (Object.prototype.hasOwnProperty.call(store, key)) result[key] = store[key];
        callback(result);
      },
      set(data, callback) {
        writes.push(data);
        if (options.failWrite) {
          chrome.runtime.lastError = { message: "simulated storage error" };
          callback();
          chrome.runtime.lastError = undefined;
          return;
        }
        Object.assign(store, data);
        callback();
      }
    }}
  };
  const ctx = {
    chrome,
    document: {
      getElementById: element,
      querySelector() { return element("query"); },
      querySelectorAll() { return []; },
      addEventListener() {},
      body: { insertBefore() {} },
    },
    FileReader: class {
      readAsText(file) {
        if (file.readError) this.onerror();
        else this.onload({ target: { result: file.text } });
      }
    },
    alert(message) { alerts.push(message); },
    requestAnimationFrame(callback) { callback(); },
    setTimeout() {},
    console
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../popup.js"), "utf8"), ctx, {
    filename: "popup.js"
  });
  return { ctx, store, alerts, writes, element };
}

test("exported JSONL persists all lists and preferences before showing success", () => {
  const h = setup();
  const lines = [
    { category: "preferences", blockUsers: false, blockKeywords: true,
      blockSubreddits: true, blockDomains: false, blockAds: false,
      nukeConfirm: true, requireBlockConfirm: false },
    { category: "blockedUsers", items: ["new_user"] },
    { category: "blockedKeywords", items: ["AI", "ChatGPT"] },
    { category: "blockedSubreddits", items: ["test"] },
    { category: "blockedDomains", items: ["example.com"] }
  ];
  h.ctx.importData({ text: lines.map(JSON.stringify).join("\r\n") + "\r\n" });
  assert.equal(h.writes.length, 1);
  assert.deepEqual(Array.from(h.store.hiddenUsers), ["new_user"]);
  assert.deepEqual(Array.from(h.store.hiddenKeywords), ["AI", "ChatGPT"]);
  assert.deepEqual(Array.from(h.store.hiddenSubreddits), ["test"]);
  assert.deepEqual(Array.from(h.store.hiddenDomains), ["example.com"]);
  assert.equal(h.store.blockUsers, false);
  assert.equal(h.store.blockAds, false);
  assert.equal(h.store.requireBlockConfirm, false);
  assert.equal(h.element("userList").value, "new_user");
  assert.equal(h.element("keywordList").value, "AI\nChatGPT");
  assert.equal(h.element("importSuccess").style.display, "block");
  assert.equal(h.alerts.length, 0);
});

test("preferences-only export clears lists while leaving omitted settings unchanged", () => {
  const h = setup();
  h.store.loggingEnabled = true;
  h.ctx.importData({ text: JSON.stringify({ category: "preferences", blockUsers: true }) });
  assert.deepEqual(Array.from(h.store.hiddenUsers), []);
  assert.deepEqual(Array.from(h.store.hiddenKeywords), []);
  assert.equal(h.store.loggingEnabled, true);
  assert.equal(h.store.blockUsers, true);
});

test("invalid category, missing items, malformed JSON and duplicates do not overwrite storage", () => {
  for (const input of [
    '{"category":"unknown","items":["a"]}',
    '{"category":"blockedUsers"}',
    '{"category":"blockedUsers","items":[7]}',
    '{"category":"preferences","blockUsers":"false"}',
    '{"category":"blockedUsers","items":["valid"]}\ncorrupt',
    '{"category":"blockedUsers","items":["a"]}\n{"category":"blockedUsers","items":["b"]}',
    ""
  ]) {
    const h = setup();
    h.ctx.importData({ text: input });
    assert.equal(h.writes.length, 0, input);
    assert.deepEqual(h.store.hiddenUsers, ["old_user"], input);
    assert.equal(h.element("importSuccess").style.display, undefined, input);
    assert.match(h.alerts[0], /^Import failed:/);
  }
});

test("storage errors do not display a success state or replace popup values", () => {
  const h = setup({ failWrite: true });
  h.element("userList").value = "old_user";
  h.ctx.importData({ text: '{"category":"blockedUsers","items":["new_user"]}' });
  assert.deepEqual(h.store.hiddenUsers, ["old_user"]);
  assert.equal(h.element("userList").value, "old_user");
  assert.equal(h.element("importSuccess").style.display, undefined);
  assert.match(h.alerts[0], /Import failed to save: simulated storage error/);
});

test("file reading error is reported without modifying storage", () => {
  const h = setup();
  h.ctx.importData({ readError: true });
  assert.equal(h.writes.length, 0);
  assert.match(h.alerts[0], /could not read/);
});
