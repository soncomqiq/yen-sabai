import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  HashRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AirVent,
  LayoutDashboard,
  Package,
  ShoppingBag,
  CalendarDays,
  Users,
  Menu,
  X,
} from "lucide-react";
import type { Role, User } from "../domain/types";
import { roleLabels } from "../domain/types";
import { isScreenshotMode } from "../domain/rules";
import { DataProvider } from "./DataProvider";
import Products from "../pages/Products";
import Orders from "../pages/Orders";
import Bookings from "../pages/Bookings";
import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import { canAccessPage } from "../domain/permissions";

interface Session {
  user: User;
  logout: () => void;
}
const SessionContext = createContext<Session | null>(null);
function useSession() {
  return useContext(SessionContext)!;
}
function DemoBanner() {
  const location = useLocation();
  const hidden = isScreenshotMode({
    search: window.location.search,
    hash: `#${location.pathname}${location.search}`,
  });
  return hidden ? null : (
    <div className="demo-banner">
      ระบบตัวอย่าง — ข้อมูลทั้งหมดเป็นข้อมูลสมมติ
    </div>
  );
}
const navItems = [
  { path: "dashboard", label: "ภาพรวมร้าน", icon: LayoutDashboard },
  { path: "products", label: "สินค้าและสต็อก", icon: Package },
  { path: "orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
  { path: "bookings", label: "ตารางงานช่าง", icon: CalendarDays },
  { path: "customers", label: "ลูกค้า", icon: Users },
];
function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<Role>("owner");
  const [error, setError] = useState("");
  return (
    <div className="login-screen">
      <DemoBanner />
      <div className="login-grid">
        <section className="login-brand">
          <div className="brand-mark">
            <AirVent size={28} />
          </div>
          <div>
            <h1>ร้านเย็นสบาย</h1>
            <p className="muted">แอร์แอนด์เซอร์วิส</p>
          </div>
        </section>
        <section className="login-form">
          <h2>เข้าสู่ระบบ</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              if (
                values.get("email") !== "demo@yensabai.shop" ||
                values.get("password") !== "demo1234"
              ) {
                setError("ใช้บัญชี demo@yensabai.shop และรหัสผ่าน demo1234");
                return;
              }
              onLogin({
                id: role,
                name:
                  role === "owner"
                    ? "คุณปริม"
                    : role === "admin"
                      ? "คุณมิน"
                      : "ช่างเอก",
                role,
                technicianId: role === "technician" ? "tech-1" : undefined,
              });
            }}
          >
            <label>
              อีเมล
              <input
                name="email"
                type="email"
                defaultValue="demo@yensabai.shop"
                required
                autoComplete="username"
              />
            </label>
            <label>
              รหัสผ่าน
              <input
                name="password"
                type="password"
                defaultValue="demo1234"
                required
                autoComplete="current-password"
              />
            </label>
            <fieldset>
              <legend>เข้าใช้งานในบทบาท</legend>
              <div className="role-options">
                {(["owner", "admin", "technician"] as Role[]).map((value) => (
                  <label
                    key={value}
                    className={role === value ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={role === value}
                      onChange={() => setRole(value)}
                    />
                    {roleLabels[value]}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <button className="primary full" type="submit">
              เข้าสู่ระบบ
            </button>
          </form>
          <p className="login-note">บัญชีสาธิต ข้อมูลทั้งหมดเป็นข้อมูลสมมติ</p>
        </section>
      </div>
    </div>
  );
}
function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 700px)").matches,
  );
  const navRef = useRef<HTMLElement>(null),
    menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const resize = () => setMobile(media.matches);
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const navigation = navRef.current!;
    const menu = menuRef.current;
    const controls = () =>
      Array.from(navigation.querySelectorAll<HTMLElement>("a,button")).filter(
        (element) => element.getClientRects().length > 0,
      );
    controls()[0]?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = controls(),
        first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    navigation.addEventListener("keydown", keyboard);
    return () => {
      navigation.removeEventListener("keydown", keyboard);
      menu?.focus();
    };
  }, [open, mobile]);
  const location = useLocation();
  const title =
    navItems.find((item) => location.pathname === `/${item.path}`)?.label ??
    "ภาพรวมร้าน";
  return (
    <>
      <DemoBanner />
      <div className="app-shell">
        {open && (
          <button
            className="nav-backdrop"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          ref={navRef}
          id="shop-navigation"
          className={`sidebar ${open ? "open" : ""}`}
          inert={mobile && !open}
          role={mobile && open ? "dialog" : undefined}
          aria-modal={mobile && open ? true : undefined}
          aria-label="เมนูร้าน"
        >
          <NavLink
            to={user.role === "technician" ? "/bookings" : "/dashboard"}
            className="brand"
          >
            <span className="brand-mark">
              <AirVent size={26} />
            </span>
            <span>
              <strong>เย็นสบาย</strong>
              <small>แอร์แอนด์เซอร์วิส</small>
            </span>
          </NavLink>
          <button
            className="icon-button mobile-close"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
          <nav>
            {navItems
              .filter((item) => canAccessPage(user.role, item.path))
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={`/${item.path}`}
                  onClick={() => setOpen(false)}
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="shop-status">
              สาขาบางนา
              <small>ระบบจัดการร้าน</small>
            </div>
            <button className="logout-button" onClick={logout}>
              ออกจากระบบ
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="app-header">
            <div className="header-left">
              <button
                ref={menuRef}
                className="icon-button mobile-menu"
                aria-label="เปิดเมนู"
                aria-expanded={open}
                aria-controls="shop-navigation"
                onClick={() => setOpen(true)}
              >
                <Menu />
              </button>
              <span className="breadcrumb">
                <strong>{title}</strong>
              </span>
            </div>
            <div className="user-chip">
              <span>
                <strong>{user.name}</strong>
                <small>{roleLabels[user.role]}</small>
              </span>
            </div>
          </header>
          <main className="page">{children}</main>
          <footer className="app-footer">
            เย็นสบาย แอร์แอนด์เซอร์วิส <span>Yensabai Back Office</span>
          </footer>
        </div>
      </div>
    </>
  );
}
export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function EmptyState({
  title = "ยังไม่มีรายการ",
  detail = "รายการใหม่จะแสดงที่นี่",
  action,
}: {
  title?: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="skeleton-view" aria-label="กำลังโหลด" role="status">
      <div className="skeleton title" />
      <div className="skeleton-stats">
        {[0, 1, 2, 3].map((item) => (
          <div className="skeleton" key={item} />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((item) => (
        <div className="skeleton row" key={item} />
      ))}
    </div>
  );
}
function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeading title={title} />
      <section className="panel">
        <EmptyState detail="กำลังเตรียมข้อมูลร้าน" />
      </section>
    </>
  );
}
export default function BackOffice() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("yensabai-user") ?? "null",
      );
      return saved && ["owner", "admin", "technician"].includes(saved.role)
        ? saved
        : null;
    } catch {
      return null;
    }
  });
  function login(value: User) {
    sessionStorage.setItem("yensabai-user", JSON.stringify(value));
    setUser(value);
  }
  function logout() {
    sessionStorage.removeItem("yensabai-user");
    setUser(null);
  }
  return (
    <HashRouter>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <SessionContext value={{ user, logout }}>
          <Shell>
            <DataProvider key={user.role} user={user}>
              <Routes>
                {navItems
                  .filter((item) => canAccessPage(user.role, item.path))
                  .map((item) => (
                    <Route
                      key={item.path}
                      path={`/${item.path}`}
                      element={
                        item.path === "dashboard" ? (
                          <Dashboard />
                        ) : item.path === "products" ? (
                          <Products />
                        ) : item.path === "orders" ? (
                          <Orders />
                        ) : item.path === "bookings" ? (
                          <Bookings />
                        ) : item.path === "customers" ? (
                          <Customers />
                        ) : (
                          <Placeholder title={item.label} />
                        )
                      }
                    />
                  ))}
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={
                        user.role === "technician" ? "/bookings" : "/dashboard"
                      }
                      replace
                    />
                  }
                />
              </Routes>
            </DataProvider>
          </Shell>
        </SessionContext>
      )}
    </HashRouter>
  );
}
