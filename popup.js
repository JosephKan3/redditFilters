// Function to save popup data to storage
function saveData() {
  // Fetch users from input
  const usersString = document.getElementById("userList").value;
  const usersArray = usersString.split("\n").map((item) => item.trim());

  // Fetch keywords from input
  const keywordsString = document.getElementById("keywordList").value;
  const keywordsArray = keywordsString.split("\n").map((item) => item.trim());

  // Fetch subreddits from input
  const subredditsString = document.getElementById("subredditList").value;
  const subredditsArray = subredditsString
    .split("\n")
    .map((item) => item.trim());

  // Fetch domains from input
  const domainsString = document.getElementById("domainList").value;
  const domainsArray = domainsString.split("\n").map((item) => item.trim());

  // Fetch preferences from input
  const loggingEnabled = document.getElementById("loggingEnabled").checked;
  const showBlockButtons = document.getElementById("showBlockButtons").checked;
  const blockUsers = document.getElementById("blockUsers").checked;
  const blockKeywords = document.getElementById("blockKeywords").checked;
  const blockSubreddits = document.getElementById("blockSubreddits").checked;
  const blockDomains = document.getElementById("blockDomains").checked;
  const blockAds = document.getElementById("blockAds").checked;
  const nukeConfirm = document.getElementById("nukeConfirm").checked;
  const requireBlockConfirm = document.getElementById("requireBlockConfirm").checked;

  // Save the data using the Chrome storage API
  chrome.storage.local.set({
    hiddenUsers: usersArray,
    hiddenKeywords: keywordsArray,
    hiddenSubreddits: subredditsArray,
    hiddenDomains: domainsArray,
    loggingEnabled: loggingEnabled,
    showBlockButtons: showBlockButtons,
    blockUsers: blockUsers,
    blockKeywords: blockKeywords,
    blockSubreddits: blockSubreddits,
    blockDomains: blockDomains,
    blockAds: blockAds,
    nukeConfirm: nukeConfirm,
    requireBlockConfirm: requireBlockConfirm,
  });
}

function updateRequireBlockConfirmState() {
  const showBlockButtons = document.getElementById("showBlockButtons").checked;
  const requireBlockConfirm = document.getElementById("requireBlockConfirm");
  const requireBlockConfirmToggle = document.getElementById("requireBlockConfirmToggle");

  requireBlockConfirm.disabled = !showBlockButtons;
  requireBlockConfirmToggle.classList.toggle("disabledToggle", !showBlockButtons);
}

function loadData() {
  // Load the data using the Chrome storage API
  chrome.storage.local.get(
    [
      "hiddenUsers",
      "hiddenKeywords",
      "hiddenSubreddits",
      "hiddenDomains",
      "loggingEnabled",
      "showBlockButtons",
      "blockUsers",
      "blockKeywords",
      "blockSubreddits",
      "blockDomains",
      "blockAds",
      "nukeConfirm",
      "requireBlockConfirm",
    ],
    function (result) {
      if (result.hiddenUsers) {
        document.getElementById("userList").value =
          result.hiddenUsers.join("\n");
      }

      if (result.hiddenKeywords) {
        document.getElementById("keywordList").value =
          result.hiddenKeywords.join("\n");
      }

      if (result.hiddenSubreddits) {
        document.getElementById("subredditList").value =
          result.hiddenSubreddits.join("\n");
      }

      if (result.hiddenDomains) {
        document.getElementById("domainList").value =
          result.hiddenDomains.join("\n");
      }

      // Load preferences
      if (result.loggingEnabled !== undefined) {
        document.getElementById("loggingEnabled").checked =
          result.loggingEnabled;
      }
      if (result.showBlockButtons !== undefined) {
        document.getElementById("showBlockButtons").checked = result.showBlockButtons;
      } else {
        document.getElementById("showBlockButtons").checked = true;
      }
      if (result.blockUsers !== undefined) {
        document.getElementById("blockUsers").checked = result.blockUsers;
      }
      if (result.blockKeywords !== undefined) {
        document.getElementById("blockKeywords").checked = result.blockKeywords;
      }
      if (result.blockSubreddits !== undefined) {
        document.getElementById("blockSubreddits").checked =
          result.blockSubreddits;
      }
      if (result.blockDomains !== undefined) {
        document.getElementById("blockDomains").checked = result.blockDomains;
      }
      if (result.blockAds !== undefined) {
        document.getElementById("blockAds").checked = result.blockAds;
      } else {
        document.getElementById("blockAds").checked = true;
      }
      if (result.nukeConfirm !== undefined) {
        document.getElementById("nukeConfirm").checked = result.nukeConfirm;
      }
      if (result.requireBlockConfirm !== undefined) {
        document.getElementById("requireBlockConfirm").checked = result.requireBlockConfirm;
      } else {
        document.getElementById("requireBlockConfirm").checked = true;
      }

      updateRequireBlockConfirmState();

      // Load saved section order
      loadSectionOrder();
    }
  );
}

function saveSectionOrder() {
  const sections = document.querySelectorAll(".draggableSection");
  const order = Array.from(sections).map((s) => s.dataset.section);
  chrome.storage.local.set({ sectionOrder: order });
}

function loadSectionOrder() {
  chrome.storage.local.get(["sectionOrder"], function (result) {
    if (!result.sectionOrder || result.sectionOrder.length === 0) return;

    const sections = document.querySelectorAll(".draggableSection");
    const sectionMap = {};
    sections.forEach((s) => {
      sectionMap[s.dataset.section] = s;
    });

    const body = document.body;
    const dropZone = document.querySelector(".drop-zone");
    const endDiv = document.querySelector(".end");

    result.sectionOrder.forEach((key) => {
      if (sectionMap[key]) {
        body.insertBefore(sectionMap[key], dropZone);
      }
    });
  });
}

function nuke() {
  // Sends request to main content script for users to ban
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    try {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "nukePage" },
        function (response) {
          if (!response || response.status != 200) {
            document.getElementById("nukeDescription").innerHTML =
              "Can only nuke when window is on a reddit thread";
            return;
          }

          const foundUsers = response.message;
          // Adds all found users to the ban list
          const usersString = document.getElementById("userList").value;
          const usersArray = usersString.split("\n").map((item) => item.trim());
          const combinedUsersArray = [...foundUsers, ...usersArray];

          // Save combined array
          chrome.storage.local.set({
            hiddenUsers: combinedUsersArray,
          });

          // Print combined array to UI
          document.getElementById("userList").value =
            combinedUsersArray.join("\n");
        }
      );
    } catch (err) {
      console.error("Nuke failed:", err);
    }
  });
}

// Set up event listeners on the textarea elements for the input event
document.getElementById("userList").addEventListener("input", saveData);
document.getElementById("keywordList").addEventListener("input", saveData);
document.getElementById("subredditList").addEventListener("input", saveData);
document.getElementById("domainList").addEventListener("input", saveData);

// Toggle change listeners - save and notify content scripts immediately
const toggleIds = ["loggingEnabled", "showBlockButtons", "requireBlockConfirm", "blockUsers", "blockKeywords", "blockSubreddits", "blockDomains", "blockAds", "nukeConfirm"];
toggleIds.forEach((id) => {
  document.getElementById(id).addEventListener("change", () => {
    saveData();
    if (id === "showBlockButtons") {
      const val = document.getElementById(id).checked;
      updateRequireBlockConfirmState();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach((tab) => {
          // Use callback-style messaging for Firefox and Chromium compatibility.
          // Consume lastError when a Reddit content script is not present.
          const request = chrome.tabs.sendMessage(
            tab.id,
            { action: "toggleBlockButtons", value: val },
            () => { void chrome.runtime.lastError; }
          );
          if (request && typeof request.catch === "function") request.catch(() => {});
        });
      });
    }
  });
});

// Drag and drop logic
let draggedSection = null;
const dropZone = document.querySelector(".drop-zone");
let lastReorderKey = ""; // Guard against unnecessary DOM mutations

function onDragStart(e) {
  draggedSection = this.closest(".draggableSection");
  draggedSection.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragEnd() {
  if (draggedSection) {
    draggedSection.classList.remove("dragging");
  }
  draggedSection = null;
  lastReorderKey = "";
}

// Set up drag and drop on section headers
function setupDragDrop() {
  const headers = document.querySelectorAll(".sectionHeader");
  headers.forEach((header) => {
    header.setAttribute("draggable", "true");
    header.addEventListener("dragstart", onDragStart);
    header.addEventListener("dragend", onDragEnd);
  });

  // Per-section dragover — triggers reorder when cursor enters each section's area during drag
  const allSections = document.querySelectorAll(".draggableSection");
  allSections.forEach((section) => {
    section.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (!draggedSection || draggedSection === this) return;

      // Find first non-dragged section whose midpoint cursor is above
      const otherSections = Array.from(document.querySelectorAll(".draggableSection"))
        .filter((s) => s !== draggedSection);

      let insertBeforeIdx = -1;
      for (let i = 0; i < otherSections.length; i++) {
        const rect = otherSections[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY <= midY) {
          insertBeforeIdx = i;
          break;
        }
      }

      let targetNode;
      if (insertBeforeIdx === -1) {
        const endDiv = document.querySelector(".end");
        if (endDiv && draggedSection.nextElementSibling !== endDiv) {
          draggedSection.parentNode.insertBefore(draggedSection, endDiv);
        }
      } else {
        targetNode = otherSections[insertBeforeIdx];
        if (draggedSection.nextElementSibling !== targetNode) {
          draggedSection.parentNode.insertBefore(draggedSection, targetNode);
        }
      }
    });

    section.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      saveSectionOrder();
    });
  });
  if (dropZone) {
    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const endDiv = document.querySelector(".end");
      if (endDiv && draggedSection !== endDiv.previousSibling) {
        document.body.insertBefore(draggedSection, endDiv);
      }
      saveSectionOrder();
    });
  }
}

// Set up nuke button listener
document.addEventListener("DOMContentLoaded", function () {
  var button = document.querySelector(".nukeButton");

  if (button) {
    button.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const url = tabs[0].url;
        if (!url || !url.includes("/comments/")) {
          document.getElementById("nukeDescription").innerHTML =
            "Can only nuke when window is on a reddit thread";
          return;
        }
        const requireConfirm = document.getElementById("nukeConfirm").checked;
        if (requireConfirm && !confirm("Are you sure? This will add the author and commentors to your block list.")) {
          return;
        }
        nuke();
      });
    });
  }

  setupDragDrop();
});


// Loads saved data back into input
document.addEventListener("DOMContentLoaded", loadData);

// Export all blocks as JSONL
function exportData() {
  const users = document.getElementById("userList").value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const keywords = document.getElementById("keywordList").value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const subreddits = document.getElementById("subredditList").value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const domains = document.getElementById("domainList").value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // Sort by category alphabetically (blockedDomains, blockedKeywords, blockedSubreddits, blockedUsers)
  const categories = [
    { key: "blockedDomains", label: "Blocked Domains", items: domains },
    { key: "blockedKeywords", label: "Blocked Keywords", items: keywords },
    { key: "blockedSubreddits", label: "Blocked Subreddits", items: subreddits },
    { key: "blockedUsers", label: "Blocked Users", items: users },
  ];

  const lines = [];
  categories.forEach(({ key, label, items }) => {
    if (items.length > 0) {
      lines.push(JSON.stringify({ category: key, label: label, items: items }));
    }
  });

  // Also export preferences (block toggles only)
  lines.unshift(
    JSON.stringify({
      category: "preferences",
      blockUsers: document.getElementById("blockUsers").checked,
      blockKeywords: document.getElementById("blockKeywords").checked,
      blockSubreddits: document.getElementById("blockSubreddits").checked,
      blockDomains: document.getElementById("blockDomains").checked,
      blockAds: document.getElementById("blockAds").checked,
      nukeConfirm: document.getElementById("nukeConfirm").checked,
      requireBlockConfirm: document.getElementById("requireBlockConfirm").checked,
    })
  );

  const content = lines.join("\n") + "\n";
  const blob = new Blob([content], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reddit-filters-export-${new Date().toISOString().slice(0,10)}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse a complete exported JSONL file before changing any saved settings.
function parseImportData(text) {
  if (typeof text !== "string") throw new Error("File could not be read as text");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error("File is empty");

  const data = {
    hiddenUsers: [],
    hiddenKeywords: [],
    hiddenSubreddits: [],
    hiddenDomains: [],
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
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error("Invalid JSON on line " + (index + 1));
    }
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

// Import from JSONL, persisting before indicating success.
function importData(file) {
  const reader = new FileReader();
  reader.onerror = () => alert("Import failed: could not read the selected file");
  reader.onload = function (event) {
    let data;
    try {
      data = parseImportData(event.target.result);
    } catch (err) {
      alert("Import failed: " + err.message);
      return;
    }

    // Categories omitted by Export are intentionally empty. Preferences not
    // present in the export retain their existing values.
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      if (error) {
        alert("Import failed to save: " + error);
        return;
      }

      // Read back the committed settings; do not update the UI before saving.
      loadData();
      const successEl = document.getElementById("importSuccess");
      if (successEl) {
        successEl.classList.remove("visible");
        void successEl.getBoundingClientRect();
        successEl.style.display = "block";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => successEl.classList.add("visible"));
        });
        setTimeout(() => {
          successEl.classList.remove("visible");
          setTimeout(() => { successEl.style.display = "none"; }, 300);
        }, 30000);
      }
    };

    try {
      const pending = chrome.storage.local.set(data, () => {
        const error = chrome.runtime.lastError;
        finish(error ? (error.message || String(error)) : null);
      });
      // Firefox can also return a promise from chrome.* APIs.
      if (pending && typeof pending.then === "function") {
        pending.then(() => finish(null), (err) => finish(err.message || String(err)));
      }
    } catch (err) {
      finish(err.message || String(err));
    }
  };
  reader.readAsText(file);
}

// Warn before opening file picker
function triggerImport() {
  if (!confirm("Importing will replace your current block lists. Do you wish to continue?")) {
    return;
  }
  document.getElementById("importFileInput").click();
}

// Set up import/export button listeners
document.getElementById("exportBtn").addEventListener("click", exportData);
document.getElementById("importBtn").addEventListener("click", triggerImport);
document.getElementById("importFileInput").addEventListener("change", function (e) {
  if (e.target.files.length > 0) {
    importData(e.target.files[0]);
    e.target.value = ""; // Reset so same file can be re-imported
  }
});

// Stats
const mainSections = document.querySelectorAll(".draggableSection, .end, .importExportSection, .drop-zone");

function showStats() {
  mainSections.forEach(el => el.style.display = "none");
  document.getElementById("statsView").style.display = "block";
  document.querySelector("h1").textContent = "Stats";
  chrome.storage.local.get(["statsData"], (res) => {
    const stats = res.statsData || { keywords: {}, subreddits: {} };
    renderStatsTable("keywordStatsTable", stats.keywords);
    renderStatsTable("subredditStatsTable", stats.subreddits);
  });
}

function hideStats() {
  mainSections.forEach(el => el.style.display = "");
  document.getElementById("statsView").style.display = "none";
  document.querySelector("h1").textContent = "Advanced Reddit Filters";
}

function renderStatsTable(tableId, data) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([key, count]) => {
    const tr = document.createElement("tr");
    const tdKey = document.createElement("td");
    tdKey.textContent = key;
    const tdCount = document.createElement("td");
    tdCount.textContent = count;
    const tdRemove = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.className = "statRemoveBtn";
    removeBtn.title = "Remove from stats";
    removeBtn.addEventListener("click", () => {
      chrome.storage.local.get(["statsData"], (res) => {
        const stats = res.statsData || { keywords: {}, subreddits: {} };
        const type = tableId === "keywordStatsTable" ? "keywords" : "subreddits";
        delete stats[type][key];
        chrome.storage.local.set({ statsData: stats });
        showStats();
      });
    });
    tdRemove.appendChild(removeBtn);
    tr.appendChild(tdKey);
    tr.appendChild(tdCount);
    tr.appendChild(tdRemove);
    tbody.appendChild(tr);
  });
}

document.getElementById("statsBtn").addEventListener("click", showStats);
document.getElementById("backBtn").addEventListener("click", hideStats);
document.getElementById("resetStatsBtn").addEventListener("click", () => {
  if (confirm("Reset all stats?")) {
    chrome.storage.local.set({ statsData: { keywords: {}, subreddits: {} } });
    showStats();
  }
});
