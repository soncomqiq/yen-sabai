# Portfolio Screenshots

Playwright captures of the fictional Yensabai back-office demo, prepared for
freelance portfolio examples. These show demo data, not a real client system.

## Folders

- `desktop/`: 1440x1000 viewport screenshots at 2x resolution (2880x2000 PNG).
- `mobile/`: 390x844 viewport screenshots at 2x resolution (780x1688 PNG).
- `full-page/desktop/` and `full-page/mobile/`: complete scrollable main pages.
- `documents/`: clean A4 Thai quotation images (1588x2246 PNG).
- `manifest.json`: generated inventory with each file's feature description.

Use the viewport images for portfolio galleries; full-page images are suitable
for detailed examples. The demo banner is hidden using the application's
`screenshot=1` mode. Quotations retain their fictional-document disclaimer.

The numbered images cover login, owner dashboard, products, low stock, product
forms, stock receipt/issue/history, orders/filters/timeline/cancellation,
quotation preview, order creation, week/day calendars, job detail/rescheduling,
booking creation/conflict protection, customers and both histories, admin and
technician permissions, and mobile navigation.

## Recapture

Start `npm run dev`, then run in a second terminal:

```sh
node scripts/capture-portfolio.mjs
```

Optional: `CAPTURE_BASE_URL=https://your-demo-url/ node scripts/capture-portfolio.mjs`.
Each run uses fresh isolated browser contexts and deterministic demo seeds with
dates relative to that day. Existing browser sessions/data are not changed.
Files with matching names are replaced. Browser viewport, font/image readiness,
hidden banner, overflow and runtime-error checks run during capture.