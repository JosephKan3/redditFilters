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

  // Fetch logging preferences from input
  const loggingPreference =
    document.getElementById("loggingPreference").checked;
  console.log(loggingPreference);

  // Save the data using the Chrome storage API
  chrome.storage.local.set({
    hiddenUsers: usersArray,
    hiddenKeywords: keywordsArray,
    hiddenSubreddits: subredditsArray,
    loggingEnabled: loggingPreference,
  });
}

function loadData() {
  // Load the data using the Chrome storage API
  chrome.storage.local.get(
    ["hiddenUsers", "hiddenKeywords", "hiddenSubreddits", "loggingEnabled"],
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

      if (result.loggingEnabled !== undefined) {
        document.getElementById("loggingPreference").checked =
          result.loggingEnabled;
      }
    }
  );
}

function nuke() {
  // Sends request to main content script for users to ban
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "nukePage" },
      function (response) {
        if (response.status != 200) {
          console.log(response.message);
          document.getElementById("nukeDescription").innerHTML =
            response.message;
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
  });
}

// Set up event listeners on the textarea elements for the input event
document.getElementById("userList").addEventListener("input", saveData);
document.getElementById("keywordList").addEventListener("input", saveData);
document.getElementById("subredditList").addEventListener("input", saveData);
document
  .getElementById("loggingPreference")
  .addEventListener("change", saveData);

// Loads nuke button listener
document.addEventListener("DOMContentLoaded", function () {
  var button = document.querySelector(".nukeButton");

  if (button) {
    button.addEventListener("click", function () {
      nuke();
    });
  }
});

// Loads saved data back into input
document.addEventListener("DOMContentLoaded", loadData);
