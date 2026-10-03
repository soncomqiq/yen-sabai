# Verification Report

Verified on 2026-10-03. All eight milestone commits are production-build gated.

## Automated Gates

- `npm test`: 15 passing tests across service/domain and quotation wrapping.
- `npm run test:browser`: 14 passing scenarios (7 each at 1440x1000 and 390x844).
- Production preview at `http://127.0.0.1:4173/demo/`: all 14 browser scenarios pass.
- `npm run lint`: no errors or warnings.
- `npm run build`: passes. Only the intentionally lazy ExcelJS chunk-size warning.
- `npm audit`: 0 vulnerabilities with the patched uuid override.
- Editor diagnostics and `git diff --check`: clean.

## Covered Behavior

Deterministic 40/60/150/80 seed, balanced stock ledger, March-May seasonal sales,
product validation/SKU uniqueness, receipt/issue ledger, negative-stock rejection,
order line aggregation, all-line atomicity, historical prices, permitted order
transitions, exactly-once cancellation restoration, terminal status protection,
booking creation/rescheduling overlap rejection, self exclusion, adjacent slots,
same-day interval validation, technician ownership and write permissions.

Browser flows cover fake login errors, every page, week/day calendar, mobile
navigation, searchable empty states, status/date filters, customer history tabs,
empty purchase histories, persistence after reload, loading skeletons, reset
confirmation/corrupt-storage recovery, admin financial hiding, technician direct
route guards, own-job completion, both screenshot-query positions, genuine Thai
XLSX downloads reopened with ExcelJS, PDF signature, multi-page quotation and
nonblank preview pixels. Tests assert actual viewport width, no page-level
horizontal overflow, no broken images, and no runtime errors in the route sweep.

## Visual Review

Reviewed screenshots of login, dashboard, products, orders, bookings and
customers at 1440px and 390px, plus calendar day mode, customer details, stock
history, rescheduling, role-specific views and the Thai quotation. The final
mobile product/order/customer rows expose important fields and actions without
horizontal scrolling. Calendar columns and secondary detail tables may scroll
inside their container. Thai text and local image/font assets render correctly.

Screenshots, PDFs, XLSX files and failure traces are generated into ignored
`test-results/`; rerun the browser suite to recreate them. The editor browser's
initial screenshots were not used as viewport evidence because measured widths
did not match the requested emulation dimensions.

## Remaining Manual Steps

1. Create a GitHub repository and add its remote, then push main.
2. Enable GitHub Actions and set Settings > Pages > Source to GitHub Actions.
3. Check the deployment succeeds; replace the README live-demo URL placeholder.
4. Verify the hosted app in your target desktop/mobile browsers. Chromium was
   exercised here; Safari/Firefox and an actual GitHub-hosted deployment were not.
5. Keep data fictional. Do not treat fake auth/localStorage permissions as security.

## Browser Checklist

- [ ] Login as each role; owner totals visible, admin totals hidden, technician
      only sees own jobs with no prices/sales, including direct URL attempts.
- [ ] Search/filter/sort products, add/edit validation, receive/issue stock,
      movement history and low-stock badges; attempt issue beyond availability.
- [ ] Create a multi-product order, watch stock change, advance status in order,
      cancel an open order and verify stock restored once; completed is terminal.
- [ ] Filter orders by status and inclusive dates; open timeline and quotation.
- [ ] Create/edit/reschedule bookings in week/day views; reject overlap and
      allow adjacent appointments; technician can advance only their own jobs.
- [ ] Customer contact and purchase/service histories agree with orders/jobs.
- [ ] Export filtered products/orders XLSX; open Thai PDF and multi-page output.
- [ ] Check 1440px/390px, mobile drawer, modal focus, empty/loading/toast states.
- [ ] Check banner and both `screenshot=1` URL formats; refresh preserves data.
- [ ] Owner reset requires confirmation and recreates fresh date-relative seed.

## Demo Limitations

No backend/authentication, server-side RBAC, tax documents, multi-tab locking,
real customer messaging or payment integration. Thai PDFs are image pages, not
searchable text. Seed dates persist until reset. See every decision and both
architecture deviations in DECISIONS.md.
