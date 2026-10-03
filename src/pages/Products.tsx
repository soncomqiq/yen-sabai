import { useState } from "react";
import {
  Search,
  Pencil,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product, ProductDraft, Category } from "../domain/types";
import { useShop } from "../components/ShopContext";
import { EmptyState, PageHeading, Skeleton } from "../components/BackOffice";
import { Modal } from "../components/Modal";
import { money, number, dateText } from "../lib/format";
import { exportExcel } from "../lib/excel";
import "./products.css";

export default function Products() {
  const { state, user, service, run, busy, notify } = useShop();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [low, setLow] = useState(false),
    [sort, setSort] = useState("name"),
    [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | "new" | null>(null),
    [stock, setStock] = useState<{
      product: Product;
      mode: "in" | "out";
    } | null>(null),
    [history, setHistory] = useState<Product | null>(null);
  if (!state) return <Skeleton />;
  const products = state.products
    .filter(
      (product) =>
        `${product.name} ${product.sku}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (category === "all" || product.category === category) &&
        (!low || product.stock <= product.minimumStock),
    )
    .sort((left, right) =>
      sort === "stock"
        ? left.stock - right.stock
        : sort === "price"
          ? right.price - left.price
          : left.name.localeCompare(right.name, "th"),
    );
  const totalPages = Math.max(1, Math.ceil(products.length / 10)),
    currentPage = Math.min(page, totalPages);
  const lowCount = state.products.filter(
    (product) => product.stock <= product.minimumStock,
  ).length;
  async function download() {
    try {
      await exportExcel(
        "yensabai-products",
        [
          "รหัสสินค้า",
          "สินค้า",
          "หมวดหมู่",
          "ราคา (บาท)",
          "คงเหลือ",
          "ขั้นต่ำ",
          "หน่วย",
        ],
        products.map((product) => [
          product.sku,
          product.name,
          product.category === "aircon" ? "เครื่องปรับอากาศ" : "อะไหล่",
          product.price,
          product.stock,
          product.minimumStock,
          product.unit,
        ]),
      );
      notify("ส่งออกสินค้าเรียบร้อยแล้ว");
    } catch {
      notify("ส่งออกไม่สำเร็จ กรุณาลองอีกครั้ง", true);
    }
  }
  return (
    <>
      <PageHeading
        title="สินค้าและสต็อก"
        subtitle={
          low
            ? `สินค้าถึงจุดสั่งซื้อ ${lowCount} รายการ`
            : `สินค้าทั้งหมด ${state.products.length} รายการ`
        }
        actions={
          <>
            <button className="secondary" onClick={download}>
              ส่งออก Excel
            </button>
            <button className="primary" onClick={() => setEditing("new")}>
              เพิ่มสินค้า
            </button>
          </>
        }
      />
      <p className="list-summary">
        คงเหลือรวม{" "}
        {number(
          state.products.reduce((sum, product) => sum + product.stock, 0),
        )}{" "}
        หน่วย{" "}
        <button
          className="text-link"
          onClick={() => {
            setLow(!low);
            setPage(1);
          }}
        >
          {low ? "ดูสินค้าทั้งหมด" : `ถึงจุดสั่งซื้อ ${lowCount} รายการ`}
        </button>
      </p>
      <section className="panel">
        <div className="list-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="ค้นหาสินค้า"
              placeholder="ค้นหาชื่อหรือรหัสสินค้า…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="หมวดหมู่สินค้า"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">ทุกหมวดหมู่</option>
            <option value="aircon">เครื่องปรับอากาศ</option>
            <option value="parts">อะไหล่และอุปกรณ์</option>
          </select>
          <select
            aria-label="เรียงสินค้า"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="name">เรียง: ชื่อสินค้า</option>
            <option value="stock">เรียง: คงเหลือน้อยสุด</option>
            <option value="price">เรียง: ราคาสูงสุด</option>
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={low}
              onChange={(event) => {
                setLow(event.target.checked);
                setPage(1);
              }}
            />
            สต็อกต่ำ
          </label>
        </div>
        {products.length ? (
          <>
            <div className="table-scroll">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th>หมวดหมู่</th>
                    <th className="numeric">ราคา</th>
                    <th className="numeric">คงเหลือ / ขั้นต่ำ</th>
                    <th>สถานะสต็อก</th>
                    <th className="action-cell">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .slice((currentPage - 1) * 10, currentPage * 10)
                    .map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <span
                              className={`product-image ${product.category}`}
                            >
                              <img
                                src={`${import.meta.env.BASE_URL}${product.category === "aircon" ? "aircon" : "parts"}.png`}
                                alt=""
                              />
                            </span>
                            <span>
                              <strong>{product.name}</strong>
                              <small>
                                {product.sku} หน่วย: {product.unit}
                              </small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="category-label">
                            {product.category === "aircon"
                              ? "เครื่องปรับอากาศ"
                              : "อะไหล่"}
                          </span>
                        </td>
                        <td className="numeric">{money(product.price)}</td>
                        <td className="numeric">
                          <strong>{product.stock}</strong>
                          <span className="muted">
                            {" "}
                            / {product.minimumStock}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${product.stock <= product.minimumStock ? "warning" : "success"}`}
                          >
                            {product.stock === 0
                              ? "สินค้าหมด"
                              : product.stock <= product.minimumStock
                                ? "สต็อกต่ำ"
                                : "พร้อมขาย"}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              title="แก้ไขสินค้า"
                              aria-label={`แก้ไข ${product.sku}`}
                              onClick={() => setEditing(product)}
                            >
                              <Pencil />
                            </button>
                            <button
                              className="stock-action"
                              title="รับเข้า"
                              aria-label={`รับเข้า ${product.sku}`}
                              onClick={() => setStock({ product, mode: "in" })}
                            >
                              รับเข้า
                            </button>
                            <button
                              className="stock-action"
                              title="เบิกออก"
                              aria-label={`เบิกออก ${product.sku}`}
                              onClick={() => setStock({ product, mode: "out" })}
                            >
                              เบิกออก
                            </button>
                            <button
                              className="icon-button"
                              title="ประวัติสต็อก"
                              aria-label={`ประวัติ ${product.sku}`}
                              onClick={() => setHistory(product)}
                            >
                              <History />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                แสดง {(currentPage - 1) * 10 + 1}–
                {Math.min(currentPage * 10, products.length)} จาก{" "}
                {products.length} รายการ
              </span>
              <div className="pagination">
                <button
                  className="icon-button"
                  aria-label="หน้าก่อนหน้า"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft />
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="icon-button"
                  aria-label="หน้าถัดไป"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="ไม่พบสินค้า"
            detail="ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
            action={
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setLow(false);
                }}
              >
                ล้างตัวกรอง
              </button>
            }
          />
        )}
      </section>
      {editing && (
        <ProductForm
          product={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {stock && (
        <Modal
          title={
            stock.mode === "in" ? "รับสินค้าเข้าสต็อก" : "เบิกสินค้าออกจากสต็อก"
          }
          onClose={() => {
            if (!busy) setStock(null);
          }}
        >
          <div className="detail-summary">
            <strong>{stock.product.name}</strong>
            <p className="muted">
              {stock.product.sku} คงเหลือ {stock.product.stock}{" "}
              {stock.product.unit}
            </p>
          </div>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              if (
                await run(
                  () =>
                    service.moveStock(
                      user,
                      stock.product.id,
                      Number(values.get("quantity")) *
                        (stock.mode === "in" ? 1 : -1),
                      String(values.get("reason")),
                    ),
                  stock.mode === "in"
                    ? "รับสินค้าเข้าเรียบร้อย"
                    : "เบิกสินค้าออกเรียบร้อย",
                )
              )
                setStock(null);
            }}
          >
            <label>
              จำนวน ({stock.product.unit})
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                defaultValue="1"
                required
              />
            </label>
            <label>
              เหตุผล / เลขที่อ้างอิง
              <input
                name="reason"
                required
                placeholder={
                  stock.mode === "in"
                    ? "เช่น รับจากผู้จำหน่าย PO-001"
                    : "เช่น เบิกสำหรับงานซ่อม"
                }
                maxLength={200}
              />
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setStock(null)}
              >
                ยกเลิกการแก้ไข
              </button>
              <button className="primary" disabled={busy}>
                {busy
                  ? "กำลังบันทึก…"
                  : stock.mode === "in"
                    ? "บันทึกรับเข้า"
                    : "บันทึกเบิกออก"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {history && (
        <Modal
          title={`ประวัติสต็อก ${history.sku}`}
          onClose={() => setHistory(null)}
          wide
        >
          <p className="dialog-copy">{history.name}</p>
          <div className="table-scroll">
            <table className="stock-history-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>รายการ</th>
                  <th>อ้างอิง</th>
                  <th className="numeric">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {state.movements
                  .filter((move) => move.productId === history.id)
                  .sort((left, right) =>
                    right.createdAt.localeCompare(left.createdAt),
                  )
                  .map((move) => (
                    <tr key={move.id}>
                      <td>{dateText(move.createdAt, "d MMM yy HH:mm")}</td>
                      <td>{move.reason}</td>
                      <td>{move.orderId ?? "—"}</td>
                      <td
                        className={`numeric ${move.delta > 0 ? "text-success" : "stock-decrease"}`}
                      >
                        {move.delta > 0 ? "+" : ""}
                        {move.delta}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!state.movements.some((move) => move.productId === history.id) && (
              <EmptyState
                title="ยังไม่มีความเคลื่อนไหว"
                detail="รับเข้าหรือเบิกออกเพื่อเริ่มประวัติสต็อก"
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
function ProductForm({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const { user, service, run, busy } = useShop();
  return (
    <Modal
      title={product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget),
            draft: ProductDraft = {
              id: product?.id,
              sku: String(values.get("sku")),
              name: String(values.get("name")),
              category: values.get("category") as Category,
              unit: String(values.get("unit")),
              price: Number(values.get("price")),
              minimumStock: Number(values.get("minimumStock")),
            };
          if (await run(() => service.saveProduct(user, draft))) onClose();
        }}
      >
        <div className="form-grid">
          <label>
            รหัสสินค้า
            <input
              name="sku"
              defaultValue={product?.sku}
              required
              maxLength={30}
            />
          </label>
          <label>
            หมวดหมู่
            <select
              name="category"
              defaultValue={product?.category ?? "aircon"}
            >
              <option value="aircon">เครื่องปรับอากาศ</option>
              <option value="parts">อะไหล่และอุปกรณ์</option>
            </select>
          </label>
        </div>
        <label>
          ชื่อสินค้า
          <input
            name="name"
            defaultValue={product?.name}
            required
            maxLength={120}
          />
        </label>
        <div className="form-grid">
          <label>
            ราคาขาย (บาท)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={product?.price ?? 0}
            />
          </label>
          <label>
            หน่วยนับ
            <input
              name="unit"
              required
              defaultValue={product?.unit ?? "เครื่อง"}
              maxLength={20}
            />
          </label>
        </div>
        <label>
          สต็อกขั้นต่ำ
          <input
            name="minimumStock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.minimumStock ?? 5}
          />
        </label>
        {!product && (
          <p className="form-note">
            สินค้าใหม่เริ่มต้นที่ 0 หน่วย รับสินค้าเข้าได้หลังบันทึก
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onClose}
          >
            ยกเลิกการแก้ไข
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "กำลังบันทึก…" : "บันทึกสินค้า"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
