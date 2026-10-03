# Shop Redesign Verification

Visual/copy scope approved for the existing Yensabai shop on 2026-10-03.

## Preserved Contracts

Compared with milestone 7 (`f3f565a`), `src/domain/` and `src/services/` have no
changes. Hash routes, roles, mock persistence, stock deduction/restoration,
order transitions, job conflict validation, PDF totals and XLSX values remain.
Only UI composition/copy, UI-only feedback state, styling and capture/test
tooling changed. No clinic data, courses or new app routes were added.

## Page Iterations

1. Shared token source and shop shell.
2. Timeline-first dashboard and secondary owner report.
3. Selected-day appointment book, mobile agenda and in-dialog errors.
4. Customer contact/context/history and reused booking dialog.
5. Order summaries, named actions and readable mobile line items/timeline.
6. Stock receive/issue commands and signed mobile movement history.
7. Compact login with unchanged fake auth and roles.

Each iteration ran production build and `npm run screenshots` at 1440px/390px;
local visual defects were repaired before moving on. Commits are build gated.

## Verification Gates

- `npm test`: service/domain behavior and Thai quotation wrapping.
- `npm run test:browser`: desktop/mobile workflows plus the new design suite.
- The design suite runs axe WCAG 2 A/AA, 2.1 AA and 2.2 AA on login, dashboard,
  report, calendar, customer profile, orders/products and active detail forms.
- Keyboard: visible focus, native dialog tab/escape, drawer escape/focus restore.
- Reduced-motion: stable page content and disabled nonessential transitions.
- Layout: jobs first, no KPI tiles, mobile agenda default, four technician grid
  columns and seven-day navigation. Existing viewport/overflow/image checks remain.
- `npm run lint`, `npm run build`, editor diagnostics and `git diff --check`.
- `npm run gallery`: all 80 final PNG paths verified before HTML generation.

Final assets: `screenshots/redesign/final/`. Gallery: `gallery/index.html`.
Original screenshot sets remain, and intermediate captures are not removed.

## Limits

Automated accessibility checks cover tested views/states, not universal
certification. Manual screen-reader, Safari/Firefox, 200% browser zoom and real
device testing are still appropriate before a production launch. The demo is
still fictional local data with fake authentication; no real security is implied.
The pre-existing lazy ExcelJS chunk-size build warning remains accepted.
