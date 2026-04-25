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
          incrementStat("subreddits", subreddit);
          post.style.display = "none";
          return;
        }

        // Ban keywords
        if (blockKeywords) {
          for (let banWord of keywords) {
            if (matchesKeyword(title, banWord)) {
              if (loggingEnabled)
                console.log(
                  `Hiding post based on keyword: ${banWord}: ${title}`
                );
              incrementStat("keywords", banWord);
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

      const hideEl = (el) => {
        let target = el;
        if (el.parentElement && el.parentElement.tagName === "ARTICLE") {
          target = el.parentElement;
        }
        target.style.display = "none";
      };

      // Ban subreddits
      if (blockSubreddits && subreddits.has(subreddit.toLowerCase())) {
        if (loggingEnabled)
          console.log(`Hiding post based on subreddit: ${subreddit}: ${title}`);
        incrementStat("subreddits", subreddit);
        hideEl(post);
        return;
      }

      // Ban keywords
      if (blockKeywords) {
        for (let banWord of keywords) {
          if (matchesKeyword(title, banWord)) {
            if (loggingEnabled)
              console.log(`Hiding post based on keyword: ${banWord}: ${title}`);
            incrementStat("keywords", banWord);
            hideEl(post);
            return;
          }
        }
      }

      // Ban users
      if (blockUsers && users.has(author)) {
        if (loggingEnabled)
          console.log(`Hiding post based on user: ${author}: ${title}`);
        hideEl(post);
        return;
      }

      // Ban domains
      if (blockDomains && domains.has(domain.toLowerCase())) {
        if (loggingEnabled)
          console.log(`Hiding post based on domain: ${domain}: ${title}`);
        hideEl(post);
        return;
      }
    });
  }

  // Cleanup: hide any HR separators adjacent to hidden articles
  cleanupHrs();
}

function cleanupHrs() {
  if (oldReddit) return;
  const feed = document.querySelector("shreddit-feed");
  if (!feed) return;
  Array.from(feed.children).forEach((child) => {
    if (child.tagName !== "HR") return;
    // Find the nearest non-HR siblings
    let prev = child.previousElementSibling;
    while (prev && prev.tagName === "HR") prev = prev.previousElementSibling;
    let next = child.nextElementSibling;
    while (next && next.tagName === "HR") next = next.nextElementSibling;
    // Only hide if both adjacent content elements are hidden, or one side is missing
    const prevHidden = !prev || window.getComputedStyle(prev).display === "none";
    const nextHidden = !next || window.getComputedStyle(next).display === "none";
    if (prevHidden && nextHidden) {
      child.style.display = "none";
    } else {
      child.style.display = "";
    }
  });

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

function getSavedOptions(callback) {
  chrome.storage.local.get(
    [
      "hiddenUsers",
      "hiddenKeywords",
      "hiddenSubreddits",
      "hiddenDomains",
      "loggingEnabled",
      "expandImages",
      "showBlockButtons",
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
      if (result.showBlockButtons !== undefined) {
        showBlockButtons = result.showBlockButtons;
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
      if (callback) callback();
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
const matchesKeyword = (text, keyword) => {
  if (/[a-zA-Z]/.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
  }
  return text.includes(keyword);
};

const incrementStat = (type, key) => {
  chrome.storage.local.get(["statsData"], (res) => {
    let stats = res.statsData || { keywords: {}, subreddits: {} };
    if (!stats[type]) stats[type] = {};
    const normalized = key.toLowerCase();
    stats[type][normalized] = (stats[type][normalized] || 0) + 1;
    chrome.storage.local.set({ statsData: stats });
  });
};

let blockUsers = false;
let blockKeywords = false;
let blockSubreddits = false;
let blockDomains = false;
let showBlockButtons = true;

const hidePostWithHrs = (p) => {
  let target = p;
  if (p.parentElement && p.parentElement.tagName === "ARTICLE") {
    target = p.parentElement;
  }
  target.style.display = "none";
};

const showBlockedSubredditBanner = (blockedSet) => {
  if (oldReddit) return;
  const path = window.location.pathname;
  const srMatch = path.match(/^\/r\/([^/]+)/);
  if (!srMatch) return;
  const srName = srMatch[1].toLowerCase();
  const exclusions = ["home", "all", "popular", "new"];
  if (exclusions.includes(srName)) return;
  if (!blockedSet.has(srName)) return;

  // Prevent duplicate banners
  if (document.getElementById("blocked-sr-banner")) return;

  const feed = document.querySelector("shreddit-feed");
  if (!feed) return;

  // Hide the feed
  feed.style.display = "none";

  // Find the main content area to insert the banner
  const main = document.querySelector("main.main") || document.querySelector("shreddit-app");
  if (!main) return;

  const banner = document.createElement("div");
  banner.id = "blocked-sr-banner";
  banner.style.cssText = `
    text-align: center;
    padding: 40px 20px;
    color: #ccc;
    font-size: 16px;
  `;
  banner.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 8px;">🚫</div>
    <div><strong>r/${srName}</strong> is currently blocked.</div>
    <div style="font-size: 13px; margin-top: 6px; color: #888;">Unblock it in the Advanced Reddit Filter's settings to see posts.</div>
  `;

  const mainContainer = main.querySelector("div.subgrid-container") || main;
  mainContainer.insertBefore(banner, mainContainer.firstChild);
};

function addBlockButtons() {
  if (oldReddit) return;

  // Only show on home feed, r/all, r/popular, r/new — not individual subreddits
  const path = window.location.pathname;
  const srMatch = path.match(/^\/r\/([^/]+)/);
  if (srMatch && srMatch[1] !== "home" && srMatch[1] !== "all" && srMatch[1] !== "popular" && srMatch[1] !== "new") return;

  if (!showBlockButtons) {
    document.querySelectorAll('.reddit-filters-block-wrapper, .reddit-filters-block-btn').forEach(el => el.remove());
    document.querySelectorAll("shreddit-post").forEach(post => delete post.dataset.blockBtnAdded);
    return;
  }
  
  if (!document.getElementById("block-btn-style")) {
    const style = document.createElement("style");
    style.id = "block-btn-style";
    style.textContent = `
      .reddit-filters-block-wrapper {
        display: inline-flex !important;
        align-items: center !important;
        margin-left: 6px !important;
      }
      .reddit-filters-block-btn {
        background: #d93a00 !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 0px 4px !important;
        font-size: 11px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        line-height: 1.2 !important;
        min-height: 16px !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  const posts = document.querySelectorAll("shreddit-post");
  posts.forEach((post) => {
    if (post.dataset.blockBtnAdded) return;
    const subreddit = post.getAttribute("subreddit-prefixed-name");
    if (!subreddit) return;
    const subredditName = subreddit.slice(2);
    
    const faceplate = post.querySelector("faceplate-hovercard");
    const srLink = faceplate ? faceplate.querySelector('a[href^="/r/"]') : null;
    
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.className = "reddit-filters-block-btn";
    btn.title = `Block r/${subredditName}`;
    
    if (srLink && srLink.parentElement) {
      const wrapper = document.createElement("span");
      wrapper.className = "reddit-filters-block-wrapper";
      wrapper.appendChild(btn);
      srLink.parentElement.insertBefore(wrapper, srLink.nextSibling);
    } else {
       post.insertBefore(btn, post.firstChild);
     }

     btn.onclick = (e) => {
       e.preventDefault();
       e.stopPropagation();
       chrome.storage.local.get(["hiddenSubreddits"], (res) => {
         const current = new Set();
         if (res.hiddenSubreddits) {
           res.hiddenSubreddits.forEach((sr) => current.add(sr.toLowerCase()));
         }
         current.add(subredditName.toLowerCase());
         chrome.storage.local.set({ hiddenSubreddits: Array.from(current) });
       });
       hidePostWithHrs(post);
        cleanupHrs();
     };
    
    post.dataset.blockBtnAdded = "true";
  });
}
function observeDOMChanges() {
  var observer = new MutationObserver(function (mutations) {
    if (mutations.some((mutation) => mutation.addedNodes.length)) {
     getSavedOptions(() => {
          banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
          banComments(user_bans);
          showImages();
          addBlockButtons();
          cleanupHrs();
          showBlockedSubredditBanner(subreddit_bans);
        });
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

// Listen for nuke request and block button toggle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "nuke") {
    handleNukeRequest(message, sender, sendResponse);
  } else if (message.action === "toggleBlockButtons") {
    showBlockButtons = message.value;
    addBlockButtons();
    sendResponse({ status: 200 });
  }
});

// Listen for storage changes to update block button visibility
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.showBlockButtons) {
    showBlockButtons = changes.showBlockButtons.newValue;
    addBlockButtons();
  }
});

// Start observing and hide existing elements
getSavedOptions(() => {
  showImages();
  addBlockButtons();
  banComments(user_bans);
  banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
  cleanupHrs();
  showBlockedSubredditBanner(subreddit_bans);
});

observeDOMChanges();
