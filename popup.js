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

  // Fetch preferences from input
  const loggingEnabled = document.getElementById("loggingEnabled").checked;
  const expandImages = document.getElementById("expandImages").checked;
  const blockUsers = document.getElementById("blockUsers").checked;
  const blockKeywords = document.getElementById("blockKeywords").checked;
  const blockSubreddits = document.getElementById("blockSubreddits").checked;

  // Save the data using the Chrome storage API
  chrome.storage.local.set({
    hiddenUsers: usersArray,
    hiddenKeywords: keywordsArray,
    hiddenSubreddits: subredditsArray,
    loggingEnabled: loggingEnabled,
    expandImages: expandImages,
    blockUsers: blockUsers,
    blockKeywords: blockKeywords,
    blockSubreddits: blockSubreddits,
  });
}

function loadData() {
  // Load the data using the Chrome storage API
  chrome.storage.local.get(
    [
      "hiddenUsers",
      "hiddenKeywords",
      "hiddenSubreddits",
      "loggingEnabled",
      "expandImages",
      "blockUsers",
      "blockKeywords",
      "blockSubreddits",
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

      // Load preferences
      if (result.loggingEnabled !== undefined) {
        document.getElementById("loggingEnabled").checked =
          result.loggingEnabled;
      }
      if (result.expandImages !== undefined) {
        document.getElementById("expandImages").checked = result.expandImages;
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
    }
  );
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
    } catch (err) {}
  });
}

// Set up event listeners on the textarea elements for the input event
document.getElementById("userList").addEventListener("input", saveData);
document.getElementById("keywordList").addEventListener("input", saveData);
document.getElementById("subredditList").addEventListener("input", saveData);
document.getElementById("loggingEnabled").addEventListener("change", saveData);
document.getElementById("expandImages").addEventListener("change", saveData);
document.getElementById("blockUsers").addEventListener("change", saveData);
document.getElementById("blockKeywords").addEventListener("change", saveData);
document.getElementById("blockSubreddits").addEventListener("change", saveData);

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
