# Modern Theme Portfolio

Updated theme captures: dark emerald navigation, neutral light workspace,
higher-contrast typography, clearer status badges and refreshed login branding.
Original portfolio images remain unchanged in the parent screenshots folder.

- `desktop/`: 26 viewport images at 2880x2000.
- `mobile/`: 27 viewport images at 780x1688.
- `full-page/`: 18 full-page images across both viewports.
- `documents/`: 2 A4 quotation images.
- `manifest.json`: generated image inventory.

All data is fictional. Screenshots use screenshot mode and stop UI animations
for clean captures. Customer data in existing browser sessions is not modified.

To regenerate this set with the dev server running:

```sh
CAPTURE_OUTPUT_DIR=screenshots/modern node scripts/capture-portfolio.mjs
```