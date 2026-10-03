import { useEffect, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import type { Customer, Order } from "../domain/types";
import { prepareQuotation } from "../lib/quotation";
import { Modal } from "./Modal";
import { useShop } from "./ShopContext";
import "./quotation.css";
export function QuotationDialog({
  order,
  customer,
  onClose,
}: {
  order: Order;
  customer: Customer;
  onClose: () => void;
}) {
  const [document, setDocument] = useState<Awaited<
      ReturnType<typeof prepareQuotation>
    > | null>(null),
    [error, setError] = useState("");
  const { notify } = useShop();
  useEffect(() => {
    let active = true;
    prepareQuotation(order, customer)
      .then((value) => {
        if (active) setDocument(value);
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [order, customer]);
  return (
    <Modal title={`ใบเสนอราคา · ${order.id}`} onClose={onClose} wide>
      {error ? (
        <p role="alert" className="error-message">
          {error}
        </p>
      ) : document ? (
        <div className="quotation-pages">
          {document.previews.map((preview, index) => (
            <img
              className="quotation-preview"
              src={preview}
              key={index}
              alt={`ใบเสนอราคาภาษาไทย หน้า ${index + 1}`}
            />
          ))}
        </div>
      ) : (
        <div className="pdf-loading" role="status">
          <LoaderCircle size={22} />
          กำลังจัดเตรียมใบเสนอราคา…
        </div>
      )}
      <div className="dialog-actions">
        <button className="secondary" onClick={onClose}>
          กลับ
        </button>
        <button
          className="primary"
          disabled={!document}
          onClick={() => {
            if (!document) return;
            const url = URL.createObjectURL(document.blob),
              anchor = window.document.createElement("a");
            anchor.href = url;
            anchor.download = `quotation-${order.id}.pdf`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            notify("ดาวน์โหลดใบเสนอราคาแล้ว");
          }}
        >
          <Download size={16} />
          ดาวน์โหลด PDF
        </button>
      </div>
    </Modal>
  );
}
