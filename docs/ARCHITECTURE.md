# Yensabai Back Office Architecture

## Scope and Structure

A client-only, fictional Thai air-conditioning shop demo. React + TypeScript + Vite.

```
src/
  domain/          Entities, permissions, transitions, pure business rules
  services/        Interfaces, factory, seeded mock, persistence
  components/     Shell, dialogs, shared presentation
  pages/          Login, dashboard, products, orders, bookings, customers
  lib/            Formatting, Excel and Thai PDF exports
  App.tsx         Hash routes and authenticated composition
  styles.css      Responsive light design system
tests/            Domain/service behavior tests
public/           Local font and product illustration assets
docs/             Architecture and decision log
```

## Routes

Hash routing keeps GitHub Pages deep links working: `#/login`, `#/dashboard`,
`#/products`, `#/orders`, `#/bookings`, `#/customers`. Details and edit dialogs
stay inside their owning page. Unknown routes return to the permitted home.
Technicians land on bookings; owner/admin land on dashboard.
The demo banner is hidden by `screenshot=1` in the query before or after the hash.

## Domain

- User: id, name, role (owner/admin/technician), optional technicianId.
- Product: id, sku, name, category (aircon/parts), unit, price, stock, minimumStock.
- Customer: id, name, phone, address.
- Order: id, customerId, createdAt, status, items (productId, quantity, historical
  name and unitPrice), timeline. Total is derived from historical line prices.
- StockMovement: id, productId, delta, reason, createdAt, related orderId.
- Technician: id, name, phone, color.
- Booking: id, customerId, technicianId, optional orderId, type
  (installation/cleaning/repair), start, end, status, notes.
- State: schemaVersion, products, customers, orders, movements, technicians, bookings.

## Service Boundary

`ShopService` exposes async snapshot, saveProduct, moveStock, createOrder,
transitionOrder, saveBooking, transitionBooking, and reset. Every call carries
the current user. Read models redact sales/prices for technicians and restrict
their bookings; write permissions are checked again inside the service.
`createShopService()` selects the mock implementation. Components never access
localStorage or mutate state directly. Login is explicitly fake, not security.

Mock persistence uses a versioned localStorage key. A fixed PRNG seed produces
40 products, 60 customers, 150 orders, and 80 bookings, with dates relative to
initialization day. March-May receives higher monthly sales. First read seeds;
subsequent reads use persisted state. Reset recreates data relative to today.
Calls simulate 180ms latency. Writes reload the current state, validate the full
operation, then persist atomically in one synchronous commit. Browser tabs are
not a substitute for a transactional database; this is a single-browser demo.

### Spring Boot Replacement

Implement the same interface in `RestShopService`, selected by the factory.
Suggested endpoints: GET /api/snapshot; POST/PUT /api/products; POST
/api/products/{id}/movements; POST /api/orders; POST /api/orders/{id}/status;
POST/PUT /api/bookings; POST /api/bookings/{id}/status. Map DTOs into the domain
types; map 400/409 responses to user-facing rule errors. The backend must enforce
RBAC, validate transitions, and use DB transactions with product row locks and
technician scheduling locks. Use authenticated sessions/tokens, never trust a
client role. PDF and Excel consume authorized read models only.

## Business Rules

- Orders: pending -> paid -> fulfillment -> completed; pending/paid/fulfillment
  may cancel, completed/cancelled are terminal. No skipping or reversing states.
- Creating an order validates positive quantities and available stock for every
  line, merges duplicate product lines, deducts stock once, records movements.
- Cancelling restores each line once and records movements; invalid operations
  leave the complete state unchanged. Stock and minimumStock are nonnegative
  integers, prices are nonnegative, manual stock-out cannot exceed availability.
- Booking times must end after start on the same day. Technician intervals are
  half-open: adjacent appointments are allowed, overlaps are rejected. Creation
  and rescheduling share the same validation and exclude the edited job itself.
- Booking status: scheduled -> working -> done. Technicians may advance only
  their own jobs; only owner/admin create, edit, or reschedule appointments.
- Destructive actions require confirmation. Rule failures display Thai messages.

## Permission Matrix

| Page / Action | Owner | Admin | Technician |
| --- | --- | --- | --- |
| Dashboard operations | Yes | Yes | No |
| Dashboard sales totals/chart/revenue ranking | Yes | No | No |
| Products list/prices/edit/stock/export | Yes | Yes | No |
| Orders list/create/status/prices/export/PDF | Yes | Yes | No |
| Bookings list | All | All | Own only |
| Booking create/edit/reschedule | Yes | Yes | No |
| Booking advance status | All | All | Own only |
| Customers list/detail/history | Yes | Yes | No |
| Reset demo | Yes | No | No |

## Libraries and UX

- React/TypeScript/Vite: typed client UI and static deployment.
- React Router hash router: Pages-compatible navigation and route guards.
- Lucide React: consistent accessible tool icons.
- date-fns: local calendar/date arithmetic.
- ExcelJS: genuine XLSX export without CSV masquerading as Excel.
- jsPDF with embedded Thai font: portable quotation with Thai glyphs.
- Vitest: focused pure-domain and service contract tests.
- CSS: quiet emerald accent, Thai-readable local font, semantic status colors,
  responsive sidebar/mobile nav, skeletons, empty states, toasts, dialogs.

## Verification Gates

Every milestone must pass `npm run build` before its named git commit. Focused
tests cover stock atomicity/cancellation, invalid transitions, permissions,
overlap/rescheduling, deterministic seed counts, and screenshot query parsing.
Final browser review visits every page at 1440px and 390px, checks overflow,
login/roles, forms, exports, banner modes, persistence, and calendar interactions.