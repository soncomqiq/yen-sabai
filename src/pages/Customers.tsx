import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useShop } from "../components/ShopContext";
import { PageHeading, Skeleton, EmptyState } from "../components/BackOffice";
import { Modal } from "../components/Modal";
import {
  orderLabels,
  bookingLabels,
  bookingTypeLabels,
  orderTotal,
} from "../domain/types";
import { dateText, money } from "../lib/format";
import { OrderDetail } from "./Orders";
import { BookingDetail, BookingForm } from "./Bookings";
import "./customers.css";

export default function Customers() {
  const { state } = useShop();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    [detail, setDetail] = useState<string | null>(null);
  if (!state) return <Skeleton />;
  const purchases = (id: string) =>
      state.orders.filter(
        (order) => order.customerId === id && order.status !== "cancelled",
      ),
    jobs = (id: string) =>
      state.bookings.filter((job) => job.customerId === id);
  const filtered = state.customers
    .filter(
      (customer) =>
        `${customer.name} ${customer.phone} ${customer.address}`.includes(
          query,
        ) &&
        (filter === "all" ||
          (filter === "purchase"
            ? purchases(customer.id).length > 0
            : jobs(customer.id).length > 0)),
    )
    .sort((left, right) => left.name.localeCompare(right.name, "th"));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)),
    current = Math.min(page, pages);
  return (
    <>
      <PageHeading
        title="ลูกค้า"
        subtitle={`ลูกค้าทั้งหมด ${state.customers.length} ราย`}
      />
      <section className="panel">
        <div className="list-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="ค้นหาลูกค้า"
              placeholder="ค้นหาชื่อ เบอร์โทร หรือที่อยู่…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="กรองลูกค้า"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">ลูกค้าทั้งหมด</option>
            <option value="purchase">มีประวัติซื้อสินค้า</option>
            <option value="service">มีประวัติบริการ</option>
          </select>
        </div>
        {filtered.length ? (
          <>
            <div className="table-scroll">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ลูกค้า</th>
                    <th>ติดต่อ</th>
                    <th>ที่อยู่</th>
                    <th className="numeric">คำสั่งซื้อ</th>
                    <th className="numeric">งานบริการ</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice((current - 1) * 10, current * 10)
                    .map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <button
                            className="customer-name"
                            onClick={() => setDetail(customer.id)}
                          >
                            <span>
                              <strong>{customer.name}</strong>
                              <small>
                                CUS-{customer.id.split("-")[1].padStart(3, "0")}
                              </small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <a
                            className="phone-link"
                            href={`tel:${customer.phone}`}
                          >
                            {customer.phone}
                          </a>
                        </td>
                        <td className="customer-address">{customer.address}</td>
                        <td className="numeric">
                          {purchases(customer.id).length}{" "}
                          <small className="muted">รายการ</small>
                        </td>
                        <td className="numeric">
                          {jobs(customer.id).length}{" "}
                          <small className="muted">งาน</small>
                        </td>
                        <td>
                          <button
                            className="text-link"
                            aria-label={`รายละเอียด ${customer.name}`}
                            title="ดูประวัติลูกค้า"
                            onClick={() => setDetail(customer.id)}
                          >
                            ดูประวัติ
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                แสดง {(current - 1) * 10 + 1}–
                {Math.min(current * 10, filtered.length)} จาก {filtered.length}{" "}
                ราย
              </span>
              <div className="pagination">
                <button
                  className="icon-button"
                  aria-label="หน้าก่อนหน้า"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  <ChevronLeft />
                </button>
                <span>
                  {current} / {pages}
                </span>
                <button
                  className="icon-button"
                  aria-label="หน้าถัดไป"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="ไม่พบลูกค้า"
            detail="ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
            action={
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                ล้างตัวกรอง
              </button>
            }
          />
        )}
      </section>
      {detail && (
        <CustomerDetail customerId={detail} onClose={() => setDetail(null)} />
      )}
    </>
  );
}
function CustomerDetail({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const { state } = useShop(),
    customer = state!.customers.find((customer) => customer.id === customerId)!;
  const [tab, setTab] = useState<"purchase" | "service">("service"),
    [booking, setBooking] = useState(false),
    [order, setOrder] = useState<string | null>(null),
    [job, setJob] = useState<string | null>(null),
    [today] = useState(() => new Date());
  const orders = state!.orders
      .filter((order) => order.customerId === customerId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    jobs = state!.bookings
      .filter((job) => job.customerId === customerId)
      .sort((left, right) => right.start.localeCompare(left.start));
  const total = orders
    .filter((order) =>
      ["paid", "fulfillment", "completed"].includes(order.status),
    )
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const nextJob = [...jobs]
    .filter((job) => job.status !== "done" && new Date(job.start) >= today)
    .sort((left, right) => left.start.localeCompare(right.start))[0];
  const lastJob = jobs.find((job) => job.status === "done");
  return (
    <>
      {!order && !job && !booking && (
        <Modal title="รายละเอียดลูกค้า" onClose={onClose} wide>
          <div className="customer-profile">
            <div>
              <h2>{customer.name}</h2>
              <p>
                <a href={`tel:${customer.phone}`}>{customer.phone}</a>
              </p>
              <p>{customer.address}</p>
            </div>
          </div>
          <div className="customer-context">
            <section>
              <h3>นัดถัดไป</h3>
              {nextJob ? (
                <>
                  <p>{dateText(nextJob.start, "d MMM yyyy HH:mm")}</p>
                  <p>
                    {bookingTypeLabels[nextJob.type]}{" "}
                    {
                      state!.technicians.find(
                        (tech) => tech.id === nextJob.technicianId,
                      )?.name
                    }
                  </p>
                  <button
                    className="text-link"
                    onClick={() => setJob(nextJob.id)}
                  >
                    ดูนัดหมาย
                  </button>
                </>
              ) : (
                <p className="muted">ยังไม่มีนัดหมายครั้งถัดไป</p>
              )}
            </section>
            <section>
              <h3>งานบริการล่าสุด</h3>
              {lastJob ? (
                <>
                  <p>{dateText(lastJob.start, "d MMM yyyy")}</p>
                  <p>
                    {bookingTypeLabels[lastJob.type]}{" "}
                    {
                      state!.technicians.find(
                        (tech) => tech.id === lastJob.technicianId,
                      )?.name
                    }
                  </p>
                  <button
                    className="text-link"
                    onClick={() => setJob(lastJob.id)}
                  >
                    ดูงานบริการ
                  </button>
                </>
              ) : (
                <p className="muted">ยังไม่มีงานบริการที่เสร็จแล้ว</p>
              )}
            </section>
          </div>
          <div className="profile-actions">
            <button className="secondary" onClick={() => setBooking(true)}>
              เพิ่มนัดหมาย
            </button>
          </div>
          <div
            className="history-tabs"
            role="tablist"
            aria-label="ประวัติลูกค้า"
          >
            <button
              role="tab"
              id="purchase-tab"
              aria-controls="purchase-history"
              aria-selected={tab === "purchase"}
              className={tab === "purchase" ? "active" : ""}
              onClick={() => setTab("purchase")}
            >
              ประวัติซื้อสินค้า
            </button>
            <button
              role="tab"
              id="service-tab"
              aria-controls="service-history"
              aria-selected={tab === "service"}
              className={tab === "service" ? "active" : ""}
              onClick={() => setTab("service")}
            >
              ประวัติงานบริการ
            </button>
          </div>
          <div
            role="tabpanel"
            id={tab === "purchase" ? "purchase-history" : "service-history"}
            aria-labelledby={
              tab === "purchase" ? "purchase-tab" : "service-tab"
            }
          >
            {tab === "purchase" && (
              <p className="history-summary">
                คำสั่งซื้อ {orders.length} รายการ{" "}
                <span>
                  ยอดซื้อที่ชำระแล้ว{" "}
                  <strong className="numeric">{money(total)}</strong>
                </span>
              </p>
            )}
            {tab === "purchase" ? (
              orders.length ? (
                <div className="table-scroll">
                  <table className="history-table purchase-history-table">
                    <thead>
                      <tr>
                        <th>เลขที่</th>
                        <th>วันที่</th>
                        <th>สถานะ</th>
                        <th className="numeric">ยอดรวม</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => setOrder(order.id)}
                            >
                              {order.id}
                            </button>
                          </td>
                          <td>{dateText(order.createdAt)}</td>
                          <td>
                            <span className={`badge ${order.status}`}>
                              {orderLabels[order.status]}
                            </span>
                          </td>
                          <td className="numeric">
                            {money(orderTotal(order))}
                          </td>
                          <td>
                            <button
                              className="text-link"
                              aria-label={`ดู ${order.id}`}
                              onClick={() => setOrder(order.id)}
                            >
                              ดูคำสั่งซื้อ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="ยังไม่มีประวัติซื้อสินค้า"
                  detail="คำสั่งซื้อของลูกค้ารายนี้จะแสดงที่นี่"
                />
              )
            ) : jobs.length ? (
              <div className="table-scroll">
                <table className="history-table service-history-table">
                  <thead>
                    <tr>
                      <th>ประเภทงาน</th>
                      <th>วันที่ / เวลา</th>
                      <th>ช่าง</th>
                      <th>สถานะ</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td>{bookingTypeLabels[job.type]}</td>
                        <td>{dateText(job.start, "d MMM yy HH:mm")}</td>
                        <td>
                          {
                            state!.technicians.find(
                              (tech) => tech.id === job.technicianId,
                            )?.name
                          }
                        </td>
                        <td>
                          <span className={`badge ${job.status}`}>
                            {bookingLabels[job.status]}
                          </span>
                        </td>
                        <td>
                          <button
                            className="text-link"
                            aria-label={`ดู ${job.id}`}
                            onClick={() => setJob(job.id)}
                          >
                            ดูงาน
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="ยังไม่มีประวัติงานบริการ"
                detail="นัดหมายของลูกค้ารายนี้จะแสดงที่นี่"
              />
            )}
          </div>
        </Modal>
      )}
      {booking && (
        <BookingForm
          value={{ date: today, customerId }}
          onClose={() => setBooking(false)}
        />
      )}
      {order && <OrderDetail orderId={order} onClose={() => setOrder(null)} />}
      {job && <BookingDetail bookingId={job} onClose={() => setJob(null)} />}
    </>
  );
}
