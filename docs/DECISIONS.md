# Decisions

1. The requested `.github/copilot-instructions.md` does not exist; the workspace
   was empty. Follow the task and supplied editor instructions.
2. Use hash routes for GitHub Pages. Detail/edit views are dialogs, not new routes.
3. Fake credentials are prefilled and checked locally; the role selector assigns
   a demo user. Technician demo login is technician 1 of 4. This is not security.
4. Bookings use local shop time, same-day intervals and half-open overlap checks.
   Completed jobs still occupy their historical interval.
5. Cancellation is permitted before completion; completed orders cannot cancel.
   Booking completion has no automatic order transition, avoiding hidden effects.
6. Prices are Thai baht, inclusive of any tax; quotations show no invented VAT.
7. Persist seed dates until owner resets demo; reset advances dates to today.
   Multi-tab transactional coordination and real authentication are out of scope.
8. **Architecture deviation:** Thai quotations use browser-shaped local fonts
   rendered to 2x A4 bitmap pages, assembled with jsPDF, rather than directly
   embedding TTF glyphs. This preserves Thai combining marks consistently, but
   PDF text is not selectable/searchable. Preview and multi-page output are included.
9. Dashboard sales count paid/fulfillment/completed orders by creation date.
   Pending/cancelled orders are excluded. This is not a payment-accounting ledger.
10. Rescheduling uses a validated date/time form rather than drag-and-drop.
    Week/day views retain one column per technician; narrow screens scroll the
    calendar horizontally. Other primary lists use responsive rows on mobile.
11. ExcelJS's transitive uuid is overridden to 11.1.1 to remove its advisory.
    Thai XLSX roundtrips and browser exports pass. Export libraries are lazy
    loaded; the ~930KB ExcelJS minified chunk warning is accepted for this demo.
12. **Architecture deviation:** feature-specific styles live beside pages and
    the quotation component; `src/styles.css` retains the shared design system.
    Root App delegates shell composition to `components/BackOffice.tsx`.
13. Quotations use historical order line names/prices, a 15-day validity period,
    and an always-visible fictional-document disclaimer, even in screenshot mode.
14. Page reference dates are captured on mount for stable rendering; reload after
    midnight. Browser scheduling uses local time; verification uses Asia/Bangkok.
15. Standalone Playwright Chromium is the visual verification source because the
    editor's integrated browser did not honor requested viewport widths reliably.
    Tests assert actual innerWidth before capturing desktop/mobile screenshots.
