# VaultX — a local trading journal

A lightweight, installable trading journal. No signup, no server — every
trade lives only in your own browser (using IndexedDB), so there's nothing
to pay for and nothing to leak.

## Running it

Any static file host works, since it's plain HTML/CSS/JS:
- **Easiest**: drag the folder into a free static host (Netlify, Vercel,
  GitHub Pages, Cloudflare Pages) and share the URL with your 5 friends.
  Each person's data stays local to *their* browser/device — nothing is
  shared between you even though you're all using the same URL.
- **Local testing**: from this folder, run `python3 -m http.server 8080`
  and open `http://localhost:8080`.

⚠️ Note: it must be served over `http://` or `https://` (not opened as a
`file://` path) for IndexedDB and the install prompt to work reliably.

## Installing on a phone/desktop

Once it's hosted, open the URL and:
- **iPhone (Safari)**: Share → Add to Home Screen
- **Android (Chrome)**: menu (⋮) → Install app
- **Desktop (Chrome/Edge)**: click the install icon in the address bar

It then behaves like a native app — full screen, offline-capable, its own
icon.

## Backing up your data

Since there's no server, your trades only exist on that one device/browser.
Go to **Settings → Local Backup → Export backup** regularly, and keep the
file somewhere safe (e.g. your own cloud drive). If you switch devices or
clear your browser data, use **Import backup** to restore.

## What's in v1

Dashboard, trade log with search/filters, trade entry (with chart
screenshot, setup tag, 1–5 star grade, notes), P&L calendar, analytics
(equity curve, avg win/loss, drawdown, day-of-week & setup/instrument
breakdowns), and settings for accounts/setups/rules.


