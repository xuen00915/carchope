# Carchope page guide

This repository is a static frontend preview. The production-facing preview consists of four main HTML pages at the repository root.

## Main pages

| Page | Preview route | Purpose |
| --- | --- | --- |
| `index.html` | `/` | Homepage and primary introduction to Carchope. |
| `products.html` | `/products.html` | Pre-owned vehicle inventory, filtering, sorting, and quick-view experience. |
| `service.html` | `/service.html` | Ownership services, including insurance, financing, rental, and related support. |
| `about-us.html` | `/about-us.html` | Company story, positioning, and customer-facing background. |

These are the pages collaborators should treat as the main website. Keep their navigation, header, footer, and shared behaviors consistent.

## Shared files

The four main pages share two root-level files:

- `styles.css` contains the shared visual system and page styles used by all four main pages.
- `app.js` contains shared navigation, cart, inventory, marquee, reveal, and general interaction behavior.
- Changes to either shared file can affect every main page, so verify all four pages after editing them.

## Standalone Road Experience

The `road-experience/` folder contains the Road Experience files:

- `road-experience/index.html`
- `road-experience/road-experience.css`
- `road-experience/road-experience.js`

Its preview route is `/road-experience/`.

This is an experimental standalone experience and is intentionally **excluded from the main-page list**. Do not treat it as a replacement homepage or add it to the primary navigation unless that becomes an explicit product decision. It uses the root-level `styles.css` and `app.js`, while its page-specific WebGL, video, and Featured Cars behavior remains isolated inside its own folder.

## Working safely

Follow these rules when you edit the preview:

1. Make page-specific changes in the relevant HTML file whenever possible.
2. Use `styles.css` and `app.js` only for behavior or presentation shared by the main pages.
3. Keep Road Experience-only work inside `road-experience/`.
4. Test desktop and mobile layouts after changing shared files.
5. Check relative links and assets through a local web server rather than opening HTML files directly.

[Open the GitHub Pages preview](https://xuen00915.github.io/carchope/).
