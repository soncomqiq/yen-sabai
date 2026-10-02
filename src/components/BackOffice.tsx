import { createContext, useContext, useState, type ReactNode } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AirVent, LayoutDashboard, Package, ShoppingBag, CalendarDays, Users, LogOut, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react'
import type { Role, User } from '../domain/types'
import { roleLabels } from '../domain/types'
import { isScreenshotMode } from '../domain/rules'

interface Session { user: User; logout: () => void }
const SessionContext = createContext<Session | null>(null)
export function useSession() { return useContext(SessionContext)! }
function DemoBanner() {
  const location = useLocation()
  const hidden = isScreenshotMode({ search: window.location.search, hash: `#${location.pathname}${location.search}` })
  return hidden ? null : <div className="demo-banner">ระบบตัวอย่าง — ข้อมูลทั้งหมดเป็นข้อมูลสมมติ</div>
}
const navItems = [
  { path: 'dashboard', label: 'ภาพรวมร้าน', icon: LayoutDashboard },
  { path: 'products', label: 'สินค้าและสต็อก', icon: Package },
  { path: 'orders', label: 'คำสั่งซื้อ', icon: ShoppingBag },
  { path: 'bookings', label: 'ตารางงานช่าง', icon: CalendarDays },
  { path: 'customers', label: 'ลูกค้า', icon: Users },
]
function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<Role>('owner')
  const [error, setError] = useState('')
  return <div className="login-screen"><DemoBanner /><div className="login-grid">
    <section className="login-brand"><div className="brand-mark"><AirVent size={30} /></div><p className="eyebrow">YENSABAI · BACK OFFICE</p><h1>ร้านเย็นสบาย<br /><span>แอร์แอนด์เซอร์วิส</span></h1><p>ดูแลร้านให้ราบรื่น<br />ดูแลทุกความเย็นให้สบายใจ</p><img src={`${import.meta.env.BASE_URL}shop-scene.svg`} alt="เครื่องปรับอากาศและอุปกรณ์บริการของร้าน" className="shop-scene" /><div className="login-foot">งานขาย · สินค้า · ทีมช่าง</div></section>
    <section className="login-form"><div className="login-heading"><ShieldCheck /><span>พื้นที่จัดการร้าน</span></div><h2>ยินดีต้อนรับกลับ</h2><p className="muted">เข้าสู่ระบบร้านเย็นสบาย</p><form onSubmit={event => {
      event.preventDefault(); const values = new FormData(event.currentTarget)
      if (values.get('email') !== 'demo@yensabai.shop' || values.get('password') !== 'demo1234') { setError('ใช้บัญชี demo@yensabai.shop และรหัสผ่าน demo1234'); return }
      onLogin({ id: role, name: role === 'owner' ? 'คุณปริม' : role === 'admin' ? 'คุณมิน' : 'ช่างเอก', role, technicianId: role === 'technician' ? 'tech-1' : undefined })
    }}><label>อีเมล<input name="email" type="email" defaultValue="demo@yensabai.shop" required autoComplete="username" /></label><label>รหัสผ่าน<input name="password" type="password" defaultValue="demo1234" required autoComplete="current-password" /></label><fieldset><legend>เข้าใช้งานในบทบาท</legend><div className="role-options">{(['owner', 'admin', 'technician'] as Role[]).map(value => <label key={value} className={role === value ? 'selected' : ''}><input type="radio" name="role" checked={role === value} onChange={() => setRole(value)} />{roleLabels[value]}</label>)}</div></fieldset>{error && <p role="alert" className="error-message">{error}</p>}<button className="primary full" type="submit">เข้าสู่ระบบ <ArrowRight size={18} /></button></form><p className="login-note">บัญชีสาธิต · ไม่มีการเชื่อมต่อระบบจริง</p></section>
  </div></div>
}
function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useSession(); const [open, setOpen] = useState(false)
  const location = useLocation(); const title = navItems.find(item => location.pathname === `/${item.path}`)?.label ?? 'ภาพรวมร้าน'
  return <><DemoBanner /><div className="app-shell">{open && <button className="nav-backdrop" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'open' : ''}`}><NavLink to={user.role === 'technician' ? '/bookings' : '/dashboard'} className="brand"><span className="brand-mark"><AirVent size={26} /></span><span><strong>เย็นสบาย</strong><small>แอร์แอนด์เซอร์วิส</small></span></NavLink><button className="icon-button mobile-close" aria-label="ปิดเมนู" onClick={() => setOpen(false)}><X /></button><p className="nav-caption">จัดการร้าน</p><nav>{navItems.filter(item => user.role !== 'technician' || item.path === 'bookings').map(item => <NavLink key={item.path} to={`/${item.path}`} onClick={() => setOpen(false)}><item.icon size={20} /><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-bottom"><div className="shop-status"><span className="status-dot" /> ร้านเย็นสบาย <small>สาขาบางนา</small></div><button className="logout-button" onClick={logout}><LogOut size={18} />ออกจากระบบ</button></div></aside>
    <div className="workspace"><header className="app-header"><div className="header-left"><button className="icon-button mobile-menu" aria-label="เปิดเมนู" onClick={() => setOpen(true)}><Menu /></button><span className="breadcrumb">ร้านเย็นสบาย <span>/</span> <strong>{title}</strong></span></div><div className="user-chip"><span className="avatar">{user.name.slice(0, 1)}</span><span><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></span></div></header><main className="page">{children}</main><footer className="app-footer">เย็นสบาย แอร์แอนด์เซอร์วิส <span>Yensabai Back Office</span></footer></div>
  </div></>
}
export function PageHeading({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">ร้านเย็นสบาย</p><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div><div className="heading-actions">{actions}</div></div> }
export function EmptyState({ title = 'ยังไม่มีรายการ', detail = 'รายการใหม่จะแสดงที่นี่', action }: { title?: string; detail?: string; action?: ReactNode }) { return <div className="empty-state"><Package size={32} /><h3>{title}</h3><p>{detail}</p>{action}</div> }
export function Skeleton() { return <div className="skeleton-view" aria-label="กำลังโหลด" role="status"><div className="skeleton title" /><div className="skeleton-stats">{[0, 1, 2, 3].map(item => <div className="skeleton" key={item} />)}</div>{[0, 1, 2, 3, 4].map(item => <div className="skeleton row" key={item} />)}</div> }
function Placeholder({ title }: { title: string }) { return <><PageHeading title={title} /><section className="panel"><EmptyState detail="กำลังเตรียมข้อมูลร้าน" /></section></> }
export default function BackOffice() {
  const [user, setUser] = useState<User | null>(() => { try { const saved = JSON.parse(sessionStorage.getItem('yensabai-user') ?? 'null'); return saved && ['owner', 'admin', 'technician'].includes(saved.role) ? saved : null } catch { return null } })
  function login(value: User) { sessionStorage.setItem('yensabai-user', JSON.stringify(value)); setUser(value) }
  function logout() { sessionStorage.removeItem('yensabai-user'); setUser(null) }
  return <HashRouter>{!user ? <Routes><Route path="/login" element={<Login onLogin={login} />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes> : <SessionContext value={{ user, logout }}><Shell><Routes>{navItems.filter(item => user.role !== 'technician' || item.path === 'bookings').map(item => <Route key={item.path} path={`/${item.path}`} element={<Placeholder title={item.label} />} />)}<Route path="*" element={<Navigate to={user.role === 'technician' ? '/bookings' : '/dashboard'} replace />} /></Routes></Shell></SessionContext>}</HashRouter>
}