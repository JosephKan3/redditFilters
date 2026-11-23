"use strict";

// Strict parser: reject the entire export before modifying storage if malformed.
function parseImportData(text) {
  if (typeof text !== "string") throw new Error("File could not be read as text");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error("File is empty");

  const data = {
    hiddenUsers: [], hiddenKeywords: [], hiddenSubreddits: [], hiddenDomains: [],
  };
  const keyMap = {
    blockedUsers: "hiddenUsers",
    blockedKeywords: "hiddenKeywords",
    blockedSubreddits: "hiddenSubreddits",
    blockedDomains: "hiddenDomains",
  };
  const preferenceKeys = [
    "blockUsers", "blockKeywords", "blockSubreddits", "blockDomains",
    "blockAds", "nukeConfirm", "requireBlockConfirm",
  ];
  const seen = new Set();

  lines.forEach((line, index) => {
    let parsed;
    try { parsed = JSON.parse(line); }
    catch { throw new Error("Invalid JSON on line " + (index + 1)); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        typeof parsed.category !== "string") {
      throw new Error("Missing or invalid category on line " + (index + 1));
    }
    const category = parsed.category;
    if (category !== "preferences" && !Object.hasOwn(keyMap, category)) {
      throw new Error("Unrecognized category '" + category + "' on line " + (index + 1));
    }
    if (seen.has(category)) {
      throw new Error("Duplicate category '" + category + "' on line " + (index + 1));
    }
    seen.add(category);

    if (category === "preferences") {
      for (const key of preferenceKeys) {
        if (Object.hasOwn(parsed, key)) {
          if (typeof parsed[key] !== "boolean") {
            throw new Error("Invalid preference '" + key + "' on line " + (index + 1));
          }
          data[key] = parsed[key];
        }
      }
    } else {
      if (!Array.isArray(parsed.items) ||
          !parsed.items.every((item) => typeof item === "string")) {
        throw new Error("Invalid items in '" + category + "' on line " + (index + 1));
      }
      data[keyMap[category]] = parsed.items;
    }
  });
  return data;
}

const importFileInput = document.getElementById("importFileInput");
const importButton = document.getElementById("importBtn");
const preview = document.getElementById("preview");
const status = document.getElementById("status");
let pendingImport = null;

function setStatus(message, kind = "") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function listCounts(data) {
  return [
    ["Users", data.hiddenUsers.length],
    ["Keywords", data.hiddenKeywords.length],
    ["Subreddits", data.hiddenSubreddits.length],
    ["Domains", data.hiddenDomains.length],
  ];
}

function showPreview(data) {
  const counts = listCounts(data);
  const lines = counts.map(([label, count]) => label + ": " + count).join(" · ");
  const enabled = Object.keys(data).filter((key) =>
    !key.startsWith("hidden")).length;
  preview.textContent = "Ready to replace saved lists. " + lines +
    ". Preferences included: " + enabled + ".";
  preview.hidden = false;
}

// One distinct extension tab owns the entire file-picker/read/save lifecycle.
importFileInput.addEventListener("change", () => {
  pendingImport = null;
  importButton.disabled = true;
  preview.hidden = true;
  setStatus("");
  const file = importFileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onerror = () => setStatus("Unable to read the selected file.", "error");
  reader.onload = (event) => {
    try {
      pendingImport = parseImportData(event.target.result);
      showPreview(pendingImport);
      importButton.disabled = false;
    } catch (error) {
      pendingImport = null;
      setStatus("Import rejected: " + error.message, "error");
    }
  };
  reader.readAsText(file);
});

function callbackStorage(method, args) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local[method](...args, (result) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message || String(error)));
        else resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function saveAndVerify(data) {
  await callbackStorage("set", [data]);
  const verified = await callbackStorage("get", [Object.keys(data)]);
  for (const key of Object.keys(data)) {
    if (JSON.stringify(verified[key]) !== JSON.stringify(data[key])) {
      throw new Error("Storage read-back differs for " + key);
    }
  }
  return listCounts(data).map(([name, count]) => name + ": " + count).join(" · ");
}

importButton.addEventListener("click", async () => {
  if (!pendingImport) return;
  if (!confirm("Replace the existing block lists with this export?")) return;
  const data = pendingImport;
  importButton.disabled = true;
  importFileInput.disabled = true;
  setStatus("Saving and verifying…");
  try {
    const counts = await saveAndVerify(data);
    setStatus("Imported and verified. " + counts +
      ". Reload any open Reddit tabs.", "success");
  } catch (error) {
    setStatus("Import failed: " + error.message, "error");
  } finally {
    importButton.disabled = false;
    importFileInput.disabled = false;
  }
});
