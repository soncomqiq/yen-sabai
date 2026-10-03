import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { OrderStatus, OrderDraft } from "../domain/types";
import { orderLabels, orderTotal } from "../domain/types";
import { transitions } from "../domain/rules";
import { useShop } from "../components/ShopContext";
import { PageHeading, Skeleton, EmptyState } from "../components/BackOffice";
import { Modal } from "../components/Modal";
import { dateText, money } from "../lib/format";
import { exportExcel } from "../lib/excel";
import { QuotationDialog } from "../components/QuotationDialog";
import "./orders.css";

export default function Orders() {
  const { state, notify } = useShop();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    [creating, setCreating] = useState(false),
    [detail, setDetail] = useState<string | null>(null);
  if (!state) return <Skeleton />;
  const customerName = (id: string) =>
    state.customers.find((customer) => customer.id === id)?.name ??
    "ไม่พบลูกค้า";
  const filtered = state.orders
    .filter(
      (order) =>
        `${order.id} ${customerName(order.customerId)}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "all" || order.status === status) &&
        (!from || new Date(order.createdAt) >= new Date(`${from}T00:00:00`)) &&
        (!to || new Date(order.createdAt) <= new Date(`${to}T23:59:59.999`)),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)),
    current = Math.min(page, pages);
  async function download() {
    try {
      await exportExcel(
        "yensabai-orders",
        ["เลขที่", "ลูกค้า", "วันที่", "สถานะ", "ยอดรวม (บาท)", "สินค้า"],
        filtered.map((order) => [
          order.id,
          customerName(order.customerId),
          dateText(order.createdAt, "yyyy-MM-dd HH:mm"),
          orderLabels[order.status],
          orderTotal(order),
          order.items
            .map((item) => `${item.name} × ${item.quantity}`)
            .join("; "),
        ]),
      );
      notify("ส่งออกคำสั่งซื้อเรียบร้อยแล้ว");
    } catch {
      notify("ส่งออกไม่สำเร็จ กรุณาลองอีกครั้ง", true);
    }
  }
  return (
    <>
      <PageHeading
        title="คำสั่งซื้อ"
        subtitle={
          status === "all"
            ? `คำสั่งซื้อทั้งหมด ${state.orders.length} รายการ`
            : `พบ ${filtered.length} รายการที่${orderLabels[status as OrderStatus]}`
        }
        actions={
          <>
            <button className="secondary" onClick={download}>
              ส่งออก Excel
            </button>
            <button className="primary" onClick={() => setCreating(true)}>
              สร้างคำสั่งซื้อ
            </button>
          </>
        }
      />
      <p className="list-summary">
        รอดำเนินการ{" "}
        {
          state.orders.filter(
            (order) => !["completed", "cancelled"].includes(order.status),
          ).length
        }{" "}
        รายการ{" "}
        <span>
          ส่งมอบสำเร็จ{" "}
          {state.orders.filter((order) => order.status === "completed").length}{" "}
          รายการ
        </span>
      </p>
      <section className="panel">
        <div className="list-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="ค้นหาคำสั่งซื้อ"
              placeholder="ค้นหาเลขที่หรือลูกค้า…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="สถานะคำสั่งซื้อ"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">ทุกสถานะ</option>
            {Object.entries(orderLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="date-range">
            <label>
              ตั้งแต่
              <input
                type="date"
                aria-label="วันที่เริ่มต้น"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <span>–</span>
            <label>
              ถึง
              <input
                type="date"
                aria-label="วันที่สิ้นสุด"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
        </div>
        {filtered.length ? (
          <>
            <div className="table-scroll">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>เลขที่คำสั่งซื้อ</th>
                    <th>ลูกค้า</th>
                    <th>วันที่</th>
                    <th>สถานะ</th>
                    <th className="numeric">ยอดรวม</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice((current - 1) * 10, current * 10)
                    .map((order) => (
                      <tr key={order.id}>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => setDetail(order.id)}
                          >
                            {order.id}
                          </button>
                          <small className="cell-sub">
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0,
                            )}{" "}
                            หน่วย
                          </small>
                        </td>
                        <td>
                          <strong>{customerName(order.customerId)}</strong>
                        </td>
                        <td>{dateText(order.createdAt)}</td>
                        <td>
                          <span className={`badge ${order.status}`}>
                            {orderLabels[order.status]}
                          </span>
                        </td>
                        <td className="numeric">{money(orderTotal(order))}</td>
                        <td className="action-cell">
                          <button
                            className="text-link"
                            aria-label={`รายละเอียด ${order.id}`}
                            title="ดูรายละเอียด"
                            onClick={() => setDetail(order.id)}
                          >
                            รายละเอียด
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
                รายการ
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
            title="ไม่พบคำสั่งซื้อ"
            detail="ลองเปลี่ยนคำค้นหาหรือช่วงวันที่"
            action={
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setFrom("");
                  setTo("");
                }}
              >
                ล้างตัวกรอง
              </button>
            }
          />
        )}
      </section>
      {creating && (
        <OrderForm onClose={() => setCreating(false)} onCreated={setDetail} />
      )}
      {detail && (
        <OrderDetail orderId={detail} onClose={() => setDetail(null)} />
      )}
    </>
  );
}
function OrderForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { state, service, user, busy, run } = useShop();
  const [customer, setCustomer] = useState(""),
    [items, setItems] = useState([
      { key: crypto.randomUUID(), productId: "", quantity: 1 },
    ]);
  const total = items.reduce(
    (sum, item) =>
      sum +
      (state!.products.find((product) => product.id === item.productId)
        ?.price ?? 0) *
        item.quantity,
    0,
  );
  return (
    <Modal
      title="สร้างคำสั่งซื้อ"
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const draft: OrderDraft = {
            customerId: customer,
            items: items.map(({ productId, quantity }) => ({
              productId,
              quantity,
            })),
          };
          let id = "";
          if (
            await run(async () => {
              id = await service.createOrder(user, draft);
            }, "สร้างคำสั่งซื้อและตัดสต็อกแล้ว")
          ) {
            onClose();
            onCreated(id);
          }
        }}
      >
        <label>
          ลูกค้า
          <select
            required
            aria-label="ลูกค้า"
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
          >
            <option value="">เลือกลูกค้า</option>
            {state!.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} โทร {customer.phone}
              </option>
            ))}
          </select>
        </label>
        <div className="order-lines">
          {items.map((item, index) => {
            const product = state!.products.find(
              (product) => product.id === item.productId,
            );
            return (
              <div className="order-line" key={item.key}>
                <label>
                  สินค้า {index + 1}
                  <select
                    required
                    aria-label={`สินค้า ${index + 1}`}
                    value={item.productId}
                    onChange={(event) =>
                      setItems(
                        items.map((value) =>
                          value.key === item.key
                            ? { ...value, productId: event.target.value }
                            : value,
                        ),
                      )
                    }
                  >
                    <option value="">เลือกสินค้า</option>
                    {state!.products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={product.stock === 0}
                      >
                        {product.name} เหลือ {product.stock}
                      </option>
                    ))}
                  </select>
                  {product && (
                    <span className="selected-product">
                      <strong>{product.name}</strong>
                      <small className="muted">
                        {money(product.price)} / {product.unit} คงเหลือ{" "}
                        {product.stock}
                      </small>
                    </span>
                  )}
                </label>
                <label>
                  จำนวน
                  <input
                    type="number"
                    aria-label={`จำนวนสินค้า ${index + 1}`}
                    min="1"
                    step="1"
                    required
                    value={item.quantity || ""}
                    onChange={(event) =>
                      setItems(
                        items.map((value) =>
                          value.key === item.key
                            ? { ...value, quantity: Number(event.target.value) }
                            : value,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  className="icon-button"
                  type="button"
                  disabled={items.length === 1}
                  title="ลบสินค้า"
                  aria-label={`ลบสินค้า ${index + 1}`}
                  onClick={() =>
                    setItems(items.filter((value) => value.key !== item.key))
                  }
                >
                  <Trash2 />
                </button>
              </div>
            );
          })}
        </div>
        <button
          className="secondary"
          type="button"
          onClick={() =>
            setItems([
              ...items,
              { key: crypto.randomUUID(), productId: "", quantity: 1 },
            ])
          }
        >
          เพิ่มรายการสินค้า
        </button>
        <div className="order-total">
          <span>ยอดรวมทั้งหมด</span>
          <strong>{money(total)}</strong>
        </div>
        <p className="form-note">
          สต็อกจะถูกตัดทันทีที่สร้างคำสั่งซื้อ และคืนเมื่อยกเลิก
        </p>
        <div className="dialog-actions">
          <button
            className="secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            ยกเลิกการแก้ไข
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "กำลังบันทึก…" : "สร้างคำสั่งซื้อ"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function OrderDetail({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const { state, user, service, busy, run } = useShop(),
    [cancel, setCancel] = useState(false),
    [quotation, setQuotation] = useState(false);
  const order = state!.orders.find((order) => order.id === orderId)!,
    customer = state!.customers.find(
      (customer) => customer.id === order.customerId,
    )!;
  const steps: OrderStatus[] =
    order.status === "cancelled"
      ? order.timeline.map((step) => step.status)
      : ["pending", "paid", "fulfillment", "completed"];
  return (
    <>
      {!quotation && !cancel && (
        <Modal
          title={`คำสั่งซื้อ ${order.id}`}
          onClose={() => {
            if (!busy) onClose();
          }}
          wide
        >
          <div className="order-detail-head">
            <div>
              <strong>{customer.name}</strong>
              <p className="muted">{customer.phone}</p>
              <p className="muted">{customer.address}</p>
            </div>
            <div>
              <span className={`badge ${order.status}`}>
                {orderLabels[order.status]}
              </span>
              <p className="muted">
                {dateText(order.createdAt, "d MMM yyyy HH:mm")}
              </p>
            </div>
          </div>
          <div className="quotation-action">
            <button className="secondary" onClick={() => setQuotation(true)}>
              ใบเสนอราคา PDF
            </button>
          </div>
          <ol className="timeline">
            {steps.map((step, index) => {
              const event = order.timeline.find(
                (event) => event.status === step,
              );
              return (
                <li key={`${step}-${index}`} className={event ? "reached" : ""}>
                  <span className="timeline-marker">{index + 1}</span>
                  <strong>{orderLabels[step]}</strong>
                  <small>
                    {event ? dateText(event.at, "d MMM HH:mm") : "รอดำเนินการ"}
                  </small>
                </li>
              );
            })}
          </ol>
          <div className="table-scroll">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th className="numeric">จำนวน</th>
                  <th className="numeric">ราคาต่อหน่วย</th>
                  <th className="numeric">รวม</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="wrap-cell">{item.name}</td>
                    <td className="numeric">{item.quantity}</td>
                    <td className="numeric">{money(item.unitPrice)}</td>
                    <td className="numeric">
                      {money(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="order-total">
            <span>ยอดรวมทั้งหมด</span>
            <strong>{money(orderTotal(order))}</strong>
          </div>
          <div className="dialog-actions">
            {transitions[order.status].includes("cancelled") && (
              <button
                className="danger"
                disabled={busy}
                onClick={() => setCancel(true)}
              >
                ยกเลิกคำสั่งซื้อ
              </button>
            )}
            {transitions[order.status]
              .filter((status) => status !== "cancelled")
              .map((status) => (
                <button
                  key={status}
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => service.transitionOrder(user, order.id, status),
                      `เปลี่ยนเป็น ${orderLabels[status]} แล้ว`,
                    )
                  }
                >
                  {status === "paid"
                    ? "บันทึกการชำระเงิน"
                    : status === "fulfillment"
                      ? "เตรียมติดตั้งหรือจัดส่ง"
                      : "บันทึกการส่งมอบ"}
                </button>
              ))}
          </div>
        </Modal>
      )}
      {quotation && (
        <QuotationDialog
          order={order}
          customer={customer}
          onClose={() => setQuotation(false)}
        />
      )}
      {cancel && (
        <Modal
          title="ยกเลิกคำสั่งซื้อ?"
          onClose={() => {
            if (!busy) setCancel(false);
          }}
        >
          <p className="dialog-copy">
            คำสั่งซื้อ {order.id} จะถูกยกเลิกและสินค้าทั้งหมดจะคืนเข้าสู่สต็อก
            ไม่สามารถย้อนกลับรายการนี้ได้
          </p>
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setCancel(false)}
            >
              ไม่ยกเลิกคำสั่งซื้อ
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () => service.transitionOrder(user, order.id, "cancelled"),
                    "ยกเลิกคำสั่งซื้อและคืนสต็อกแล้ว",
                  )
                )
                  setCancel(false);
              }}
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
