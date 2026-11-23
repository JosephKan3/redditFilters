# Advanced Reddit Filters

Advanced Reddit Filters is a Chrome extension that enhances your browsing experience on Reddit by allowing you to block specific users, keywords, subreddits, and websites.

If you find this extension useful, consider [sponsoring the project](https://github.com/sponsors/JosephKan3?frequency=one-time&sponsor=JosephKan3).

## Features

- **User Blocking:** Hide posts and comments from specific users.
- **Keyword Blocking:** Hide posts containing specific keywords you choose.
- **Subreddit Blocking:** Hide posts from specific subreddits.
- **Domain Blocking:** Hide posts from specific news domains.
- **Thread Nuke:** Automatically bans all users that posted or commented on the current thread being viewed
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
- Enter domains you wish to block, one per line, in the "Blocked Domains" textarea.
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

## Firefox (desktop)

This fork supports **Firefox 140+** as well as Chromium browsers. It retains the
original upstream filtering logic and uses the same `chrome.*` WebExtension API,
which Firefox supports for callback-style code. The Firefox manifest declares a
stable add-on ID and no collection/transmission of user data.

### Try the Firefox build

1. Open the **Actions** tab in this fork and choose **Firefox extension package**.
2. Open the latest successful run, then download the **Firefox-unsigned-extension** artifact.
3. Extract the downloaded Actions artifact, then extract the extension ZIP inside.
4. In Firefox, open `about:debugging#/runtime/this-firefox` and choose
   **Load Temporary Add-on**. Select `manifest.json` in the extracted extension directory.
5. Open a Reddit tab and use the toolbar popup to configure filters.
6. For **Import**, click the toolbar Import button. A persistent extension tab
   opens. Choose the exported `.jsonl` file, review the counts, then click
   **Import and replace lists**. The tab reports storage read-back verification.

Temporary add-ons are removed when Firefox restarts. **Permanent installation
in regular Firefox requires Mozilla signing** (AMO distribution or signed
self-distribution). The Actions artifact is an **unsigned development build**, not a
signed installable XPI. No Mozilla signing credentials are stored in this repo.

### Build and validate locally

From the repository root, use the packaging workflow in
`.github/workflows/firefox-package.yml` as the reference. It copies only runtime
files and referenced assets into a staging directory, checks JavaScript syntax,
runs Mozilla `web-ext lint`, and builds the unsigned Firefox ZIP.

The root `manifest.json` is deliberately dual-browser: Chrome ignores
`browser_specific_settings`. The Firefox port does not introduce a forked copy
of the upstream filtering implementation.

### Why Import uses its own tab

Firefox closes an extension toolbar popup when a native file-selection dialog
steals focus (Mozilla Bug 1658694). The import operation cannot safely run in
that disposable popup: the input change handler may never run. Import now opens
`import.html` in a persistent extension tab; its file reader and storage
verification remain alive after the file picker closes. This is deliberately
separate from the popup's normal editing and exporting behavior.
