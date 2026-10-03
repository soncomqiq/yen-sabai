import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { useShop } from "../components/DataProvider";
import { PageHeading, Skeleton, EmptyState } from "../components/BackOffice";
import { Modal } from "../components/Modal";
import { orderLabels, bookingLabels, bookingTypeLabels } from "../domain/types";
import { dashboardMetrics } from "../domain/dashboard";
import { canSeeDashboardSales } from "../domain/permissions";
import { money, dateText, number } from "../lib/format";
import { OrderDetail } from "./Orders";
import { BookingDetail } from "./Bookings";
import "./dashboard.css";

export default function Dashboard() {
  const { state, user, service, run, busy } = useShop();
  const [today] = useState(() => new Date());
  const report = useRef<HTMLDetailsElement>(null);
  const [order, setOrder] = useState<string | null>(null),
    [job, setJob] = useState<string | null>(null),
    [reset, setReset] = useState(false);
  if (!state) return <Skeleton />;
  const owner = canSeeDashboardSales(user.role),
    metrics = dashboardMetrics(state, today),
    max = Math.max(1, ...metrics.months.map((month) => month.total)),
    scale = Math.ceil(max / 100000) * 100000;
  const currentJobs = metrics.todayJobs.filter(job => job.status === 'working' || (job.status === 'scheduled' && new Date(job.start) <= today));
  const upcomingJobs = metrics.todayJobs.filter(job => job.status === 'scheduled' && new Date(job.start) > today);
  const completedJobs = metrics.todayJobs.filter(job => job.status === 'done');
  const renderJob = (item: typeof metrics.todayJobs[number]) => {
    const customer = state.customers.find(customer => customer.id === item.customerId);
    const technician = state.technicians.find(tech => tech.id === item.technicianId);
    return <button className="schedule-row" key={item.id} onClick={() => setJob(item.id)} aria-label={`ดูงาน ${item.id}`}>
      <span className="schedule-time">{dateText(item.start, 'HH:mm')}<small>{dateText(item.end, 'HH:mm')}</small></span>
      <span className="schedule-customer"><strong>{customer?.name}</strong><span>{bookingTypeLabels[item.type]}</span></span>
      <span className="schedule-staff">{technician?.name}</span>
      <span className={`badge ${item.status}`}>{item.status === 'scheduled' && new Date(item.start) <= today ? 'ถึงเวลานัดแล้ว' : bookingLabels[item.status]}</span>
    </button>;
  };
  return (
    <>
      <PageHeading
        title="งานวันนี้"
        subtitle={dateText(today, "EEEE d MMMM yyyy")}
        actions={
          <>
            <Link className="secondary" to="/bookings">
              ตารางงานช่าง
            </Link>
            {owner && <button className="secondary" onClick={() => { if (report.current) { report.current.open = true; report.current.scrollIntoView({ block: 'start' }); } }}>สรุปยอดขาย</button>}
            {owner && (
              <button
                className="icon-button reset-demo"
                title="รีเซ็ตข้อมูลตัวอย่าง"
                aria-label="รีเซ็ตข้อมูลตัวอย่าง"
                onClick={() => setReset(true)}
              >
                <RotateCcw />
              </button>
            )}
          </>
        }
      />
      <div className="workday-layout">
        <section className="day-schedule" aria-label="ตารางงานวันนี้">
          <div className="section-heading"><h2>ตารางวันนี้</h2><span className="muted">{metrics.todayJobs.length} งาน</span></div>
          {metrics.todayJobs.length === 0 ? <EmptyState title="ไม่มีนัดหมายวันนี้" detail="เลือกวันอื่นในตารางงานช่างเพื่อดูนัดหมาย" action={<Link className="secondary" to="/bookings">ดูตารางงาน</Link>} /> : <>
            {currentJobs.length > 0 && <div className="schedule-group"><h3>กำลังทำและถึงเวลานัด</h3>{currentJobs.map(renderJob)}</div>}
            {upcomingJobs.length > 0 && <div className="schedule-group"><h3>งานถัดไป</h3>{upcomingJobs.map(renderJob)}</div>}
            {completedJobs.length > 0 && <details className="completed-jobs"><summary>เสร็จแล้ว {completedJobs.length} งาน</summary>{completedJobs.map(renderJob)}</details>}
          </>}
        </section>
        <aside className="day-followups"><h2>ต้องติดตาม</h2><Link to="/orders" className="followup-row"><span>คำสั่งซื้อรอดำเนินการ</span><strong>{metrics.awaiting.length}</strong></Link><Link to="/products" className="followup-row"><span>สินค้าถึงจุดสั่งซื้อ</span><strong>{metrics.low.length}</strong></Link><p className="muted">ตรวจรายการก่อนรับงานและขายสินค้า</p></aside>
      </div>
      <details className="shop-report" ref={report} open={!owner}>
        <summary>{owner ? 'ยอดขายและรายงานร้าน' : 'รายการที่ต้องติดตาม'}</summary>
        {owner && <dl className="sales-summary"><div><dt>ยอดขายวันนี้</dt><dd>{money(metrics.todaySales)}</dd></div><div><dt>ยอดขายเดือนนี้</dt><dd>{money(metrics.months[5].total)}</dd></div></dl>}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{owner ? "ยอดขายรายเดือน" : "สถานะคำสั่งซื้อ"}</h2>
              <p className="section-subtitle">
                {owner
                  ? "6 เดือนล่าสุด หน่วยบาท"
                  : "คำสั่งซื้อทั้งหมดของร้าน"}
              </p>
            </div>
            <span className="period-tag">
              {owner
                ? `${dateText(metrics.months[0].month, "MMM")} – ${dateText(metrics.months[5].month, "MMM yy")}`
                : `${state.orders.length} รายการ`}
            </span>
          </div>
          {owner ? (
            <div
              className="chart"
              role="img"
              aria-label={`ยอดขาย 6 เดือน ${metrics.months.map((month) => `${dateText(month.month, "MMM")} ${money(month.total)}`).join(", ")}`}
            >
              <div className="chart-y">
                {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
                  <span key={fraction}>
                    {number((scale * fraction) / 1000)}k
                  </span>
                ))}
              </div>
              <div className="chart-plot">
                <div className="chart-lines">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <i key={line} />
                  ))}
                </div>
                <div className="chart-bars">
                  {metrics.months.map((month, index) => (
                    <div
                      className="chart-column"
                      key={month.month.toISOString()}
                    >
                      <span className="chart-value">
                        {number(Math.round(month.total / 1000))}k
                      </span>
                      <div
                        className={`chart-bar ${index === 5 ? "current" : ""}`}
                        style={{
                          height: `${Math.max(month.total > 0 ? 2 : 0, (month.total / scale) * 100)}%`,
                        }}
                        title={`${dateText(month.month, "MMMM")} ${money(month.total)}`}
                      />
                      <span className="chart-month">
                        {dateText(month.month, "MMM")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="order-overview">
              {Object.entries(orderLabels).map(([status, label]) => {
                const count = state.orders.filter(
                  (order) => order.status === status,
                ).length;
                return (
                  <div key={status}>
                    <span className={`badge ${status}`}>{label}</span>
                    <div className="overview-track">
                      <i
                        style={{
                          width: `${(count / Math.max(1, state.orders.length)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>สินค้าขายดี</h2>
              <p className="section-subtitle">จำนวนที่ขายใน 6 เดือนล่าสุด</p>
            </div>
            <Link to="/products" className="text-link">
              ดูรายการสินค้า
            </Link>
          </div>
          <div className="top-products">
            {metrics.top.map(({ product, quantity }, index) => (
              <div className="top-product" key={product.id}>
                <span className="rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="product-image">
                  <img
                    src={`${import.meta.env.BASE_URL}${product.category === "aircon" ? "aircon" : "parts"}.png`}
                    alt=""
                  />
                </span>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.sku}</small>
                </div>
                <span className="top-quantity">
                  {quantity}
                  <small>{product.unit}</small>
                </span>
              </div>
            ))}
            {!metrics.top.length && (
              <EmptyState
                title="ยังไม่มียอดขาย"
                detail="สินค้าที่ชำระแล้วจะแสดงที่นี่"
              />
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                สต็อกที่ต้องเติม{" "}
                <span className="count-pill warning">{metrics.low.length}</span>
              </h2>
              <p className="section-subtitle">คงเหลือถึงหรือต่ำกว่าขั้นต่ำ</p>
            </div>
            <Link className="text-link" to="/products">
              ดูรายการสินค้า
            </Link>
          </div>
          <div className="low-products">
            {metrics.low.slice(0, 4).map((product) => (
              <Link to="/products" className="low-product" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>
                    ขั้นต่ำ {product.minimumStock} {product.unit}
                  </small>
                </div>
                <span className="low-stock">
                  {product.stock}
                  <small>เหลือ</small>
                </span>
              </Link>
            ))}
            {!metrics.low.length && (
              <EmptyState
                title="สต็อกพร้อมขาย"
                detail="ไม่มีสินค้าต่ำกว่าจุดสั่งซื้อ"
              />
            )}
          </div>
        </section>
        <section className="panel awaiting-panel">
          <div className="panel-heading">
            <div>
              <h2>คำสั่งซื้อรอดำเนินการ</h2>
              <p className="section-subtitle">อัปเดตล่าสุด</p>
            </div>
            <Link className="text-link" to="/orders">
              ดูคำสั่งซื้อ
            </Link>
          </div>
          {metrics.awaiting.length ? (
            <div className="table-scroll">
              <table className="awaiting-table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>ลูกค้า</th>
                    <th>วันที่</th>
                    <th>สถานะ</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {metrics.awaiting.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td>
                        <button
                          className="text-link"
                          onClick={() => setOrder(order.id)}
                        >
                          {order.id}
                        </button>
                      </td>
                      <td>
                        {
                          state.customers.find(
                            (customer) => customer.id === order.customerId,
                          )?.name
                        }
                      </td>
                      <td>{dateText(order.createdAt)}</td>
                      <td>
                        <span className={`badge ${order.status}`}>
                          {orderLabels[order.status]}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="icon-button"
                          title="ดูคำสั่งซื้อ"
                          aria-label={`ดู ${order.id}`}
                          onClick={() => setOrder(order.id)}
                        >
                          <ArrowUpRight />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="จัดการคำสั่งซื้อครบแล้ว"
              detail="ไม่มีรายการรอดำเนินการ"
            />
          )}
        </section>
      </div>
      </details>
      {order && <OrderDetail orderId={order} onClose={() => setOrder(null)} />}
      {job && <BookingDetail bookingId={job} onClose={() => setJob(null)} />}
      {reset && (
        <Modal
          title="รีเซ็ตข้อมูลตัวอย่าง?"
          onClose={() => {
            if (!busy) setReset(false);
          }}
        >
          <p className="dialog-copy">
            การแก้ไขทั้งหมดจะหายไป
            และสร้างข้อมูลสมมติชุดใหม่โดยอิงวันที่ปัจจุบัน
          </p>
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setReset(false)}
            >
              กลับ
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () => service.reset(user),
                    "รีเซ็ตข้อมูลเรียบร้อยแล้ว",
                  )
                )
                  setReset(false);
              }}
            >
              ยืนยันรีเซ็ต
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
