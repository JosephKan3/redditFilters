// function hideLoginRequiredElements() {
//   var elements = document.querySelectorAll('.login-required');
//   elements.forEach(function(el) {
//       el.style.display = 'none';
//   });

//   var usernameElements = document.querySelectorAll('.author');
//   usernameElements.forEach(function(el) {
//       el.style.display = 'none';
//   });
// }




function showImages() {
    const links = document.querySelectorAll('a');

    links.forEach(link => {
        const href = link.href;

        // Check if the href points to an image (basic check)
        if (link.textContent.trim() === '<image>') {
            const img = document.createElement('img');
            img.src = href;
            img.style.maxWidth = '100%'; // Optional: to ensure large images don't overflow

            // Replace the link with the image
            link.parentNode.replaceChild(img, link);
        }
    });
}

function banPosts(bans, keywords) {
  const posts = document.querySelectorAll('.thing:not(.promotedlink)');

  posts.forEach(post => {
      const subreddit = post.getAttribute('data-subreddit');
      const title = post.querySelectorAll(`a.title`)[0].innerHTML
        if (subreddit && title) {
        // Ban subreddits
        if (bans.includes(subreddit)) {
            console.log(`Hiding post based on subreddit: ${subreddit}: ${title}`)
            post.style.display = "none"
            return;
        }

        // Ban keywords
        lowerTitle = title.toLowerCase();
        for (let banWord of keywords) {
          if (lowerTitle.includes(banWord)) {
            console.log(`Hiding post based on keyword: ${banWord}: ${title}`)
            post.style.display = "none";
            return;
          }
        }
      }
  });
}

// Run the function when the DOM is fully loaded
function observeDOMChanges() {
  var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
              hideLoginRequiredElements();
              showImages();
          }
      });
  });

  var config = { childList: true, subtree: true };

  observer.observe(document.body, config);
}

const SUBREDDIT_BANS = ["Canada_sub", "antiwork", "Fauxmoi", "nhl", "movies", "comics", "BaldursGate3", "torontoraptors", "Tinder", "hockey", "nba", "wallstreetbets", "Superstonk"].map((subreddit) => {return subreddit.toLowerCase()});
const KEYWORD_BANS = ["Shapiro", "Ford", "Conservative", "Republican", "Marjorie", "DeSantis", "Trump", "Elon", "Musk", "Biden", "Trudeau", "Poilievre", "Kanye", "Destiny", "Peterson", "Israel", "Palestine"].map((keyword) => {return keyword.toLowerCase()});



// Start observing and hide existing elements
// hideLoginRequiredElements();
showImages();
banPosts(SUBREDDIT_BANS, KEYWORD_BANS);
observeDOMChanges();




