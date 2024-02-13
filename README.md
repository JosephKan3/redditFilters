# Advanced Reddit Filters

Advanced Reddit Filters is a Chrome extension that enhances your browsing experience on Reddit by allowing you to block specific keywords and subreddits. With an additional feature to automatically display images linked in comments and posts, Reddit Filters makes your Reddit experience more customizable and visually engaging.

## Features

- **User Blocking:** Hide posts and comments from specific users.
- **Keyword Blocking:** Hide posts containing specific keywords you choose.
- **Subreddit Blocking:** Hide posts from specific subreddits.
- **Thread Nuke:** Automatically bans all users that posted or commented on the current thread being viewed
- **Automatic Image Display:** Automatically display images linked in comments and posts for easier viewing.
- **Logging Preference:** Option to enable or disable console logging for debugging or personal preference.

## Installation

1. Download the `RedditFilters.zip` file and unzip it on your computer.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" at the top right corner of the page.
4. Click on "Load unpacked" and select the unzipped folder of Reddit Filters.
5. The extension should now appear in your list of extensions and is ready to use.

## How to Use

After installation, click on the Reddit Filters icon in your Chrome toolbar to open the popup interface. Here, you can:

- Press The Nuke button only if you wish to ban every single user _visible_ on a given thread. This is an unfortunate limitation due to the new Reddit API rate limits. Works much better on old reddit since it loads more users on screen. The Nuke will only work if a thread is open on screen.
- Enter users you wish to block, one per line, without the "u/" prefix, in the "Blocked Users" textarea.
- Enter keywords you wish to block, one per line, in the "Blocked Keywords" textarea.
- Enter subreddits you wish to block, one per line, without the "r/" prefix, in the "Blocked Subreddits" textarea.
- Check or uncheck the "Print Logs?" option according to your preference.

Your settings will automatically save and apply to your current and future Reddit browsing sessions.

## Content Script

The content script of Reddit Filters runs automatically on Reddit pages. It listens for changes in the DOM to apply the filters dynamically as new content loads, ensuring that your browsing experience is uninterrupted by unwanted posts or spoilers.

## Permissions

Reddit Filters requires the following permissions:

- `storage`: To save your preferences locally on your device.
- `activeTab`: To apply filters and enhancements to the Reddit pages you visit.

## Privacy

Your preferences are stored locally on your device and are not shared or transmitted. Reddit Filters operates entirely client-side, ensuring your browsing data and preferences remain private.

## Contributing

If you have suggestions for improving Reddit Filters or have found a bug, please open an issue on our GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
