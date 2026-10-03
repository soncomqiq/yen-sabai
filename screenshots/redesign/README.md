# Approved Shop Redesign

The approved visual/copy redesign for Yensabai. Routes, domain types, services,
permissions, financial calculations, inventory rules and booking rules are unchanged.

Each numbered folder contains desktop/mobile Playwright captures from that page
iteration. `final/` contains the complete final portfolio set. Original
`screenshots/desktop`, `screenshots/mobile` and `screenshots/modern` sets remain.

```sh
CAPTURE_OUTPUT_DIR=screenshots/redesign/final npm run screenshots
npm run gallery
```

Open the generated gallery at http://127.0.0.1:5173/gallery/index.html while the
dev server is running. The gallery is a separate static file, not a new app route.

Recommended examples: desktop today's timeline, desktop technician time grid,
mobile agenda, customer service profile, mobile stock movement history, and the
booking error shown inside its form. Every capture is fictional demo data.