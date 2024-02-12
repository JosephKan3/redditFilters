// Function to save popup data to storage
function saveData() {
  // Get the value from the keyword list textarea
  const keywordsString = document.getElementById("keywordList").value;
  const keywordsArray = keywordsString.split("\n").map((item) => item.trim());

  // Get the value from the subreddit list textarea
  const subredditsString = document.getElementById("subredditList").value;
  const subredditsArray = subredditsString
    .split("\n")
    .map((item) => item.trim());

  // Save the data using the Chrome storage API
  chrome.storage.local.set(
    {
      hiddenKeywords: keywordsArray,
      hiddenSubreddits: subredditsArray,
    },
    function () {
      console.log("Data saved.");
    }
  );
}

function loadData() {
  // Load the data using the Chrome storage API
  chrome.storage.local.get(
    ["hiddenKeywords", "hiddenSubreddits"],
    function (result) {
      if (result.hiddenKeywords) {
        document.getElementById("keywordList").value =
          result.hiddenKeywords.join("\n");
      }
      if (result.hiddenSubreddits) {
        document.getElementById("subredditList").value =
          result.hiddenSubreddits.join("\n");
      }
    }
  );
}

// Set up event listeners on the textarea elements for the input event
document.getElementById("keywordList").addEventListener("input", saveData);
document.getElementById("subredditList").addEventListener("input", saveData);

document.addEventListener("DOMContentLoaded", loadData);
