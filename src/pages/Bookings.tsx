import { useState } from "react";
import {
  addDays,
  addHours,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  Booking,
  BookingDraft,
  BookingType,
  BookingStatus,
} from "../domain/types";
import { bookingLabels, bookingTypeLabels } from "../domain/types";
import { useShop } from "../components/DataProvider";
import { PageHeading, Skeleton, EmptyState } from "../components/BackOffice";
import { Modal } from "../components/Modal";
import { dateText, localInput } from "../lib/format";
import "./calendar.css";

interface NewJob {
  date: Date;
  technicianId?: string;
}
export default function Bookings() {
  const { state, user } = useShop();
  const [today] = useState(() => new Date());
  const [date, setDate] = useState(() => startOfDay(new Date())),
    [mode, setMode] = useState<"week" | "day">("day"),
    [agenda, setAgenda] = useState(() => window.matchMedia('(max-width: 700px)').matches),
    [status, setStatus] = useState("all"),
    [detail, setDetail] = useState<string | null>(null),
    [editing, setEditing] = useState<Booking | NewJob | null>(null);
  if (!state) return <Skeleton />;
  const office = user.role !== "technician",
    start = mode === "week" ? startOfWeek(date, { weekStartsOn: 1 }) : date,
    days = Array.from({ length: mode === "week" ? 7 : 1 }, (_, index) =>
      addDays(start, index),
    );
  const jobs = state.bookings
    .filter(
      (job) =>
        days.some((day) => isSameDay(day, new Date(job.start))) &&
        (status === "all" || status === job.status),
    )
    .sort((left, right) => left.start.localeCompare(right.start));
  const customer = (id: string) =>
    state.customers.find((customer) => customer.id === id)?.name ?? "ลูกค้า";
  const calendarStyle = {
    gridTemplateColumns: `92px repeat(${state.technicians.length}, minmax(155px,1fr))`,
  };
  const earliest = Math.min(
      8,
      ...jobs.map((job) => new Date(job.start).getHours()),
    ),
    latest = Math.min(
      24,
      Math.max(
        19,
        ...jobs.map((job) =>
          Math.ceil(
            new Date(job.end).getHours() + new Date(job.end).getMinutes() / 60,
          ),
        ),
      ),
    );
  return (
    <>
      <PageHeading
        title={office ? "ตารางงานช่าง" : "งานของฉัน"}
        subtitle={
          office
            ? dateText(date, 'EEEE d MMMM yyyy')
            : `${user.name} งานที่ได้รับมอบหมาย`
        }
        actions={
          office && (
            <button className="primary" onClick={() => setEditing({ date })}>
              เพิ่มนัดหมาย
            </button>
          )
        }
      />
      <div className="calendar-summary">
        <span>
          {jobs.length} งานใน{mode === "week" ? "สัปดาห์" : "วัน"}นี้
        </span>
        <span className="calendar-legend">
          <i className="legend-dot scheduled" />
          นัดแล้ว
          <i className="legend-dot working" />
          กำลังทำ
          <i className="legend-dot done" />
          เสร็จ
        </span>
      </div>
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-navigation">
            <button
              className="icon-button"
              aria-label="ช่วงก่อนหน้า"
              onClick={() => setDate(addDays(date, mode === "week" ? -7 : -1))}
            >
              <ChevronLeft />
            </button>
            <button
              className="icon-button"
              aria-label="ช่วงถัดไป"
              onClick={() => setDate(addDays(date, mode === "week" ? 7 : 1))}
            >
              <ChevronRight />
            </button>
            <button
              className="secondary today-button"
              onClick={() => setDate(startOfDay(new Date()))}
            >
              วันนี้
            </button>
            <strong>
              {mode === "week"
                ? `${dateText(start, "d MMM")} – ${dateText(addDays(start, 6), "d MMM yyyy")}`
                : dateText(date, "d MMM yyyy")}
            </strong>
          </div>
          <div className="calendar-controls">
            <input
              type="date"
              aria-label="เลือกวันในตาราง"
              value={format(date, "yyyy-MM-dd")}
              onChange={(event) => {
                if (event.target.value)
                  setDate(new Date(`${event.target.value}T00:00:00`));
              }}
            />
            <select
              aria-label="สถานะงานช่าง"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">ทุกสถานะ</option>
              {Object.entries(bookingLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="segmented" role="group" aria-label="มุมมองตาราง">
              <button
                aria-pressed={mode === "week"}
                className={mode === "week" ? "active" : ""}
                onClick={() => { setMode("week"); setAgenda(false); }}
              >
                สัปดาห์
              </button>
              <button
                aria-pressed={mode === "day" && !agenda}
                className={mode === "day" && !agenda ? "active" : ""}
                onClick={() => { setMode("day"); setAgenda(false); }}
              >
                วัน
              </button>
              <button aria-pressed={agenda} className={agenda ? 'active' : ''} onClick={() => { setMode('day'); setAgenda(true); }}>รายการงาน</button>
            </div>
          </div>
        </div>
        {mode === 'week' && <div className="week-picker" aria-label="เลือกวันในสัปดาห์">{days.map(day => <button key={day.toISOString()} className={isSameDay(day, date) ? 'active' : ''} aria-pressed={isSameDay(day, date)} onClick={() => setDate(day)}>{dateText(day, 'EEE')}<strong>{dateText(day, 'd')}</strong></button>)}</div>}
        {agenda && <div className="booking-agenda">{jobs.filter(job => isSameDay(new Date(job.start), date)).map(job => <button key={job.id} className="agenda-row" onClick={() => setDetail(job.id)}><span className="agenda-time">{dateText(job.start, 'HH:mm')}–{dateText(job.end, 'HH:mm')}</span><strong>{customer(job.customerId)}</strong><span>{bookingTypeLabels[job.type]} {state.technicians.find(tech => tech.id === job.technicianId)?.name}</span><span className={`badge ${job.status}`}>{bookingLabels[job.status]}</span></button>)}</div>}
        <div className={`calendar-scroll ${agenda ? 'calendar-hidden' : ''}`}>
          <div
            className={`calendar-grid ${state.technicians.length === 1 ? "own-calendar" : ""}`}
          >
            <div className="calendar-columns" style={calendarStyle}>
              <div className="calendar-corner">
                เวลา
              </div>
              {state.technicians.map((tech) => (
                <div className="technician-heading" key={tech.id}>
                  <span>
                    <strong>{tech.name}</strong>
                    <small>
                      {
                        jobs.filter((job) => job.technicianId === tech.id && isSameDay(new Date(job.start), date))
                          .length
                      }{" "}
                      งาน
                    </small>
                  </span>
                </div>
              ))}
            </div>
              <div
                className="day-grid"
                style={{
                  ...calendarStyle,
                  height: `${(latest - earliest) * 60}px`,
                }}
              >
                {isSameDay(date, today) && today.getHours() >= earliest && today.getHours() < latest && <div className="current-time-rule" style={{ top: `${(today.getHours() - earliest) * 60 + today.getMinutes()}px` }}><span>ขณะนี้ {dateText(today, 'HH:mm')}</span></div>}
                <div className="time-column">
                  {Array.from({ length: latest - earliest }, (_, index) => (
                    <span key={index} style={{ top: `${index * 60}px` }}>
                      {String(earliest + index).padStart(2, "0")}:00
                    </span>
                  ))}
                </div>
                {state.technicians.map((tech) => (
                  <div className="day-technician" key={tech.id}>
                    <div className="time-rules" aria-hidden="true">{Array.from({ length: (latest - earliest) * 2 }, (_, index) => <i key={index} className={index % 2 === 0 ? 'hour-rule' : 'half-hour-rule'} style={{ top: `${index * 30}px` }} />)}</div>
                    {office && (
                      <button
                        className="add-day-job"
                        title="เพิ่มนัดหมาย"
                        aria-label={`นัด ${tech.name} ${dateText(date)}`}
                        onClick={() =>
                          setEditing({ date, technicianId: tech.id })
                        }
                      >
                        <Plus size={16} />
                      </button>
                    )}
                    {jobs
                      .filter((job) => job.technicianId === tech.id && isSameDay(new Date(job.start), date))
                      .map((job) => {
                        const startTime = new Date(job.start),
                          minutes =
                            (startTime.getHours() - earliest) * 60 +
                            startTime.getMinutes(),
                          duration =
                            (new Date(job.end).getTime() -
                              startTime.getTime()) /
                            60000;
                        return (
                          <button
                            className={`job-block day-job ${job.status}`}
                            data-compact={duration < 90}
                            key={job.id}
                            style={{
                              top: `${minutes}px`,
                              height: `${Math.max(2, duration)}px`,
                            }}
                            onClick={() => setDetail(job.id)}
                            title={`${dateText(job.start, "HH:mm")}–${dateText(job.end, "HH:mm")} ${bookingTypeLabels[job.type]} ${customer(job.customerId)}`}
                          >
                            <span className="job-time">
                              {dateText(job.start, "HH:mm")}–
                              {dateText(job.end, "HH:mm")}
                            </span>
                            <strong>{customer(job.customerId)}</strong>
                            <span>{bookingTypeLabels[job.type]}</span>
                            <small>{bookingLabels[job.status]}</small>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
          </div>
        </div>
        {jobs.length === 0 && (
          <EmptyState
            title="ไม่มีงานในช่วงนี้"
            detail={
              office
                ? "พร้อมสำหรับนัดหมายใหม่"
                : "ยังไม่มีงานที่มอบหมายในช่วงนี้"
            }
          />
        )}
      </section>
      {detail && (
        <BookingDetail
          bookingId={detail}
          onClose={() => setDetail(null)}
          onEdit={(job) => {
            setDetail(null);
            setEditing(job);
          }}
        />
      )}
      {editing && (
        <BookingForm value={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
export function BookingDetail({
  bookingId,
  onClose,
  onEdit,
}: {
  bookingId: string;
  onClose: () => void;
  onEdit?: (job: Booking) => void;
}) {
  const { state, user, service, busy, run } = useShop(),
    job = state!.bookings.find((job) => job.id === bookingId)!,
    customer = state!.customers.find(
      (customer) => customer.id === job.customerId,
    )!,
    tech = state!.technicians.find((tech) => tech.id === job.technicianId)!;
  const next: BookingStatus | null =
    job.status === "scheduled"
      ? "working"
      : job.status === "working"
        ? "done"
        : null;
  return (
    <Modal
      title="รายละเอียดนัดหมาย"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="booking-detail">
        <span className={`badge ${job.status}`}>
          {bookingLabels[job.status]}
        </span>
        <h3>{customer.name}</h3>
        <p>{bookingTypeLabels[job.type]}</p>
        <p>
          {dateText(job.start, "d MMM yyyy")} เวลา {dateText(job.start, "HH:mm")}–
          {dateText(job.end, "HH:mm")}
        </p>
        <p>
          {tech.name}
        </p>
        <p>
          <a href={`tel:${customer.phone}`}>{customer.phone}</a>
        </p>
        <p>
          {customer.address}
        </p>
        {job.orderId && (
          <p className="muted">อ้างอิงคำสั่งซื้อ {job.orderId}</p>
        )}
        <div className="detail-summary">
          <small className="muted">หมายเหตุ</small>
          <p>{job.notes || "ไม่มีหมายเหตุ"}</p>
        </div>
      </div>
      <div className="dialog-actions">
        {user.role !== "technician" && onEdit && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => onEdit(job)}
          >
            แก้ไขนัดหมาย
          </button>
        )}
        {next && (
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              run(
                () => service.transitionBooking(user, job.id, next),
                `เปลี่ยนเป็น ${bookingLabels[next]} แล้ว`,
              )
            }
          >
            {next === "working" ? "เริ่มงาน" : "บันทึกงานเสร็จ"}
          </button>
        )}
      </div>
    </Modal>
  );
}
function BookingForm({
  value,
  onClose,
}: {
  value: Booking | NewJob;
  onClose: () => void;
}) {
  const { state, user, service, busy, run } = useShop(),
    existing = "id" in value ? value : null;
  const [customer, setCustomer] = useState(existing?.customerId ?? ""),
    [order, setOrder] = useState(existing?.orderId ?? "");
  const start = existing
      ? new Date(existing.start)
      : addHours(startOfDay((value as NewJob).date), 9),
    end = existing ? new Date(existing.end) : addHours(start, 2);
  return (
    <Modal
      title={existing ? "แก้ไขนัดหมายและเวลา" : "เพิ่มนัดหมาย"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget),
            draft: BookingDraft = {
              id: existing?.id,
              customerId: customer,
              technicianId: String(values.get("technician")),
              orderId: order || undefined,
              type: values.get("type") as BookingType,
              start: new Date(String(values.get("start"))).toISOString(),
              end: new Date(String(values.get("end"))).toISOString(),
              notes: String(values.get("notes")),
            };
          if (
            await run(
              () => service.saveBooking(user, draft),
              existing
                ? "แก้ไขนัดหมายเรียบร้อยแล้ว"
                : "สร้างนัดหมายเรียบร้อยแล้ว",
            )
          )
            onClose();
        }}
      >
        <label>
          ลูกค้า
          <select
            required
            aria-label="ลูกค้า"
            value={customer}
            onChange={(event) => {
              setCustomer(event.target.value);
              setOrder("");
            }}
          >
            <option value="">เลือกลูกค้า</option>
            {state!.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} โทร {customer.phone}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            ประเภทงาน
            <select name="type" defaultValue={existing?.type ?? "installation"}>
              {Object.entries(bookingTypeLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            ช่างผู้รับผิดชอบ
            <select
              name="technician"
              aria-label="ช่างผู้รับผิดชอบ"
              defaultValue={value.technicianId ?? state!.technicians[0].id}
            >
              {state!.technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          เริ่มงาน
          <input
            type="datetime-local"
            name="start"
            required
            defaultValue={localInput(start)}
          />
        </label>
        <label>
          สิ้นสุดงาน
          <input
            type="datetime-local"
            name="end"
            required
            defaultValue={localInput(end)}
          />
        </label>
        <label>
          คำสั่งซื้ออ้างอิง (ไม่บังคับ)
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          >
            <option value="">ไม่ระบุ</option>
            {state!.orders
              .filter(
                (order) =>
                  order.customerId === customer && order.status !== "cancelled",
              )
              .map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id}
                </option>
              ))}
          </select>
        </label>
        <label>
          หมายเหตุ
          <textarea
            name="notes"
            rows={3}
            defaultValue={existing?.notes}
            maxLength={500}
            placeholder="รายละเอียดหน้างานหรือการติดต่อ"
          />
        </label>
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
            {busy ? "กำลังบันทึก…" : "บันทึกนัดหมาย"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
