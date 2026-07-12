// Handles the two website designs
const oldReddit = window.location.hostname === "old.reddit.com";

function hideAds() {
  if (!blockAds) return;
  if (oldReddit) {
    // Old reddit marks promoted posts with the "promotedlink" class
    document.querySelectorAll(".thing.promotedlink").forEach((ad) => {
      ad.style.display = "none";
    });
  } else {
    // New reddit renders feed ads as a dedicated custom element, separate from shreddit-post
    document.querySelectorAll("shreddit-ad-post").forEach((ad) => {
      ad.style.display = "none";
    });
    // Comment-thread pages render ads via a separate element pair
    document.querySelectorAll("shreddit-comment-tree-ad, shreddit-comments-page-ad").forEach((ad) => {
      ad.style.display = "none";
    });
  }
}

function banPosts(subreddits, keywords, users, domains) {
  hideAds();
  // Do not ban posts of a dedicated thread page
  if (window.location.pathname.includes("/comments/")) return;
  // Handle old reddit design
  if (oldReddit) {
    const posts = document.querySelectorAll(".thing:not(.promotedlink)");
    const allPosts = Array.from(posts);
    // Restore any hidden posts from bypassed subreddit before filtering others
    if (bypassedSubreddits.size > 0) {
      allPosts.forEach((post) => {
        if (post.getAttribute("data-subreddit") && bypassedSubreddits.has(post.getAttribute("data-subreddit").toLowerCase())) {
          post.style.display = "";
        }
      });
    }

    const visiblePosts = Array.from(posts).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visiblePosts.forEach((post) => {
      const subreddit = post.getAttribute("data-subreddit");
      const title = post.querySelectorAll(`a.title`)[0].innerHTML;
      const author = post.getAttribute("data-author");
      const domain = post.getAttribute("data-domain");
      if (subreddit && title) {
        // Always show bypassed subreddit posts, skip all other filters
        if (bypassedSubreddits.has(subreddit.toLowerCase())) {
          post.style.display = "";
          return;
        }

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
        if (blockUsers && users.has(normalizeUserName(author))) {
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
    const allPosts = Array.from(posts);
    // Restore any hidden posts from bypassed subreddit before filtering others
    if (bypassedSubreddits.size > 0) {
      allPosts.forEach((post) => {
        const sr = post.getAttribute("subreddit-prefixed-name");
        if (sr && bypassedSubreddits.has(sr.slice(2).toLowerCase())) {
          let target = post;
          if (post.parentElement && post.parentElement.tagName === "ARTICLE") {
            target = post.parentElement;
          }
          target.style.display = "";
        }
      });
    }

    const visiblePosts = Array.from(posts).filter(
      (el) => window.getComputedStyle(el).display !== "none"
    ); // Ignores hidden posts to avoid O(n^2) due to constant dom changes

    visiblePosts.forEach((post) => {
      const subreddit = post.getAttribute("subreddit-prefixed-name").slice(2); // Slices off r/ prefix from subreddit name
      const title = post.getAttribute("post-title");
      const author = post.getAttribute("author");
      const domain = post.getAttribute("domain");

      if (bypassedSubreddits.has(subreddit.toLowerCase())) return;

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
      if (blockUsers && users.has(normalizeUserName(author))) {
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
      if (author && users.has(normalizeUserName(author))) {
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
      if (author && users.has(normalizeUserName(author))) {
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
      "showBlockButtons",
      "requireBlockConfirm",
      "blockUsers",
      "blockKeywords",
      "blockSubreddits",
      "blockDomains",
      "blockAds",
    ],
    function (result) {
      if (result.hiddenUsers) {
        for (user of result.hiddenUsers) {
          const cleanedUser = normalizeUserName(user);
          if (cleanedUser) user_bans.add(cleanedUser);
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
          const cleanedSubreddit = normalizeSubredditName(subreddit);
          if (cleanedSubreddit) subreddit_bans.add(cleanedSubreddit);
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
      if (result.showBlockButtons !== undefined) {
        showBlockButtons = result.showBlockButtons;
      }
      if (result.requireBlockConfirm !== undefined) {
        requireBlockConfirm = result.requireBlockConfirm;
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
      if (result.blockAds !== undefined) {
        blockAds = result.blockAds;
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

const normalizeRedditName = (value, prefix) => {
  if (!value) return "";
  let cleaned = String(value).trim();
  if (cleaned.toLowerCase().startsWith(prefix)) {
    cleaned = cleaned.slice(prefix.length);
  }
  return cleaned.trim().toLowerCase();
};

const normalizeUserName = (value) => normalizeRedditName(value, "u/");
const normalizeSubredditName = (value) => normalizeRedditName(value, "r/");

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
let blockAds = true;
let showBlockButtons = true;
let requireBlockConfirm = true;
const bypassedSubreddits = new Set();

const hidePostWithHrs = (p) => {
  let target = p;
  if (p.parentElement && p.parentElement.tagName === "ARTICLE") {
    target = p.parentElement;
  }
  target.style.display = "none";
};

const getPostArticle = (post) => {
  if (!post) return null;
  return post.closest("article") || (post.parentElement && post.parentElement.tagName === "ARTICLE" ? post.parentElement : null);
};

const getPostSubredditName = (post) => {
  if (!post) return "";
  const subreddit = post.getAttribute("subreddit-prefixed-name") || post.getAttribute("subreddit") || "";
  return normalizeSubredditName(subreddit);
};

const getPostCreditBar = (post) => post ? post.querySelector('[slot="credit-bar"]') : null;

const getPostSubredditLink = (post) => {
  if (!post) return null;
  const creditBar = getPostCreditBar(post);
  return (
    (creditBar && creditBar.querySelector('a[data-testid="subreddit-name"], faceplate-hovercard a[href^="/r/"]')) ||
    post.querySelector('a[data-testid="subreddit-name"], faceplate-hovercard a[href^="/r/"], a[href^="/r/"]')
  );
};

const getPostTimeElement = (post) => {
  const creditBar = getPostCreditBar(post);
  return creditBar ? creditBar.querySelector('faceplate-timeago, time') : null;
};

const getBlockButtonAnchor = (post) => {
  const postTime = getPostTimeElement(post);
  if (postTime && postTime.parentElement) {
    return { parent: postTime.parentElement, before: postTime.nextSibling, mode: "inline" };
  }

  const srLink = getPostSubredditLink(post);
  if (srLink && srLink.parentElement) {
    return { parent: srLink.parentElement, before: srLink.nextSibling, mode: "inline" };
  }

  const article = getPostArticle(post);
  if (article) {
    return { parent: article, before: post, mode: "article" };
  }

  return { parent: post, before: post ? post.firstChild : null, mode: "fallback" };
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
    <button id="bypass-block-btn" style="margin-top: 16px; padding: 8px 20px; background: #d93a00; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;">View Posts</button>
  `;

  const mainContainer = main.querySelector("div.subgrid-container") || main;
  mainContainer.insertBefore(banner, mainContainer.firstChild);

  document.getElementById("bypass-block-btn").addEventListener("click", () => {
    bypassedSubreddits.add(srName);
    banner.style.display = "none";
    feed.style.display = "";
    banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
    cleanupHrs();

  // Add Unblock button at top of page
    const createUnblockBtn = () => {
      const btn = document.createElement("button");
      btn.id = "unblock-" + srName;
      btn.textContent = "Unblock r/" + srName;
      btn.style.cssText = `
        margin: 8px 0; padding: 6px 14px; background: #d93a00; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: bold;
      `;
      btn.addEventListener("click", () => {
        chrome.storage.local.get(["hiddenSubreddits"], (res) => {
          const current = res.hiddenSubreddits || [];
          const updated = current.filter(s => s.toLowerCase() !== srName);
          chrome.storage.local.set({ hiddenSubreddits: updated });
        });
        subreddit_bans.delete(srName);
        btn.remove();
        bypassedSubreddits.delete(srName);
      });
      return btn;
    };

    const placeUnblockBtn = () => {
      // Target the h1 containing the subreddit name (e.g., "r/Clamworks") on new Reddit
      const srTitleH1 = document.querySelector('h1.flex.items-center.font-bold');
      if (srTitleH1 && srTitleH1.textContent.includes(srName)) {
        const btn = createUnblockBtn();
        btn.style.marginLeft = '8px';
        btn.style.fontSize = 'inherit';
        btn.style.padding = '2px 8px';
        srTitleH1.appendChild(btn);
        return true;
      }

      // Fallback: first article in feed
      const firstArticle = document.querySelector('shreddit-feed article:first-of-type');
      if (firstArticle) {
        const btn = createUnblockBtn();
        firstArticle.insertBefore(btn, firstArticle.firstChild);
        return true;
      }
      return false;
    };

    if (!placeUnblockBtn()) {
      setTimeout(() => {
        if (!placeUnblockBtn()) {
          const btn = createUnblockBtn();
          btn.style.display = "block";
          btn.style.margin = "10px auto";
          feed.insertBefore(btn, feed.firstChild);
        }
      }, 800);
    }
  });
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
        pointer-events: auto !important;
      }
      .reddit-filters-block-wrapper--article {
        position: absolute !important;
        top: 8px !important;
        left: 8px !important;
        margin-left: 0 !important;
      }
      .reddit-filters-block-btn {
        background: #d93a00 !important;
        color: white !important;
        border: none !important;
        border-radius: 50% !important;
        padding: 0px 4px !important;
        font-size: 11px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        line-height: 1.2 !important;
        min-height: 16px !important;
        pointer-events: auto !important;
        touch-action: manipulation !important;
        height: 1em !important;
      }
      .reddit-filters-block-btn:hover,
      .reddit-filters-block-btn:focus-visible {
        background: #ff5c1a !important;
        box-shadow: 0 0 0 2px rgba(255, 92, 26, 0.35) !important;
        transform: scale(1.08) !important;
      }
      .reddit-filters-confirm-popover {
        position: absolute !important;
        z-index: 2147483647 !important;
        background: #1a1a1b !important;
        color: white !important;
        border: 1px solid #555 !important;
        border-radius: 6px !important;
        padding: 8px !important;
        font-size: 12px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        min-width: 220px !important;
      }
      .reddit-filters-confirm-actions {
        display: flex !important;
        gap: 6px !important;
        justify-content: flex-end !important;
        margin-top: 8px !important;
      }
      .reddit-filters-confirm-actions button {
        border: none !important;
        border-radius: 4px !important;
        padding: 3px 8px !important;
        cursor: pointer !important;
        font-size: 12px !important;
      }
      .reddit-filters-confirm-yes {
        background: #d93a00 !important;
        color: white !important;
      }
      .reddit-filters-confirm-yes:hover,
      .reddit-filters-confirm-yes:focus-visible {
        background: #ff5c1a !important;
        box-shadow: 0 0 0 2px rgba(255, 92, 26, 0.35) !important;
      }
      .reddit-filters-confirm-no {
        background: #555 !important;
        color: white !important;
      }
      .reddit-filters-confirm-no:hover,
      .reddit-filters-confirm-no:focus-visible {
        background: #777 !important;
        box-shadow: 0 0 0 2px rgba(180, 180, 180, 0.35) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  const posts = document.querySelectorAll("shreddit-post");
  posts.forEach((post) => {
    if (post.dataset.blockBtnAdded) return;
    const subredditName = getPostSubredditName(post);
    if (!subredditName) return;
    
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.className = "reddit-filters-block-btn";
    btn.title = `Block r/${subredditName}`;
     
    const wrapper = document.createElement("span");
    wrapper.className = "reddit-filters-block-wrapper";
    wrapper.appendChild(btn);

    const anchor = getBlockButtonAnchor(post);
    if (!anchor.parent) return;
    if (anchor.mode === "article") {
      const article = anchor.parent;
      if (window.getComputedStyle(article).position === "static") {
        article.style.position = "relative";
      }
      wrapper.classList.add("reddit-filters-block-wrapper--article");
    }
    anchor.parent.insertBefore(wrapper, anchor.before);

     const swallowRedditPostClick = (e) => {
       e.preventDefault();
       e.stopPropagation();
       e.stopImmediatePropagation();
     };

     const blockSubreddit = () => {
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

     const showBlockConfirmation = () => {
       document.querySelectorAll(".reddit-filters-confirm-popover").forEach((el) => el.remove());

       const popover = document.createElement("div");
       popover.className = "reddit-filters-confirm-popover";
       popover.innerHTML = `
         <div>Are you sure you want to block r/${subredditName}?</div>
         <div class="reddit-filters-confirm-actions">
           <button type="button" class="reddit-filters-confirm-no">No</button>
           <button type="button" class="reddit-filters-confirm-yes">Yes</button>
         </div>
       `;

       wrapper.appendChild(popover);

       const keepConfirmationClickLocal = (confirmEvent) => {
         confirmEvent.preventDefault();
         confirmEvent.stopPropagation();
       };

       popover.addEventListener("pointerdown", keepConfirmationClickLocal, true);
       popover.addEventListener("mousedown", keepConfirmationClickLocal, true);
       popover.addEventListener("click", keepConfirmationClickLocal);

       popover.querySelector(".reddit-filters-confirm-yes").addEventListener("click", (confirmEvent) => {
         swallowRedditPostClick(confirmEvent);
         popover.remove();
         blockSubreddit();
       });

       popover.querySelector(".reddit-filters-confirm-no").addEventListener("click", (confirmEvent) => {
         swallowRedditPostClick(confirmEvent);
         popover.remove();
       });
      };

     const blockSubredditFromButton = (e) => {
       swallowRedditPostClick(e);
       if (requireBlockConfirm) {
         showBlockConfirmation();
         return;
       }
       blockSubreddit();
      };

     ["pointerdown", "mousedown", "mouseup", "click", "auxclick", "dblclick"].forEach((eventName) => {
       btn.addEventListener(eventName, (e) => {
         if (eventName === "click") {
           blockSubredditFromButton(e);
         } else {
           swallowRedditPostClick(e);
         }
       }, true);
     });

     btn.addEventListener("keydown", (e) => {
       if (e.key === "Enter" || e.key === " ") {
         blockSubredditFromButton(e);
       }
     }, true);
     
    post.dataset.blockBtnAdded = "true";
  });
}
function observeDOMChanges() {
  var observer = new MutationObserver(function (mutations) {
    if (mutations.some((mutation) => mutation.addedNodes.length)) {
     getSavedOptions(() => {
          banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
          banComments(user_bans);
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
            if (author && !user_bans.has(normalizeUserName(author))) {
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
            if (author && !user_bans.has(normalizeUserName(author))) {
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
  if (message.action === "nukePage") {
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
  if (area === 'local' && changes.requireBlockConfirm) {
    requireBlockConfirm = changes.requireBlockConfirm.newValue;
  }
});

// Start observing and hide existing elements
getSavedOptions(() => {
  addBlockButtons();
  banComments(user_bans);
  banPosts(subreddit_bans, keyword_bans, user_bans, domain_bans);
  cleanupHrs();
  showBlockedSubredditBanner(subreddit_bans);
});

observeDOMChanges();
