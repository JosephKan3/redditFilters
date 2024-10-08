// Handles the two website designs
const oldReddit = window.location.hostname === "old.reddit.com";

function showImages() {
  if (!expandImages) return;
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

function banPosts(subreddits, keywords, users, domains) {
  // Do not ban posts of a dedicated thread page
  if (window.location.pathname.includes("/comments/")) return;
  // Handle old reddit design
  if (oldReddit) {
    const posts = document.querySelectorAll(".thing:not(.promotedlink)");
    const visiblePosts = Array.from(posts).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visiblePosts.forEach((post) => {
      const subreddit = post.getAttribute("data-subreddit");
      const title = post.querySelectorAll(`a.title`)[0].innerHTML;
      const author = post.getAttribute("data-author");
      const domain = post.getAttribute("data-domain");
      if (subreddit && title) {
        // Ban subreddits
        if (blockSubreddits && subreddits.has(subreddit.toLowerCase())) {
          if (loggingEnabled)
            console.log(
              `Hiding post based on subreddit: ${subreddit}: ${title}`
            );
          post.style.display = "none";
          return;
        }

        // Ban keywords
        lowerTitle = title.toLowerCase();
        if (blockKeywords) {
          for (let banWord of keywords) {
            if (lowerTitle.includes(banWord)) {
              if (loggingEnabled)
                console.log(
                  `Hiding post based on keyword: ${banWord}: ${title}`
                );
              post.style.display = "none";
              return;
            }
          }
        }

        // Ban users
        if (blockUsers && users.has(author)) {
          if (loggingEnabled)
            console.log(`Hiding post based on user: ${author}: ${title}`);
          post.style.display = "none";
          return;
        }

        // Ban domains
        if (blockDomains && domains.has(domain.toLowerCase())) {
          if (loggingEnabled)
            console.log(`Hiding post based on domain: ${domain}: ${title}`);
          post.style.display = "none";
          return;
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
      const author = post.getAttribute("author");
      const domain = post.getAttribute("domain");
      // Ban subreddits
      if (blockSubreddits && subreddits.has(subreddit.toLowerCase())) {
        if (loggingEnabled)
          console.log(`Hiding post based on subreddit: ${subreddit}: ${title}`);
        post.style.display = "none";
        return;
      }

      // Ban keywords
      lowerTitle = title.toLowerCase();
      if (blockKeywords) {
        for (let banWord of keywords) {
          if (lowerTitle.includes(banWord)) {
            if (loggingEnabled)
              console.log(`Hiding post based on keyword: ${banWord}: ${title}`);
            post.style.display = "none";
            return;
          }
        }
      }

      // Ban users
      if (blockUsers && users.has(author)) {
        if (loggingEnabled)
          console.log(`Hiding post based on user: ${author}: ${title}`);
        post.style.display = "none";
        return;
      }

      // Ban domains
      if (blockDomains && domains.has(domain.toLowerCase())) {
        if (loggingEnabled)
          console.log(`Hiding post based on domain: ${domain}: ${title}`);
        post.style.display = "none";
        return;
      }
    });
  }
}

function banComments(users = []) {
  if (!window.location.pathname.includes("/comments/")) return;
  if (!blockUsers) return;

  if (oldReddit) {
    const comments = document
      .querySelector(".commentarea")
      .querySelectorAll(".thing:not(.morechildren,.deleted)");
    const visibleComments = Array.from(comments).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visibleComments.forEach((comment) => {
      const author = comment.getAttribute("data-author");
      if (author && users.has(author)) {
        // Ban users
        if (loggingEnabled)
          console.log(`Hiding comment based on user: ${author}`);
        comment.style.display = "none";
        return;
      }
    });
    // Handle new reddit design
  } else {
    const comments = document.querySelectorAll("shreddit-comment");
    const visibleComments = Array.from(comments).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visibleComments.forEach((comment) => {
      const author = comment.getAttribute("author");
      if (author && users.has(author)) {
        // Ban users
        if (loggingEnabled)
          console.log(`Hiding comment based on user: ${author}`);
        comment.style.display = "none";
        return;
      }
    });
  }
}

function getSavedOptions() {
  chrome.storage.local.get(
    [
      "hiddenUsers",
      "hiddenKeywords",
      "hiddenSubreddits",
      "hiddenDomains",
      "loggingEnabled",
      "expandImages",
      "blockUsers",
      "blockKeywords",
      "blockSubreddits",
      "blockDomains",
    ],
    function (result) {
      if (result.hiddenUsers) {
        for (user of result.hiddenUsers) {
          // Slices off u/ in case the user included it
          let cleanedUser = user;
          if (cleanedUser.length >= 2) {
            if (user.substring(0, 2) == "r/") {
              cleanedUser == user.slice(2);
            }
          }
          user_bans.add(cleanedUser);
        }
      }

      if (result.hiddenKeywords) {
        for (keyword of result.hiddenKeywords) {
          if (keyword.trim() != "") {
            keyword_bans.add(keyword.toLowerCase());
          }
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
          subreddit_bans.add(cleanedSubreddit.toLowerCase());
        }
      }

      if (result.hiddenDomains) {
        for (domain of result.hiddenDomains) {
          // Regex for matching domain from user inputs
          const pattern = /^(?:https?:\/\/)?(?:www\.)?([^\/\?#]+).*$/i;
          const match = domain.replace(pattern, "$1") ?? "";
          domain_bans.add(match.toLowerCase());
        }
      }

      if (result.loggingEnabled !== undefined) {
        loggingEnabled = result.loggingEnabled;
      }
      if (result.expandImages !== undefined) {
        expandImages = result.expandImages;
      }
      if (result.blockUsers !== undefined) {
        blockUsers = result.blockUsers;
      }
      if (result.blockKeywords !== undefined) {
        blockKeywords = result.blockKeywords;
      }
      if (result.blockSubreddits !== undefined) {
        blockSubreddits = result.blockSubreddits;
      }
      if (result.blockDomains !== undefined) {
        blockDomains = result.blockDomains;
      }
    }
  );
}

// Inputs
let user_bans = new Set();
let subreddit_bans = new Set();
let keyword_bans = new Set();
let domain_bans = new Set();
let loggingEnabled = false;
let expandImages = false;
let blockUsers = false;
let blockKeywords = false;
let blockSubreddits = false;
let blockDomains = false;

// Run the function when the DOM is fully loaded
function observeDOMChanges() {
  var observer = new MutationObserver(function (mutations) {
    if (mutations.some((mutation) => mutation.addedNodes.length)) {
      getSavedOptions();
      banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
      banComments(user_bans);
      showImages();
    }
  });

  var config = { childList: true, subtree: true };
  observer.observe(document.body, config);
}

function nukeAnimation() {
  // Create the overlay div
  const overlay = document.createElement("div");
  overlay.id = "myExtensionOverlay";

  // Create the img element for the GIF
  const gif = document.createElement("img");
  gif.src = chrome.runtime.getURL("assets/explosion-boom.gif"); // Replace with the actual URL of your GIF
  overlay.appendChild(gif);

  // Append the overlay to the body
  document.body.appendChild(overlay);

  overlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
`;
  gif.style.cssText = `
  width: 100vw;
  height: auto;
`;

  // Remove the overlay after 4.5 seconds
  setTimeout(() => {
    overlay.remove();
  }, 4500);
}

function handleNukeRequest(request, sender, sendResponse) {
  if (request.action === "nukePage") {
    if (!window.location.pathname.includes("/comments/")) {
      sendResponse({ status: 400, message: "Can only nuke threads" }); // Ignore nuke request
    } else {
      console.log("Kablooie!");
      nukeAnimation();
      let usersToBan = [];
      if (oldReddit) {
        const postsAndComments = document.querySelectorAll(
          ".thing:not(.morechildren,.deleted)"
        );

        // Fetches all authors in the thread and returns them
        usersToBan = Array.from(postsAndComments).reduce(
          (accumulatedBans, comment) => {
            const author = comment.getAttribute("data-author");
            // Only ban users that aren't already banned
            if (author && !user_bans.has(author)) {
              accumulatedBans.push(author);
            }
            return accumulatedBans;
          },
          []
        );
        sendResponse({ status: 200, message: usersToBan });
        // Handle new reddit design
      } else {
        const postsAndComments = document.querySelectorAll(
          "shreddit-post, shreddit-comment"
        );

        // Fetches all authors in the thread and returns them
        usersToBan = Array.from(postsAndComments).reduce(
          (accumulatedBans, comment) => {
            const author = comment.getAttribute("author");
            // Only ban users that aren't already banned
            if (author && !user_bans.has(author)) {
              accumulatedBans.push(author);
            }
            return accumulatedBans;
          },
          []
        );

        sendResponse({ status: 200, message: usersToBan });
      }
      banComments(new Set(usersToBan));
    }
  }
}

// Listen for nuke request
chrome.runtime.onMessage.addListener(handleNukeRequest);

// Start observing and hide existing elements
getSavedOptions();
showImages();
banComments(user_bans);
banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
observeDOMChanges();
