import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, X, RefreshCw } from "lucide-react";
import type { ShopState, User } from "../domain/types";
import type { ShopService } from "../services/interface";
import { createShopService } from "../services";
import { Modal } from "./Modal";

interface ShopContextValue {
  user: User;
  state: ShopState | null;
  service: ShopService;
  busy: boolean;
  error: string;
  run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}
const ShopContext = createContext<ShopContextValue | null>(null);
export function useShop() {
  return useContext(ShopContext)!;
}
export function DataProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const [service] = useState(createShopService),
    [state, setState] = useState<ShopState | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState<{
      id: number;
      message: string;
      error: boolean;
    } | null>(null),
    [resetOpen, setResetOpen] = useState(false);
  async function refresh() {
    setState(await service.snapshot(user));
    setError("");
  }
  useEffect(() => {
    let active = true;
    service
      .snapshot(user)
      .then((value) => {
        if (active) setState(value);
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [service, user]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.error ? 6500 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  function notify(message: string, failure = false) {
    setToast({ id: Date.now(), message, error: failure });
  }
  async function run(
    action: () => Promise<unknown>,
    message = "บันทึกเรียบร้อยแล้ว",
  ) {
    if (busy) return false;
    setBusy(true);
    try {
      await action();
      await refresh();
      notify(message);
      return true;
    } catch (reason) {
      notify(
        reason instanceof Error
          ? reason.message
          : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
        true,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <ShopContext
      value={{ user, state, service, busy, error, run, refresh, notify }}
    >
      {error ? (
        <div className="error-panel" role="alert">
          <AlertCircle />
          <h2>โหลดข้อมูลไม่สำเร็จ</h2>
          <p>{error}</p>
          <button
            className="secondary"
            onClick={() =>
              refresh().catch((reason) => setError(reason.message))
            }
          >
            <RefreshCw size={16} />
            ลองอีกครั้ง
          </button>
          {user.role === "owner" && (
            <button className="danger" onClick={() => setResetOpen(true)}>
              รีเซ็ตข้อมูล
            </button>
          )}
        </div>
      ) : (
        children
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "toast-error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
          <button aria-label="ปิดข้อความ" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      {resetOpen && (
        <Modal
          title="รีเซ็ตข้อมูลตัวอย่าง?"
          onClose={() => setResetOpen(false)}
        >
          <p className="dialog-copy">
            ข้อมูลที่แก้ไขทั้งหมดจะถูกแทนที่ด้วยข้อมูลสมมติชุดใหม่
          </p>
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setResetOpen(false)}
            >
              กลับ
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                if (await run(() => service.reset(user), "รีเซ็ตข้อมูลแล้ว"))
                  setResetOpen(false);
              }}
            >
              ยืนยันรีเซ็ต
            </button>
          </div>
        </Modal>
      )}
    </ShopContext>
  );
}
