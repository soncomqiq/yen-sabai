import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  ChartNoAxesCombined,
  ShoppingBag,
  Wrench,
  ArrowUpRight,
  AlertTriangle,
  Users,
  RotateCcw,
  CalendarDays,
} from "lucide-react";
import { useShop } from "../components/DataProvider";
import { PageHeading, Skeleton, EmptyState } from "../components/BackOffice";
import { Modal } from "../components/Modal";
import { orderLabels, bookingLabels, bookingTypeLabels } from "../domain/types";
import { dashboardMetrics } from "../domain/dashboard";
import { money, dateText, number } from "../lib/format";
import { OrderDetail } from "./Orders";
import { BookingDetail } from "./Bookings";
import "./dashboard.css";

export default function Dashboard() {
  const { state, user, service, run, busy } = useShop();
  const [order, setOrder] = useState<string | null>(null),
    [job, setJob] = useState<string | null>(null),
    [reset, setReset] = useState(false);
  if (!state) return <Skeleton />;
  const owner = user.role === "owner",
    metrics = dashboardMetrics(state),
    max = Math.max(1, ...metrics.months.map((month) => month.total)),
    scale = Math.ceil(max / 100000) * 100000;
  return (
    <>
      <PageHeading
        title={`สวัสดี, ${user.name}`}
        subtitle={`${dateText(new Date(), "EEEE d MMMM yyyy")} · ภาพรวมร้านวันนี้`}
        actions={
          <>
            <Link className="secondary" to="/bookings">
              <CalendarDays size={17} />
              ตารางงานช่าง
            </Link>
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
      <div className="stats-grid">
        {owner ? (
          <>
            <div className="stat-card">
              <span className="stat-icon">
                <Banknote />
              </span>
              <div>
                <p>ยอดขายวันนี้</p>
                <strong>{money(metrics.todaySales)}</strong>
                <small className="stat-foot">ชำระแล้วและส่งมอบ</small>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon blue">
                <ChartNoAxesCombined />
              </span>
              <div>
                <p>ยอดขายเดือนนี้</p>
                <strong>{money(metrics.months[5].total)}</strong>
                <small className="stat-foot">
                  {dateText(new Date(), "MMMM yyyy")}
                </small>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <span className="stat-icon amber">
                <AlertTriangle />
              </span>
              <div>
                <p>สินค้าถึงจุดสั่งซื้อ</p>
                <strong>
                  {metrics.low.length}
                  <small> รายการ</small>
                </strong>
                <small className="stat-foot">ตรวจสอบสต็อกวันนี้</small>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon blue">
                <Users />
              </span>
              <div>
                <p>ลูกค้าทั้งหมด</p>
                <strong>
                  {state.customers.length}
                  <small> ราย</small>
                </strong>
                <small className="stat-foot">ลูกค้าของร้านเย็นสบาย</small>
              </div>
            </div>
          </>
        )}
        <div className="stat-card">
          <span className="stat-icon amber">
            <ShoppingBag />
          </span>
          <div>
            <p>คำสั่งซื้อรอดำเนินการ</p>
            <strong>
              {metrics.awaiting.length}
              <small> รายการ</small>
            </strong>
            <small className="stat-foot">รอชำระ / ติดตั้ง / จัดส่ง</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Wrench />
          </span>
          <div>
            <p>งานช่างวันนี้</p>
            <strong>
              {metrics.todayJobs.length}
              <small> งาน</small>
            </strong>
            <small className="stat-foot">
              เสร็จแล้ว{" "}
              {metrics.todayJobs.filter((job) => job.status === "done").length}{" "}
              งาน
            </small>
          </div>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{owner ? "ยอดขายรายเดือน" : "สถานะคำสั่งซื้อ"}</h2>
              <p className="section-subtitle">
                {owner
                  ? "6 เดือนล่าสุด · หน่วยบาท"
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
              <p className="section-subtitle">จำนวนที่ขาย · 6 เดือนล่าสุด</p>
            </div>
            <Link to="/products" className="text-link">
              ดูสินค้า <ArrowUpRight size={14} />
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
                งานช่างวันนี้{" "}
                <span className="count-pill">{metrics.todayJobs.length}</span>
              </h2>
              <p className="section-subtitle">ติดตั้ง ล้างแอร์ และซ่อม</p>
            </div>
            <Link className="text-link" to="/bookings">
              ดูทั้งหมด <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="today-jobs">
            {metrics.todayJobs.map((job) => (
              <button
                className="today-job"
                key={job.id}
                onClick={() => setJob(job.id)}
              >
                <span className="today-time">
                  {dateText(job.start, "HH:mm")}
                  <small>{dateText(job.end, "HH:mm")}</small>
                </span>
                <div>
                  <strong>
                    {bookingTypeLabels[job.type]} ·{" "}
                    {
                      state.customers.find(
                        (customer) => customer.id === job.customerId,
                      )?.name
                    }
                  </strong>
                  <small>
                    {
                      state.technicians.find(
                        (tech) => tech.id === job.technicianId,
                      )?.name
                    }
                  </small>
                </div>
                <span className={`badge ${job.status}`}>
                  {bookingLabels[job.status]}
                </span>
              </button>
            ))}
            {!metrics.todayJobs.length && (
              <EmptyState
                title="วันนี้ไม่มีนัดหมาย"
                detail="ทีมช่างพร้อมสำหรับงานใหม่"
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
              ดูทั้งหมด <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="low-products">
            {metrics.low.slice(0, 4).map((product) => (
              <Link to="/products" className="low-product" key={product.id}>
                <span className="low-icon">
                  <AlertTriangle size={16} />
                </span>
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
              ดูทั้งหมด <ArrowUpRight size={14} />
            </Link>
          </div>
          {metrics.awaiting.length ? (
            <div className="table-scroll">
              <table>
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
