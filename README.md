# Yensabai Back Office / เย็นสบาย

A complete Thai back-office demo for the fictional shop **ร้านเย็นสบาย
แอร์แอนด์เซอร์วิส**. All customers, products, addresses, contacts, sales and jobs
are fictional. This is not production software or a tax/invoicing system.

**Live demo placeholder:** https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/

## English

### Approved UI Redesign

The shop now uses a timeline-first working dashboard, neutral appointment book,
mobile agenda, context-led customer history, explicit stock/order actions and
in-dialog rule errors. One CSS token source owns the palette/type/spacing.
Domain models, services, rules and hash routes are unchanged.

```sh
CAPTURE_OUTPUT_DIR=screenshots/redesign/final npm run screenshots
npm run gallery
```

With the dev server running, view http://127.0.0.1:5173/gallery/index.html.
This static local gallery is not deployed as an app route. See
[design and audit](docs/DESIGN.md) for decisions, visual comparisons and image recommendations.

### Run Locally

Requires Node.js 22.12+ (or 24+) and npm.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173/. Demo credentials are prefilled:
`demo@yensabai.shop` / `demo1234`. Choose Owner, Admin or Technician.
Technician login represents ช่างเอก, one of four technicians.

### Modules

- Dashboard: today's sales, six-month sales, top products, low stock, today's
  technician jobs, and orders awaiting action.
- Products: search, category/low-stock filters, sorting, validated add/edit,
  stock in/out, movement history and XLSX export of filtered results.
- Orders: multi-product creation, status/date filters, detail timeline,
  permitted status transitions, cancellation and filtered XLSX export.
- Scheduling: week/day calendars, four technician columns, job create/edit/
  reschedule, overlap validation, own-job status updates for technicians.
- Customers: searchable list, profile, purchase and service histories.
- Quotations: Thai A4 preview and PDF download from order details. Local fonts
  are browser-shaped into high-resolution image pages, including multi-page
  line items. PDF text is not selectable/searchable. Validity is 15 days.

### Roles and Persistence

| Role       | Access                                                             |
| ---------- | ------------------------------------------------------------------ |
| Owner      | All pages/actions, sales dashboard and confirmed demo reset        |
| Admin      | All modules except dashboard financial totals/chart and demo reset |
| Technician | Only own bookings/contact details; no prices or sales data         |

Fake login is **not authentication or a security boundary**. Role guards and
mock service checks demonstrate intended permissions only. A real backend must
enforce them. Data persists in `localStorage` under `yensabai-shop-v1`; fake
session identity uses `sessionStorage`. No data is sent to a server.

A deterministic seed contains 40 products, 60 customers, 150 orders and 80
bookings with dates relative to initialization. March-May quantities are higher.
The owner reset button on dashboard recreates dates relative to today. An open
view captures its reference date on mount; reload after midnight or reset an
older demo to get a fresh dated snapshot. Multi-tab transactions are out of scope.

Stock is deducted when creating orders and restored once on cancellation.
Completed/cancelled orders are terminal. Job intervals are half-open, so adjacent
appointments are allowed. All writes simulate 180ms latency and validate before
persisting. Financial dashboard totals count paid/fulfillment/completed orders,
using creation date, not a payment ledger.

The slim fictional-data banner is hidden with either URL:

```text
/?screenshot=1#/dashboard
/#/dashboard?screenshot=1
```

The exported quotation always retains its fictional-data disclaimer.

### Stack and Verification

React 19, TypeScript, Vite, React Router hash routes, Lucide React, date-fns,
ExcelJS, jsPDF, Vitest, Playwright Chromium and Oxlint. Local IBM Plex Sans Thai
fonts are included under the SIL Open Font License. Product images are generic
original illustrations. ExcelJS uses a patched `uuid` override; exports are
loaded on demand (its large export chunk is an intentional build warning).

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:browser
npm audit
```

The browser suite starts/reuses a dev server, checks true 1440px and 390px
viewports and writes screenshots/downloads to ignored `test-results/`.

```sh
npm run preview -- --port 4173 --base /demo/
# In a second terminal:
E2E_BASE_URL=http://127.0.0.1:4173/demo/ npm run test:browser
```

### GitHub Pages

Create a GitHub repository, add its remote and push `main`. In repository
Settings > Pages, select **GitHub Actions** as the source. Enable Actions and
allow the workflow to deploy. The included workflow runs install, tests, lint,
build, uploads `dist` and deploys Pages. Replace the live-demo placeholder above
with the URL shown by the deployment. Hash routing supports direct page links.

See [architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), and
[verification report](docs/VERIFICATION.md) for contracts, deviations and checks.

## ภาษาไทย

ระบบหลังบ้านตัวอย่างสำหรับ **ร้านเย็นสบาย แอร์แอนด์เซอร์วิส** ข้อมูลทั้งหมดเป็น
ข้อมูลสมมติ ไม่ใช่ระบบใช้งานจริง และไม่ใช่ระบบออกเอกสารภาษี

**ลิงก์สาธิต (รอแก้ไข):** https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/

### เริ่มใช้งาน

ติดตั้ง Node.js 22.12 ขึ้นไป แล้วรัน `npm ci` และ `npm run dev` เปิด
http://localhost:5173/ บัญชี `demo@yensabai.shop` รหัสผ่าน `demo1234`
กรอกไว้ให้แล้ว เลือกบทบาทเจ้าของ แอดมิน หรือช่างได้ บัญชีช่างเป็นช่างเอก

เจ้าของใช้ได้ทุกหน้าและรีเซ็ตข้อมูลได้ แอดมินใช้ทุกโมดูลแต่ไม่เห็นยอดเงิน/กราฟ
รายได้บนภาพรวมร้าน ช่างเห็นเฉพาะงานตัวเอง ไม่มีราคาและข้อมูลยอดขาย การ login
เป็นการจำลอง ไม่ใช่ระบบรักษาความปลอดภัยจริง

มีภาพรวมร้าน สินค้า/สต็อก คำสั่งซื้อ ตารางงานช่าง และประวัติลูกค้า รองรับรับเข้า/
เบิกออก ประวัติสต็อก ค้นหา กรอง เรียงสินค้า ส่งออก Excel และใบเสนอราคา PDF
ภาษาไทย ใบเสนอราคาเป็นภาพความละเอียดสูง จึงเลือกหรือค้นหาข้อความใน PDF ไม่ได้

ออเดอร์ตัดสต็อกทันทีเมื่อสร้าง และคืนเมื่อยกเลิกได้เพียงครั้งเดียว สต็อกไม่ติดลบ
ออเดอร์ต้องเปลี่ยนสถานะตามลำดับ งานช่างสร้างและเลื่อนนัดไม่ได้หากเวลาชนกัน
วันที่และเวลาตารางใช้เวลาท้องถิ่นของ browser ควรตั้งเป็นประเทศไทย

ข้อมูลบันทึกในเครื่องด้วย localStorage ไม่ส่งไป server ประกอบด้วยสินค้า 40
รายการ ลูกค้า 60 ราย ออเดอร์ 150 รายการ และงานช่าง 80 งาน ใช้ seed คงที่และ
วันที่อิงวันเริ่มข้อมูล เดือนมีนาคมถึงพฤษภาคมมียอดขายสูงขึ้น หากข้อมูลเก่าให้
เจ้าของกดรีเซ็ตที่หน้าภาพรวมร้าน (ต้องยืนยันก่อน) ข้อมูลที่แก้ไขจะถูกแทนที่

ตรวจสอบด้วย `npm test`, `npm run lint`, `npm run build` และ
`npm run test:browser` ชุด browser tests ตรวจ desktop 1440px/mobile 390px
ใช้ React/TypeScript/Vite, React Router, Lucide, date-fns, ExcelJS และ jsPDF

เผยแพร่โดยสร้าง repository แล้ว push สาขา main เปิด Settings > Pages เลือก
GitHub Actions ระบบจะ build/deploy อัตโนมัติ แล้วแทนที่ลิงก์สาธิตด้านบน
โหมดซ่อนแถบตัวอย่างใช้ `?screenshot=1` ก่อนหรือหลัง hash ได้ แต่เอกสาร PDF
ยังแสดงข้อความว่าข้อมูลสมมติเสมอ
