// Function to save popup data to storage
function saveData() {
  // Fetch keywords from input
  const keywordsString = document.getElementById("keywordList").value;
  const keywordsArray = keywordsString.split("\n").map((item) => item.trim());

  // Fetch subreddits from input
  const subredditsString = document.getElementById("subredditList").value;
  const subredditsArray = subredditsString
    .split("\n")
    .map((item) => item.trim());

  // Fetch logging preferences from input
  const loggingPreference =
    document.getElementById("loggingPreference").checked;
  console.log(loggingPreference);

  // Save the data using the Chrome storage API
  chrome.storage.local.set({
    hiddenKeywords: keywordsArray,
    hiddenSubreddits: subredditsArray,
    loggingEnabled: loggingPreference,
  });
}

function loadData() {
  // Load the data using the Chrome storage API
  chrome.storage.local.get(
    ["hiddenKeywords", "hiddenSubreddits", "loggingEnabled"],
    function (result) {
      if (result.hiddenKeywords) {
        document.getElementById("keywordList").value =
          result.hiddenKeywords.join("\n");
      }

      if (result.hiddenSubreddits) {
        document.getElementById("subredditList").value =
          result.hiddenSubreddits.join("\n");
      }

      if (result.loggingEnabled !== undefined) {
        document.getElementById("loggingPreference").checked =
          result.loggingEnabled;
      }
    }
  );
}

// Set up event listeners on the textarea elements for the input event
document.getElementById("keywordList").addEventListener("input", saveData);
document.getElementById("subredditList").addEventListener("input", saveData);
document
  .getElementById("loggingPreference")
  .addEventListener("change", saveData);

document.addEventListener("DOMContentLoaded", loadData);
