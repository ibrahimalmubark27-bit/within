import { SALON, formatQAR, type Service } from "./data";
import type { Lang } from "./i18n";

/** Current wall-clock time in Doha (Asia/Qatar, UTC+3, no DST). */
export function qatarNow(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: "Asia/Qatar" });
  return new Date(s);
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Key used for occupancy & manual blocking: "YYYY-MM-DD|HH:MM" */
export function slotKey(date: Date, time: string) {
  const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${d}|${time}`;
}

export interface Slot {
  time: string; // HH:MM
  hour: number;
  minute: number;
  available: boolean;
}

/** Sat–Thu 10:00–22:00, Fri 14:00–22:00.
 *  A slot closes automatically once `capacity` live bookings share it. */
export function getSlots(
  date: Date,
  occupancy: Record<string, number>,
  capacity: number,
  blocked: Set<string>,
  rules: { hour: number; capacity: number }[] = [],
): Slot[] {
  const isFriday = date.getDay() === 5;
  const start = isFriday ? 14 : 10;
  const end = 21; // last start 21:00
  const now = qatarNow();
  const today = sameDay(date, now);
  const cap = Math.max(1, capacity || 1);
  const out: Slot[] = [];
  for (let h = start; h <= end; h++) {
    for (const m of [0, 30]) {
      if (h === end && m === 30) continue;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const key = slotKey(date, time);
      const taken = occupancy[key] ?? 0;
      const rule = rules.find((r) => r.hour === h);
      const full = taken >= Math.max(1, rule ? rule.capacity : cap);
      const isBlocked = blocked.has(key);
      const past = today && (h < now.getHours() + 1 || (h === now.getHours() + 1 && m < now.getMinutes()));
      out.push({ time, hour: h, minute: m, available: !full && !isBlocked && !past });
    }
  }
  return out;
}

export function makeReference(): string {
  const year = qatarNow().getFullYear();
  const n = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, "0");
  return `WTN-${year}-${n}`;
}

export function formatLongDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === "ar" ? "ar-QA-u-nu-latn" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Temporary: checkout happens via WhatsApp only (payment UI disabled). */
export const PAYMENTS_ENABLED = false;

export interface BookingSummary {
  ref: string;
  services: Service[];
  artisanName: string;
  date: Date;
  time: string;
  duration: number;
  total: number;
  deposit: "half" | "full";
  name: string;
  phone: string; // 8 digits
  notes: string;
}

export function whatsappMessage(b: BookingSummary, lang: Lang, durationLabel: string) {
  const due = b.deposit === "half" ? Math.round(b.total / 2) : b.total;
  const svc = b.services.map((s) => `• ${lang === "ar" ? s.nameAr : s.name} — ${formatQAR(s.price, lang)}`).join("\n");
  const dateStr = formatLongDate(b.date, lang);
  if (lang === "ar") {
    return [
      `مرحباً within ✨`,
      `أودّ تأكيد موعدي في الأتيليه.`,
      ``,
      `رقم الحجز: ${b.ref}`,
      `الاسم: ${b.name}`,
      `الهاتف: +974 ${b.phone}`,
      ``,
      `الخدمات:`,
      svc,
      ``,
      `الموعد: ${dateStr} — ${b.time} (بتوقيت قطر)`,
      `الخبيرة: ${b.artisanName}`,
      `المدة: ${durationLabel}`,
      `الإجمالي: ${formatQAR(b.total, lang)}`,
      ...(PAYMENTS_ENABLED ? [`المقدّم: ${b.deposit === "half" ? "٥٠٪" : "كامل المبلغ"} (${formatQAR(due, lang)})`] : []),
      b.notes ? `\nطلبات خاصة: ${b.notes}` : ``,
    ].join("\n");
  }
  return [
    `Hello within ✨`,
    `I'd like to confirm my atelier appointment.`,
    ``,
    `Reference: ${b.ref}`,
    `Guest: ${b.name}`,
    `Phone: +974 ${b.phone}`,
    ``,
    `Treatments:`,
    svc,
    ``,
    `When: ${dateStr} — ${b.time} (Doha time)`,
    `Artisan: ${b.artisanName}`,
    `Duration: ${durationLabel}`,
    `Total: ${formatQAR(b.total, lang)}`,
    ...(PAYMENTS_ENABLED ? [`Deposit: ${b.deposit === "half" ? "50%" : "Paid in full"} (${formatQAR(due, lang)})`] : []),
    b.notes ? `\nSpecial requests: ${b.notes}` : ``,
  ].join("\n");
}

/** Device-aware WhatsApp link:
 *  – touch devices open the WhatsApp app directly (whatsapp://) — never blocked
 *  – desktop uses the web click-to-chat (wa.me) */
export function waHref(phone: string, text?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const t = text ? `&text=${encodeURIComponent(text)}` : "";
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return touch ? `whatsapp://send?phone=${digits}${t}` : `https://wa.me/${digits}${t}`;
}

export function whatsappUrl(text: string) {
  return waHref(SALON.whatsapp, text);
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function downloadICS(b: BookingSummary) {
  const [hh, mm] = b.time.split(":").map(Number);
  // Qatar is UTC+3 year-round
  const startUTC = new Date(Date.UTC(b.date.getFullYear(), b.date.getMonth(), b.date.getDate(), hh - 3, mm));
  const endUTC = new Date(startUTC.getTime() + b.duration * 60000);
  const desc = [
    `Reference: ${b.ref}`,
    `Treatments: ${b.services.map((s) => s.name).join(", ")}`,
    `Artisan: ${b.artisanName}`,
    `Total: QAR ${b.total}`,
    `Deposit: ${b.deposit === "half" ? "50%" : "Full"}`,
  ].join("\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//within Beauty Salon and Spa//Atelier//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.ref}@within.qa`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(startUTC)}`,
    `DTEND:${icsDate(endUTC)}`,
    `SUMMARY:${icsEscape("within — Atelier Appointment")}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `LOCATION:${icsEscape(SALON.address)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:within — your appointment is in two hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.ref}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
