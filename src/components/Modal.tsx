import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useShop } from './DataProvider';
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    errorRef = useRef<HTMLDivElement>(null),
    id = useId();
  const { actionError, clearActionError } = useShop();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      clearActionError();
      document.body.style.overflow = overflow;
    };
  }, []);
  const isActive = ref.current === Array.from(document.querySelectorAll('dialog[open]')).at(-1);
  useEffect(() => { if (actionError && isActive) { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ block: 'nearest' }); } }, [actionError, isActive]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          aria-label="ปิดหน้าต่าง"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div className="modal-body">{actionError && isActive && <div ref={errorRef} tabIndex={-1} className="error-message" role="alert"><strong>บันทึกไม่ได้</strong><p>{actionError}</p></div>}{children}</div>
    </dialog>
  );
}
