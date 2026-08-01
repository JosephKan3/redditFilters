/*
 * Preview-only shim for the Chrome extension APIs.
 *
 * This lets popup.html render and behave in a normal browser (e.g. the v0
 * preview) where the `chrome.*` extension APIs do not exist. It is a complete
 * no-op inside the real extension: if `chrome.storage` is already available we
 * leave everything untouched.
 */
(function () {
  var hasRealChrome =
    typeof chrome !== "undefined" && chrome && chrome.storage && chrome.storage.local;
  if (hasRealChrome) return;

  var STORAGE_KEY = "__redditFiltersPreviewStore__";

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      /* ignore quota errors in preview */
    }
  }

  var shim = {
    storage: {
      local: {
        get: function (keys, callback) {
          var store = readStore();
          var result = {};
          if (keys == null) {
            result = store;
          } else if (typeof keys === "string") {
            if (keys in store) result[keys] = store[keys];
          } else if (Array.isArray(keys)) {
            keys.forEach(function (k) {
              if (k in store) result[k] = store[k];
            });
          } else if (typeof keys === "object") {
            // keys is an object of defaults
            Object.keys(keys).forEach(function (k) {
              result[k] = k in store ? store[k] : keys[k];
            });
          }
          if (typeof callback === "function") callback(result);
          return Promise.resolve(result);
        },
        set: function (items, callback) {
          var store = readStore();
          Object.keys(items || {}).forEach(function (k) {
            store[k] = items[k];
          });
          writeStore(store);
          if (typeof callback === "function") callback();
          return Promise.resolve();
        },
        remove: function (keys, callback) {
          var store = readStore();
          (Array.isArray(keys) ? keys : [keys]).forEach(function (k) {
            delete store[k];
          });
          writeStore(store);
          if (typeof callback === "function") callback();
          return Promise.resolve();
        },
      },
    },
    tabs: {
      query: function (queryInfo, callback) {
        // Pretend there is a single active tab so the popup logic proceeds.
        var tabs = [{ id: 0, active: true, url: "https://www.reddit.com/" }];
        if (typeof callback === "function") callback(tabs);
        return Promise.resolve(tabs);
      },
      sendMessage: function () {
        // No content script in preview; resolve so `.then/.catch` chains work.
        return Promise.resolve();
      },
    },
    runtime: {
      // Present so any `chrome.runtime.lastError` checks read as undefined.
      lastError: undefined,
    },
  };

  window.chrome = typeof chrome !== "undefined" && chrome ? chrome : {};
  window.chrome.storage = window.chrome.storage || shim.storage;
  window.chrome.tabs = window.chrome.tabs || shim.tabs;
  window.chrome.runtime = window.chrome.runtime || shim.runtime;

  console.log("[v0] chrome-preview-shim active (extension APIs mocked for preview)");
})();
