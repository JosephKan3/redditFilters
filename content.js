// Handles the two website designs
const oldReddit = window.location.hostname === "old.reddit.com";

function showImages() {
  // Handle old reddit design
  if (oldReddit) {
    const links = document.querySelectorAll("a");

    links.forEach((link) => {
      const href = link.href;

      // Check if the href points to an image (basic check)
      if (link.textContent.trim() === "<image>") {
        const img = document.createElement("img");
        img.src = href;
        img.style.maxWidth = "100%"; // Optional: to ensure large images don't overflow

        // Replace the link with the image
        link.parentNode.replaceChild(img, link);
      }
    });
    // New reddit design automatically fully displays
  } else {
  }
}

function banPosts(bans, keywords) {
  // Handle old reddit design
  if (oldReddit) {
    const posts = document.querySelectorAll(".thing:not(.promotedlink)");
    const visiblePosts = Array.from(posts).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visiblePosts.forEach((post) => {
      const subreddit = post.getAttribute("data-subreddit");
      const title = post.querySelectorAll(`a.title`)[0].innerHTML;
      if (subreddit && title) {
        // Ban subreddits
        if (bans.includes(subreddit)) {
          if (loggingEnabled)
            console.log(
              `Hiding post based on subreddit: ${subreddit}: ${title}`
            );
          post.style.display = "none";
          return;
        }

        // Ban keywords
        lowerTitle = title.toLowerCase();
        for (let banWord of keywords) {
          if (lowerTitle.includes(banWord)) {
            if (loggingEnabled)
              console.log(`Hiding post based on keyword: ${banWord}: ${title}`);
            post.style.display = "none";
            return;
          }
        }
      }
    });
    // Handle new reddit design
  } else {
    const posts = document.querySelectorAll("shreddit-post");
    const visiblePosts = Array.from(posts).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visiblePosts.forEach((post) => {
      const subreddit = post.getAttribute("subreddit-prefixed-name").slice(2); // Slices off r/ prefix from subreddit name
      const title = post.getAttribute("post-title");
      // Ban subreddits
      if (bans.includes(subreddit)) {
        if (loggingEnabled)
          console.log(`Hiding post based on subreddit: ${subreddit}: ${title}`);
        post.style.display = "none";
        return;
      }

      // Ban keywords
      lowerTitle = title.toLowerCase();
      for (let banWord of keywords) {
        if (lowerTitle.includes(banWord)) {
          if (loggingEnabled)
            console.log(`Hiding post based on keyword: ${banWord}: ${title}`);
          post.style.display = "none";
          return;
        }
      }
    });
  }
}

let subreddit_bans = [];
let keyword_bans = [];
let loggingEnabled = true;

function getSavedOptions() {
  chrome.storage.local.get(
    ["hiddenKeywords", "hiddenSubreddits", "loggingEnabled"],
    function (result) {
      if (result.hiddenKeywords) {
        for (keyword of result.hiddenKeywords) {
          keyword_bans.push(keyword.toLowerCase());
        }
      }
      if (result.hiddenSubreddits) {
        for (subreddit of result.hiddenSubreddits) {
          // Slices off r/ in case the user included it
          let cleanedSubreddit = subreddit;
          if (subreddit.length >= 2) {
            if (subreddit.substring(0, 2) == "r/") {
              cleanedSubreddit == subreddit.slice(2);
            }
          }
          subreddit_bans.push(cleanedSubreddit.toLowerCase());
        }
      }
      if (result.loggingEnabled !== undefined) {
        loggingEnabled = result.loggingEnabled;
      }
    }
  );
}

// Run the function when the DOM is fully loaded
function observeDOMChanges() {
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length) {
        getSavedOptions();
        banPosts(subreddit_bans, keyword_bans);
        showImages();
      }
    });
  });

  var config = { childList: true, subtree: true };

  observer.observe(document.body, config);
}

// Start observing and hide existing elements
getSavedOptions();
showImages();
banPosts(subreddit_bans, keyword_bans);
observeDOMChanges();
