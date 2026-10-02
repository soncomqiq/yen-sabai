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
