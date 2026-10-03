# Design Review and Proposed Direction

**Status: approved for the existing Yensabai shop on 2026-10-03.**

Use the existing CSS stack, technician/job terminology and all existing routes.
No clinic entities, courses, Tailwind/shadcn migration or business-rule changes.

Audit date: 2026-10-03. Goal: make the next booking, current work and relevant
customer context easy to find during a busy day; make evening reporting easy
without turning the working screen into a sales dashboard template.

## 1. Scope Check Before Designing

Read `docs/ARCHITECTURE.md` first. The requested `.github/copilot-instructions.md`
does not exist, so there is no additional repository commit policy to follow.

This workspace is **ร้านเย็นสบาย แอร์แอนด์เซอร์วิส**, a fictional air-conditioning
shop, not a clinic. Its booking entity has customer, technician, job type,
start/end, status and notes. There are no rooms, practitioners, clinical
treatments, arrivals, courses or course balances. Customer history means orders
and installation/cleaning/repair jobs, not medical records.

There is no Tailwind or shadcn dependency. The app uses React, local Thai fonts,
Lucide and handwritten CSS. The templated appearance is real, but attributing
it to a stock shadcn theme would be inaccurate.

### Approval Boundaries

- Keep all six hash routes, all domain types, services, transitions, permissions,
  financial calculations, persistence and seed data unchanged.
- A visual redesign can reorder existing information, derive presentation groups
  from authorized snapshots, change component layout/copy and improve error
  presentation. It cannot invent new business capabilities.
- **Recommended smaller approach:** redesign the existing components with one
  CSS token source. Do not install or migrate to Tailwind/shadcn merely to restyle
  this app. The same semantic tokens can map to their themes if the intended
  clinic repository already uses them.
- **Identity approval required:** confirm whether to apply the workflow-led
  redesign to this shop or provide the actual clinic workspace. Do not relabel
  technicians as practitioners or air-conditioning jobs as treatments.
- The clinic wireframes below describe the requested intent. Their current-repo
  equivalents use technicians and bookings, omit room data, and retain customer
  purchase/service histories. Room occupancy, arrival/check-in, follow-up
  automation and courses require real existing entities in the clinic repository
  or separately approved nonvisual scope. They cannot be implemented here under
  the stated constraints.

## 2. Screenshot Audit

Initially `npm run screenshots` failed because the script was missing. Added
only an npm alias to the existing Playwright capture script, then ran:

```sh
CAPTURE_OUTPUT_DIR=screenshots/design-audit npm run screenshots
```

Captured and visually reviewed **all 73 PNGs**: 26 desktop viewport images,
27 mobile viewport images, 9 full-page images per viewport and 2 A4 documents.
The viewports are 1440x1000 and 390x844, captured at 2x. Uncropped contact sheets
were used for exhaustive comparison, including the complete scrollable pages.
Original portfolio sets were not overwritten. Inventory: [manifest](../screenshots/design-audit/manifest.json).
Screenshots disable animations and hide the demo banner; motion findings below
come from the CSS, not an inference from still images.

### Concrete Findings, Highest Impact First

1. **The first screen answers the wrong question.** Owner/admin dashboards lead
   with four KPI tiles and a chart/status distribution. Today's work follows
   those and the product ranking. At 390px the next customer is several screens
   below the greeting. Evidence: `02-dashboard`, `24-admin-dashboard` and their
   full-page variants. Put today's timeline first, with reporting secondary.
2. **Booking errors are visually detached from the form.** In `20-booking-conflict`
   the toast is behind the modal backdrop and blurred/partly out of view. Source:
   `DataProvider.tsx` renders the toast outside `Modal.tsx`, which uses native
   `dialog.showModal()` in the browser top layer. A higher ordinary z-index is
   not the fix. Show the service message persistently inside the active form.
3. **Mobile schedules favor the whole book over the next appointment.**
   `15-booking-week`, `16-booking-day`, `25-technician-jobs` show several toolbar
   rows before appointments; other staff columns require sideways scrolling.
   The technician week opens with earlier days, not today's next job. Keep the
   time grid for desktop; make today's agenda the mobile default presentation.
4. **Repeated containers erase information hierarchy.** Dashboard, products,
   orders and customers repeat the same pale background, white framed section,
   rounded KPI tiles and soft shadow. The forms reuse the same framed summary
   blocks. These are not all literal nested cards, but the visual rhythm feels
   like one component recipe. Use unframed sections and row separators.
5. **Icons become decoration.** KPI icons sit in colored tiles (not all circles);
   calendar staff headers use colored circles, contact rows repeat phone/pin/
   tool icons, tabs and many commands add icons, and detail links append arrows.
   Evidence: `02`, `03`, `09`, `15`-`17`, `21`-`26`. Retain icons only for compact
   tool commands/navigation where they improve recognition.
6. **Mobile summary tiles crowd out the working list.** In products, orders and
   customers, the first actual row is near/below the first viewport after the
   heading, promotional subtitle, actions, three summaries and filters. Replace
   tall summaries with one quiet count/filter line.
7. **Detail views hide important columns.** `08-stock-history`, `11-order-detail`,
   `22-customer-purchases` and `23-customer-services` require horizontal scrolling
   to reach quantities, totals or status on mobile. Keep desktop tables but
   expose these fields in stacked labeled rows at 390px.
8. **Customer context is subordinate to totals.** The profile puts three metrics
   between contact information and history. On mobile, these consume much of
   the dialog before the relevant previous visit. Put the next booking and most
   recent service first; purchase totals belong in purchase history.
9. **Copy sounds like a template.** The brand is repeated above every page title;
   dashboard greets by name; login says "ยินดีต้อนรับกลับ"; subtitles promise
   smooth work rather than report concrete dates/results. Commands alternate
   "กลับ", "ยืนยันรายการ", "ยืนยันยกเลิก" and status labels used as buttons.
   Middle dots join unrelated identity/contact/time metadata.
10. **Effects do not serve front-desk work.** `src/styles.css` contains staggered
    `surface-enter` opacity/translate animations, header/modal backdrop blur,
    subtle shadows on static blocks and a decorative diagonal login gradient.
    Remove these instead of substituting stronger effects. Retain a static
    skeleton and only meaningful state feedback.
11. **Tiny type weakens a calm layout.** Timeline details reach 8-9px; staff job
    counts and secondary table metadata are faint/small. Larger headings do not
    compensate for unreadable times and contextual details. Establish a real
    minimum metadata size and contrast floor.

### Complete Feature Review Register

Each number below includes **both desktop and mobile**. `27` is mobile only.
All 18 full-page versions and both document images were also reviewed.

| Capture | Observation and intended response |
| --- | --- |
| 01 login | Split promotional composition, greeting, diagonal line and arrow CTA. Use a quiet brand header and compact form. |
| 02 owner dashboard | KPIs/chart before today's work. Reverse hierarchy; numbers become a secondary report. |
| 03 products | Summary tiles above filters/list; many row tool buttons. Compress summary and keep one clearly named primary stock action. |
| 04 low stock | Same layout repeated; warning filter has little prominence. Show a focused replenishment list with quantity/minimum visible. |
| 05 product form | Framed form-note block and generic modal treatment. Preserve working validation; group fields with spacing and explicit save label. |
| 06 stock in | CTA "ยืนยันรายการ" does not identify effect. Use "บันทึกรับเข้า" with quantity/unit alongside product. |
| 07 stock out | Same generic CTA as receipt. Use "บันทึกเบิกออก" and keep available quantity visible. |
| 08 stock history | Small table; amount column falls outside mobile width. Use dated rows with right-aligned signed quantities. |
| 09 orders | Three KPI tiles delay results. One summary/filter line; status, customer and total remain easy to scan. |
| 10 pending orders | Filtered state barely changes context. State "คำสั่งซื้อรอชำระ" and matching result count without adding a hero. |
| 11 order detail | Tiny process labels, large empty intervals and arrow CTA. Compact actual status history and explicit action names. |
| 12 cancellation | Stacked dialogs/blur and generic confirmation. One concise confirmation naming the order and stock effect. |
| 13 quotation preview | A4 content remains legible only when enlarged on mobile. Preserve clean document layout and use a named download action. |
| 14 order creation | Product options truncate on mobile; total and helper box use generic emphasis. Selected name must wrap outside the selector. |
| 15 week calendar | Day rows contain cards, not a consistent time axis. Preserve week navigation but use an appointment-book grid for selected day. |
| 16 day calendar | Real grid is a useful foundation; staff circles/extra toolbar rows distract. Keep time axis and legible appointment names. |
| 17 job detail | Date/contact/notes all get icons and dot-joined metadata. Put customer and time first with short labeled lines. |
| 18 rescheduling | "แก้ไขงาน / เลื่อนนัด" mixes intentions. Explicit edit/reschedule title and persistent inline scheduling feedback. |
| 19 booking creation | Many equally weighted fields. Customer, service, staff, date/time first; optional reference/notes secondary. |
| 20 booking conflict | Rule message is behind the modal. Inline error beneath time/staff fields and above save, without changing the rule. |
| 21 customers | KPIs, initial avatars and repeated contact icons precede identity/history. Search and actionable contact/history rows first. |
| 22 purchase history | Metrics consume vertical room; totals hidden to the right on mobile. Identity first and mobile row total always visible. |
| 23 service history | Status hidden on mobile; purchase totals still dominate. Show last/next appointment context and status in each service row. |
| 24 admin dashboard | Operational role still gets report-style tiles and distributions first. Same timeline-first hierarchy without financial data. |
| 25 technician schedule | Week view starts in the past and spans empty width on desktop. Default to today's own agenda without altering permissions. |
| 26 technician detail | Good own-job boundary; decorations/arrows dilute the single task. Plain time/contact context and explicit completion action. |
| 27 mobile navigation | Large dark rail, every item iconized and duplicated header context. Compact text navigation with selected-state indicator. |

The A4 quotations are more restrained than the web UI: aligned figures,
whitespace and thin rules are worth retaining. Their signature/footer spacing
is document formatting, not a reason to add dashboard whitespace or cards.

## 3. Direction: An Appointment Book, Not a Template Dashboard

### Five Product-Specific Principles

1. **The next customer beats the aggregate.** Current and next work appear before
   sales totals, stock counts or month charts, especially on a phone.
2. **Time is the shared visual ruler.** Align staff work to a readable time axis;
   put customer identity and time before internal booking IDs.
3. **A person has a continuous history.** Contact, next booking and last service
   sit together. Never imply clinical facts or arrival status the model lacks.
4. **An action names its effect.** Booking, rescheduling, stock receipt, stock
   issue and cancellation each have a distinct Thai verb. Rule errors stay
   with the form that caused them.
5. **Calm comes from hierarchy, not decoration.** One accent for actions/selection,
   status colors for state, rules for rows, and whitespace for groups. Access
   boundaries remain visible in what is absent, not decorative lock tiles.

## 4. Palette and Semantic Color Tokens

Six base values, not a palette expanded independently per page:

| Token / name | Hex | Use |
| --- | --- | --- |
| `canvas` / Quiet grey-green | `#F5F7F6` | Page background; not cream/beige |
| `surface` / Paper | `#FFFFFF` | Working lists, appointment book, forms |
| `ink` / Charcoal green | `#233B35` | Names, headings, values |
| `muted` / Secondary ink | `#526960` | Supporting text, dates, units |
| `line` / Control edge | `#7E8F87` | Essential input boundaries, separators requiring identification |
| `accent` / Eucalyptus | `#236B5E` | Primary actions, focus, current selection |

For the **requested clinic direction**, eucalyptus is proposed from the quiet
green of care uniforms and reusable treatment linens, not a generic SaaS blue.
That is a design rationale, not a claim about an unknown clinic's actual brand.
Confirm it with the clinic identity before implementation. In this shop it also
respects the existing green brand without pretending it is a medical business.
No purple/indigo, pink gradients, cream/terracotta or decorative color washes.

| Semantic state | Text / indicator | Muted fill | Domain labels retained |
| --- | --- | --- | --- |
| Waiting / needs action | `#7A5D26` | `#F5F0E5` | นัดแล้ว, รอชำระ, สต็อกต่ำ |
| In progress / information | `#315D76` | `#ECF2F5` | กำลังทำ, รอติดตั้ง/จัดส่ง |
| Complete / positive | `#3E6950` | `#EDF3EE` | เสร็จ, สำเร็จ, ชำระแล้ว, พร้อมขาย |
| Cancelled / destructive | `#864E45` | `#F7EEEB` | ยกเลิก, validation errors |
| Neutral | `#59635F` | `#F0F2F1` | Counts/secondary states, not a substitute for status labels |

Use these same mappings in timeline, calendar, tables and profile history. Staff
identity comes from column names, not a second competing color code. Appointment
blocks use white surfaces, one state indicator and explicit text; do not tint
the whole calendar. No color-only or red/green-only interpretation.

### Contrast Preflight

Calculated WCAG sRGB ratios, not a claim that unimplemented pages pass:

- Ink/paper: **12.01:1**. Muted/paper: **5.92:1**; muted/canvas: **5.50:1**.
- White text/accent: **6.29:1**. Accent focus ring/paper: **6.29:1**.
- Control edge/paper: **3.41:1**; control edge/canvas: **3.17:1**.
- State text on its own fill: waiting **5.40**, progress **6.28**, positive
  **5.58**, destructive **5.76**, neutral **5.53** to one.
- Thin decorative row rules may derive from line mixed with paper. Do not use
  that low-contrast derived rule to identify an input or focused control.

## 5. Typography

Use **IBM Plex Sans Thai**, locally served, with **400 and 600 only**. Its
looped Thai glyphs retain familiar letter distinctions for reception work,
with room for stacked marks; Latin model codes and numerals remain compatible.
It is already licensed/included, so this deliberate retention avoids a font
download or family change just to make the redesign look different. No synthetic
700, negative letter spacing or font sizes tied to viewport width.

| Token | Size / line height | Weight | Application |
| --- | --- | --- | --- |
| `meta` | 12 / 20px | 400 | Secondary IDs, units, noncritical hints |
| `compact` | 14 / 24px | 400 or 600 | Table rows, form labels, appointment time |
| `body` | 16 / 28px | 400 | Customer names, important form/error text, actions |
| `section` | 20 / 32px | 600 | Section title, secondary aggregate |
| `page` | 28 / 40px | 600 | One page title; no oversized greeting |

Body/compact/meta line height is at least 1.6. Never shrink below 12px to fit a
calendar cell: wrap, shorten optional metadata or open detail. Keep Thai marks
uncropped. Customer names may use two lines, with their full name in detail.

Set `font-variant-numeric: tabular-nums lining-nums` on money, quantities, counts,
times and date columns. Right-align numeric table headers and cells, including
signed stock deltas. Right-align a row's end-time column; align the main schedule
time gutter consistently. Keep existing date/currency values and calculation
semantics; do not localize them into different stored values.

## 6. Structure Tokens, Controls and Motion

One proposed token block in `src/styles.css` owns all visual values. Feature CSS
owns layout only and consumes these tokens; no new hex/shadow/radius recipes per
page. Reuse existing components, especially Modal, before adding primitives.
If the actual clinic repo is supplied with Tailwind/shadcn, map the same source
to Tailwind theme and shadcn `background`, `foreground`, `muted`, `primary`,
`border`, `input`, `ring`, `destructive` and radius variables. Do not create a
second palette or add those frameworks to this repo without approval.

- **Spacing:** 4, 8, 12, 16, 24, 32, 48px. Use 4/8 within a row, 12/16 for
  related fields, 24 between field groups, 32 between sections, 48 only at major
  boundaries. Page gutters: 32 desktop, 16 mobile.
- **Radius:** 0 for bands/table sections; 2px for status labels and appointment
  blocks; 4px for inputs/buttons; 8px for floating dialogs/popovers. Circular
  radio indicators remain native controls, not decorative KPI icons.
- **Borders:** 1px derived hairlines between rows/groups; essential controls use
  the stronger line token. A page section has no outer box by default.
- **Elevation:** none on pages, lists, numbers, buttons or static sections.
  Dialog/popover only: `0 12px 32px rgb(35 59 53 / 16%)`. Dimmed backdrop, no blur
  or glassmorphism. Avoid stacked dialogs; reuse one detail/confirmation surface.
- **Focus:** 2px solid accent outline, 2px offset; never remove visible focus.
  Apply to every keyboard action, tab, calendar block and menu item.
- **Controls:** 44px touch targets; 40px desktop inputs. Icon tools can look
  smaller but need a full target, accessible name and tooltip. Save/cancel labels
  use text; no appended arrows. No icon in ordinary headings or field labels.
- **Motion:** no load fades/slides, stagger, card lift, decorative hover or
  shimmering gradient. Use a static skeleton. State changes may have a 100ms
  color response; never animate row position/time. Reduced motion disables all
  nonessential transitions and any preview-loader rotation.

## 7. Layout Wireframes

Wireframes are structural, not sample records to add to the seed. Labels below
are shown outside ASCII diagrams to keep the diagrams stable.

### Dashboard: Today's Appointment Timeline First

1440px, requested clinic intent:

```text
+---------------+------------------------------------------------------------+
| Brand         | Today / date                         [Book appointment]    |
| Today         +---------------------------------------+--------------------+
| Appointments  | NOW                                   | DAY NOTES          |
| Customers     | Time       Customer       Staff/Room  | Next arrival       |
| Sales         | 10:00      [name]         [A / R1]    | [time + name]      |
| Stock         | [explicit current status]             | Needs attention    |
|               +---------------------------------------+--------------------+
|               | NEXT                                                       |
|               | 10:30      [name]         [B / R2] [service]                |
|               | 11:00      [name]         [A / R1] [service]                |
|               +------------------------------------------------------------+
|               | LATER TODAY / COMPLETED (quiet dated rows)                 |
|               +------------------------------------------------------------+
|               | OWNER ONLY: day sales / month sales / monthly report       |
+---------------+------------------------------------------------------------+
```

390px:

```text
+--------------------------------------+
| Menu     Today                 User  |
| Date               [Book appointment]|
| Now                                  |
| [time] [name]                        |
| [service] [staff] [room if real data] |
| [explicit status]                    |
|--------------------------------------|
| Next                                 |
| [time] [name] [staff] [status]         |
| [time] [name] [staff] [status]         |
|--------------------------------------|
| Later today / completed              |
|--------------------------------------|
| Owner: [Open sales summary]           |
+--------------------------------------+
```

Thai heading: **งานวันนี้** in this repo; **นัดหมายวันนี้** in a clinic. Current
repo shows technician, job type and notes, **not a room**. Do not infer arrival
or physical occupancy from the clock. A job marked working goes into current
work; a scheduled job that has passed its start is "ถึงเวลานัดแล้ว" (presentation
description), not automatically arrived/in treatment. Future scheduled jobs
sort by start. Done jobs are separate. Unknown arrival stays unknown.

All groups use existing authorized bookings/customer/technician data. Preserve
the owner/admin distinction: owner-only numbers/reports render below the
timeline or in an in-page sales-summary view; admin never gets those totals.
Technicians remain on their existing own-bookings route. No new role/home route.

The owner can open the sales summary directly in the evening on mobile without
scrolling through an entire month chart. This is a view control within the
existing dashboard, not a new route or calculation. Stock/order alerts become
brief actionable rows, not competing panels with equal visual weight.

### Appointment Calendar: A Working Appointment Book

1440px:

```text
+------------------------------------------------------------------------+
| Appointments      [Previous] Date [Next] [Today]       [Book appointment]|
| [Day] [Week]       Staff filter          Status filter                 |
| Mon Tue Wed Thu Fri Sat Sun  (selected day within week)                 |
+-------+------------------+------------------+--------------------------+
| Time  | Staff A          | Staff B          | Staff C / Staff D          |
+-------+------------------+------------------+--------------------------+
| 09:00 | [09:00-09:45]    |                  |                          |
|       | [customer name]  |                  |                          |
| 09:30 | [service/status] | [09:30-10:15]    |                          |
|       |                  | [customer name]  |                          |
| 10:00 |                  | [service/status] | [customer name]          |
+-------+------------------+------------------+--------------------------+
```

Use a clear time gutter, stronger hourly and lighter half-hour rules, readable
staff column names and a labeled current-time rule. Preserve actual start/end
and duration; never alter intervals to make blocks fit. Short appointments use
a compact time/name block with detail on activation, not overlapping text.
Staff names stay visible during scroll. Week mode retains week navigation and
an overview, with a selected-day time-grid view; do not force seven full daily
grids into tiny boxes. Horizontal scrolling is confined to the book, not body.

390px defaults to an agenda presentation of the **same bookings**:

```text
+--------------------------------------+
| Appointments          [Book]         |
| [Previous] Date [Next] [Today]        |
| [Agenda] [Time grid]                  |
| Staff [All / selected]               |
|--------------------------------------|
| 09:00-09:45  [customer name]          |
| [service]    [staff / actual room]    |
| [status]                 [Open]       |
|--------------------------------------|
| 10:00-11:00  [customer name]          |
| [service]    [staff]                  |
| [status]                 [Open]       |
+--------------------------------------+
```

Clinic staff columns are conditional on an actual clinic model. This repo keeps
its four technicians, current service types and double-booking validation.
Technicians get only their own agenda/columns. No drag-to-reschedule is promised;
the existing validated form remains the reliable way to move an appointment.

### Customer Profile: Context Before Aggregates

No new profile route: use the existing detail surface, wide on desktop and
full-width on mobile. Name/phone are primary; internal ID and optional address
are secondary. No large decorative initial avatar or KPI row.

```text
1440px
+------------------------------------------------------------------------+
| Customer name                                         [Close]          |
| Phone / contact action     Address (where relevant)                     |
+------------------------------+-----------------------------------------+
| NEXT APPOINTMENT             | LAST SERVICE                            |
| Date/time, staff             | Date, staff, service, status            |
| Service and notes            | Existing notes only                     |
| [Book appointment]           |                                         |
+------------------------------+-----------------------------------------+
| [Service history] [Purchase history]                                    |
| Date/time   Service or order     Staff/status                 Amount    |
| ... dated rows, no cards inside the profile ...                         |
+------------------------------------------------------------------------+

390px
+--------------------------------------+
| Customer name                 Close  |
| Phone / contact action               |
|--------------------------------------|
| Next appointment / no future booking |
| Date/time, service, staff, status    |
| Last service                         |
|--------------------------------------|
| [Service history] [Purchases]         |
| Date    Service / staff / status     |
| Date    Order / status        Amount |
+--------------------------------------+
```

"Book appointment" may reuse the existing booking dialog with the customer
preselected, only if permitted. It is not automated follow-up advice. Do not
show medical history, clinical warnings, course progress or room history from
the current shop data. If no existing record exists, say so rather than
manufacturing a placeholder consultation.

## 8. Thai Copy System

Use the same verb for the same action everywhere. Object + effect, no generic
"ยืนยัน", no greeting banner, no promotional promise beneath every heading.
Separate time, phone and address into labeled lines; avoid middle-dot joins.

| Current pattern | Proposed Thai |
| --- | --- |
| สวัสดี, คุณปริม | งานวันนี้ / นัดหมายวันนี้, followed by the date |
| ยินดีต้อนรับกลับ | เข้าสู่ระบบ |
| นัดหมายงานใหม่ | เพิ่มนัดหมาย |
| Booking save | บันทึกนัดหมาย |
| Reschedule save | บันทึกเวลาใหม่ |
| แก้ไขงาน / เลื่อนนัด | แก้ไขนัดหมาย; เลื่อนนัด for the time-changing action |
| ยืนยันรายการ on receipt | บันทึกรับเข้า |
| ยืนยันรายการ on issue | บันทึกเบิกออก |
| กลับ within a form | ยกเลิกการแก้ไข |
| กลับ within a read-only detail | ปิดรายละเอียด |
| ยืนยันยกเลิก | ยกเลิกคำสั่งซื้อ (with the named order in confirmation text) |
| ชำระแล้ว as an action label | บันทึกการชำระเงิน |
| ปิดงาน | บันทึกงานเสร็จ |
| ดูทั้งหมด plus arrow | ดูตารางงาน / ดูคำสั่งซื้อ / ดูรายการสินค้า |
| Product save | บันทึกสินค้า |
| Export | ส่งออก Excel; ดาวน์โหลดใบเสนอราคา PDF |

These are presentation labels. Domain status names/values and allowed
transitions remain untouched; e.g. "บันทึกการชำระเงิน" advances the existing
paid transition, not an invented payment transaction.

Empty/error examples:

- Empty day: **ไม่มีนัดหมายวันนี้**. Office action: **เพิ่มนัดหมาย**.
  Own-job view: **ยังไม่มีงานที่มอบหมายวันนี้ เลือกวันอื่นเพื่อดูตารางงาน**.
- No filtered results: **ไม่พบรายการตามตัวกรองนี้ ล้างตัวกรองหรือเปลี่ยนคำค้นหา**.
  Action: **ล้างตัวกรอง**.
- No history: **ยังไม่มีประวัติงานบริการของลูกค้ารายนี้**. Show an authorized
  booking action where it actually exists; no invented medical workflow.
- Stock refusal: retain the service's availability message, and add presentation
  guidance **ลดจำนวนเบิกหรือรับสินค้าเข้าก่อนบันทึก** beside the quantity field.
- Booking conflict: retain the service error, with **เลือกเวลาอื่นหรือเปลี่ยนช่าง**
  next to the relevant fields. Clinic wording requires real practitioner data.
- Load failure: **โหลดข้อมูลไม่สำเร็จ ลองอีกครั้ง** with a retry action; only
  offer the existing owner-only reset when applicable.

Do not rewrite services to implement copy. Preserve their errors and show
supplementary guidance in the UI. Rule failures remain inside the modal until
corrected/dismissed; live-region announcement and focus must reach that message.
Success feedback can be a brief toast after the form closes, with plain Thai
such as **บันทึกนัดหมายแล้ว**. No automatic rescheduling or state changes.

## 9. Review Against Generic Defaults: Revisions Made to This Plan

| Default to reject | Revision and why |
| --- | --- |
| Same rounded/shadowed card for every section | Replaced with full-width, unframed section bands and ruled rows. Different radii apply to controls, blocks and floating surfaces only. |
| KPI tile with colored icon | Removed the top KPI row entirely. Owner figures are a small secondary report with plain labels and aligned values. |
| Dark sidebar, greeting and marketing login as the main identity | Proposed a quiet compact navigation rail and a plain working login. Brand appears once, not as an eyebrow on every page. |
| Decorative gradients / glass / emoji | No decorative gradient, header blur, backdrop blur or emoji. A dim backdrop is retained only for focus isolation. |
| Icons in headings/labels and arrows on commands | Removed. Compact recognized tools may keep one icon with a tooltip/name; normal commands use specific Thai text. |
| Metadata joined by middle dots | Changed to separate short labeled lines. This improves scanning customer/time/contact information. |
| Fade-and-slide/stagger and hover lift on static sections | Removed. Static content is immediately stable; only actionable controls get state feedback. |
| Agenda first on desktop as another repeated-card list | Revised to a time-aligned ruled timeline; desktop calendar remains a real time grid. Mobile agenda uses rows, not a stack of floating cards. |
| Mint tint on every appointment or a color for each practitioner | Replaced with white blocks, state indicator/text and named staff columns, eliminating competing color meanings. |
| "Clinic" invented by relabeling shop entities | Rejected. Room/practitioner/course assumptions are explicit approval gates; no mock clinical facts are proposed as implemented data. |
| Border color chosen for delicacy only | Initial `#84958D` failed 3:1 on canvas (2.93:1). Revised essential edges to `#7E8F87` (3.17:1); decorative rules stay separate. |

## 10. Implementation and Review Gates, Only After Approval

1. Resolve identity/stack mismatch. Apply this plan to the shop as a visual
   adaptation, or use the real clinic repository without changing its contracts.
2. Establish one semantic token source and shared primitives, then shell.
3. Redesign dashboard, bookings/appointments, customers, existing orders/sales,
   products/stock and login, one page at a time. **Courses are not a page in this
   repo**; adding one would violate the route/domain constraint and is excluded.
4. After each page run `npm run screenshots`, with an output directory for that
   iteration. Compare against these wireframes at actual 1440px/390px, inspect
   full-page and modal images, repair the touched page before proceeding.
5. Keep all current service/domain tests. Update presentation selectors only as
   labels/layout legitimately change; do not weaken role/stock/overlap checks.
6. Verify keyboard focus order, dialogs, tabs, menus and calendar activation.
   Test at 200% zoom, long Thai names, empty/filter/loading/error states, short
   appointments, overlapping invalid attempts and reduced-motion preference.
   Contrast: 4.5:1 normal text, 3:1 required control boundaries and graphics.
7. Run build and focused browser checks before a page commit. Stage only the
   current redesign slice, never pre-existing stylesheet or generated-image
   changes wholesale. Commit naming follows repository instructions if supplied;
   otherwise propose `Design: <page> workflow and presentation` with a passing
   build, matching the architecture's build-gated approach.
8. `npm run gallery` is also absent today. After approval, wire it to a static
   screenshot gallery, not a new in-app route. Review all final images; recommend
   timeline/dashboard, appointment book and customer history only if the real
   results demonstrate the scanning and continuity goals. Do not rank unbuilt
   designs or merely choose the most decorative screenshot.

### Approval Needed

- Is this the intended workspace, with a shop-focused interpretation of the
  clinic workflow, or should implementation happen in a clinic repository?
- Approve the timeline-first layouts, six-color eucalyptus palette, Thai type
  scale, plain copy and removal of generic effects.
- Approve use of the existing CSS stack; a Tailwind/shadcn migration needs a
  separate decision because those libraries are not present here.

**Stop here. This audit and plan do not approve Step 3.**