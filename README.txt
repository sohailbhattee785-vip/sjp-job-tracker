# SJP Job Tracker

A mobile-friendly PWA dashboard for Sindh Job Portal applications.

## Files
- `index.html` — app shell
- `app.js` — SJP API dashboard
- `style.css` — colourful mobile UI
- `manifest.webmanifest` — installable app configuration
- `sw.js` — offline app-shell cache
- `icon.svg` — app icon

## Important
The dashboard requests the SJP candidate API using your logged-in browser session. The SJP server must allow the mini-app's web origin to make that request (CORS/credentials). If the request is blocked by the browser, the original SJP bookmarklet is the reliable method because it runs on the SJP page itself.

## Install on Android Firefox
1. Host these files on an HTTPS website.
2. Open the website in Firefox Android.
3. Use Firefox's menu and add the website to your home screen/shortcuts.
4. Open the SJP Job Tracker icon whenever you want to check.

Do not put your SJP username, password, cookies, or tokens into these files.
