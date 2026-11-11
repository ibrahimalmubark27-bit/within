import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { adminDict } from "../lib/adminI18n";
import { waHref } from "../lib/booking";
import { formatQAR } from "../lib/data";
import {
  PAYMENT_LABEL,
  STATUS_LABEL,
  admin,
  isUnavailable,
  pushSync,
  receivedTotal,
  resolveServices,
  useStore,
  type Booking,
  type HoursRow,
  type SalonLocation,
} from "../lib/store";
import { ArrowIcon, BackIcon, EASE, LangToggle, Logo, LogoImg, PlusIcon, WhatsAppIcon } from "../components/ui";
import { cn } from "../utils/cn";

/* ───────── helpers ───────── */
export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/* Localised status wording (refined Arabic, never machine-translated) */
const STATUS_AR: Record<string, string> = { new: "جديد", confirmed: "مؤكد", completed: "مكتمل", cancelled: "ملغى" };
const PAY_AR: Record<string, string> = { pending: "قيد الانتظار", deposit: "مدفوع", paid: "مدفوع", refunded: "مسترد" };
const statusL = (s: Booking["status"], lang: string) => (lang === "ar" ? STATUS_AR[s] : STATUS_LABEL[s]);
const payL = (p: Booking["payment"], lang: string) => (lang === "ar" ? PAY_AR[p] : PAYMENT_LABEL[p]);

const STATUS_TONE: Record<Booking["status"], string> = {
  new: "bg-butter text-espresso",
  confirmed: "bg-powder text-espresso",
  completed: "bg-espresso text-alabaster",
  cancelled: "bg-espresso/[0.05] text-espresso/50",
};
const PAY_TONE: Record<Booking["payment"], string> = {
  pending: "border-[0.5px] border-dashed border-espresso/35 text-espresso/70",
  deposit: "bg-powder text-espresso",
  paid: "bg-espresso text-alabaster",
  refunded: "bg-espresso/[0.05] text-espresso/55",
};

/* ───────── shared bits ───────── */
export function PanelHead({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-7 border-b-[0.5px] border-line">
      <div>
        <h1 className="font-display font-light text-[clamp(2.2rem,4vw,3.4rem)] leading-[1] tracking-[-0.03em] text-espresso">{title}</h1>
        <p className="mt-3 max-w-[560px] text-[13.5px] leading-[1.7] text-espresso/60">{sub}</p>
      </div>
      {action}
    </div>
  );
}

export function Chip({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return (
    <span className={cn("inline-flex items-center h-6 px-2.5 rounded-full text-[10.5px] tracking-[0.1em] uppercase whitespace-nowrap", tone)}>
      {children}
    </span>
  );
}

export function Select({
  value,
  onChange,
  options,
  tone,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
  tone?: string;
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={cn(
          "appearance-none h-8 ps-3 pe-8 rounded-full text-[12px] cursor-pointer transition-shadow duration-500 focus-visible:shadow-[0_0_0_3px_#faeba6]",
          tone ?? "bg-alabaster border-[0.5px] border-espresso/25 text-espresso",
        )}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 12 8" className="pointer-events-none absolute end-3 w-2.5 h-2.5 opacity-60" fill="none" aria-hidden>
        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-7 w-[52px] rounded-full transition-colors duration-500 focus-visible:shadow-[0_0_0_3px_#faeba6]",
        checked ? "bg-espresso" : "bg-espresso/[0.12]",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className={cn("absolute top-1 w-5 h-5 rounded-full", checked ? "start-1 bg-butter" : "start-6 bg-espresso/40")}
      />
    </button>
  );
}

export function Stat({ label, value, note, accent }: { label: string; value: string; note?: string; accent?: boolean }) {
  return (
    <div className={cn("relative rounded-[22px] border-[0.5px] border-line p-6 overflow-hidden", accent && "bg-butter border-butter")}>
      <p className="eyebrow text-espresso/55 !text-[9.5px]">{label}</p>
      <p className="mt-4 font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-espresso tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[11.5px] text-espresso/55">{note}</p>}
    </div>
  );
}

export function guestPhoneHref(b: Booking) {
  const num = b.phone.replace(/\D/g, "").startsWith("974") ? b.phone.replace(/\D/g, "") : `974${b.phone.replace(/\D/g, "")}`;
  const msg = `Hello ${b.name.split(" ")[0]} ✨\nYour within appointment ${b.ref} is set for ${b.date} at ${b.time} (Doha time).\nTotal: QAR ${b.total}\nWe look forward to welcoming you.`;
  return waHref(num, msg);
}

/* ───────── OVERVIEW ───────── */
export function OverviewPanel({ go }: { go: (k: string) => void }) {
  const { lang } = useLang();
  const t = adminDict(lang);
  const store = useStore();
  const all = resolveServices(store);
  const today = todayKey();

  const newCount = store.bookings.filter((b) => b.status === "new").length;
  const todays = store.bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const collected = store.bookings.reduce((a, b) => a + receivedTotal(b), 0);
  const due = store.bookings.filter((b) => b.status !== "cancelled").reduce((a, b) => a + (b.total - receivedTotal(b)), 0);
  const paused = all.filter((s) => isUnavailable(store, s.id));

  const upcoming = useMemo(
    () =>
      [...store.bookings]
        .filter((b) => b.status !== "cancelled" && b.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5),
    [store.bookings, today],
  );

  return (
    <div>
      <PanelHead title={t.title} sub={t.kicker} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <Stat label={t.stats.newOrders} value={String(newCount).padStart(2, "0")} note={t.stats.viewAll} accent={newCount > 0} />
        <Stat label={t.stats.todaysBookings} value={String(todays.length).padStart(2, "0")} note={todays.map((b) => b.time).join(" · ") || "—"} />
        <Stat label={t.stats.collected} value={formatQAR(collected, lang)} />
        <Stat label={t.stats.outstanding} value={formatQAR(due, lang)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 rounded-[22px] border-[0.5px] border-line p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-espresso/55 !text-[10px]">{t.stats.upcoming}</p>
            <button onClick={() => go("orders")} className="text-[12px] text-espresso/60 hover:text-espresso transition-colors rounded-sm">
              {t.stats.viewAll} →
            </button>
          </div>
          <ul className="mt-5 divide-y-[0.5px] divide-line">
            {upcoming.length === 0 && <li className="py-6 text-[13px] text-espresso/50">{t.stats.nothing}</li>}
            {upcoming.map((b) => (
              <li key={b.id} className="py-4 flex items-center gap-4">
                <div className="w-16 shrink-0 text-center">
                  <p className="font-display text-[24px] leading-none text-espresso tabular-nums" dir="ltr">
                    {b.time}
                  </p>
                  <p className="text-[10px] text-espresso/50 tabular-nums mt-1" dir="ltr">
                    {b.date.slice(5)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[20px] leading-tight text-espresso truncate">{b.name}</p>
                  <p className="text-[12px] text-espresso/55 truncate">
                    {b.services.map((s) => (lang === "ar" ? s.nameAr : s.name)).join(", ")}
                  </p>
                </div>
                <p className="font-display text-[17px] text-espresso tabular-nums hidden sm:block">{formatQAR(b.total, lang)}</p>
                <div className="flex gap-1.5">
                  <Chip tone={STATUS_TONE[b.status]}>{statusL(b.status, lang)}</Chip>
                  <Chip tone={cn("hidden md:inline-flex", PAY_TONE[b.payment])}>{payL(b.payment, lang)}</Chip>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[22px] border-[0.5px] border-line p-6">
          <p className="eyebrow text-espresso/55 !text-[10px]">{t.stats.unavailable}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {paused.length === 0 && <p className="text-[13px] text-espresso/50">—</p>}
            {paused.map((s) => (
              <Chip key={s.id} tone="bg-espresso/[0.05] text-espresso/70">
                {lang === "ar" ? s.nameAr : s.name}
              </Chip>
            ))}
          </div>
          <button
            onClick={() => go("services")}
            className="mt-6 h-10 w-full rounded-full bg-espresso text-alabaster text-[12.5px] transition-shadow duration-500 hover:shadow-[0_0_0_3px_rgba(250,235,166,0.95)]"
          >
            {t.nav.services}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── ORDERS ───────── */
const ORDER_FILTERS = ["all", "new", "confirmed", "completed", "cancelled"] as const;

export function OrdersPanel() {
  const { lang } = useLang();
  const t = adminDict(lang);
  const store = useStore();
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const list = store.bookings.filter((b) => filter === "all" || b.status === filter);

  return (
    <div>
      <PanelHead
        title={t.orders.title}
        sub={t.orders.sub}
        action={
          <div role="tablist" className="flex flex-wrap gap-1 rounded-full border-[0.5px] border-line p-1">
            {ORDER_FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn("relative h-9 px-4 rounded-full text-[12px] transition-colors duration-500", filter === f ? "text-alabaster" : "text-espresso/65 hover:text-espresso")}
              >
                {filter === f && <motion.span layoutId="ord-tab" className="absolute inset-0 rounded-full bg-espresso" transition={{ duration: 0.6, ease: EASE }} />}
                <span className="relative z-10">
                  {f === "all" ? t.orders.all : statusL(f as Booking["status"], lang)}
                </span>
              </button>
            ))}
          </div>
        }
      />

      {list.length === 0 ? (
        <div className="mt-16 rounded-[22px] border-[0.5px] border-dashed border-espresso/20 py-16 text-center">
          <LogoImg className="h-8 mx-auto" alt="within" />
          <p className="mt-2 text-[13.5px] text-espresso/55">{t.orders.empty}</p>
        </div>
      ) : (
        <ul className="mt-6 rounded-[22px] border-[0.5px] border-line overflow-hidden divide-y-[0.5px] divide-line">
          {list.map((b) => {
            const expanded = open === b.id;
            return (
              <li key={b.id} className="bg-alabaster">
                <button onClick={() => setOpen(expanded ? null : b.id)} aria-expanded={expanded} className="w-full text-start px-5 md:px-6 py-5 hover:bg-powder/30 transition-colors duration-500">
                  <div className="grid grid-cols-12 items-center gap-3">
                    <span className="col-span-6 md:col-span-3">
                      <span className="block font-display text-[12.5px] text-espresso/45 tabular-nums tracking-[0.08em] keep-tracking" dir="ltr">
                        {b.ref}
                      </span>
                      <span className="block font-display text-[22px] leading-tight text-espresso mt-0.5">{b.name}</span>
                    </span>
                    <span className="col-span-6 md:col-span-3 text-start md:text-center">
                      <span className="block text-[13px] text-espresso tabular-nums" dir="ltr">
                        {b.date} · {b.time}
                      </span>
                      <span className="block text-[11.5px] text-espresso/50 mt-0.5">{b.artisan}</span>
                    </span>
                    <span className="col-span-7 md:col-span-3 text-[12.5px] text-espresso/65 leading-snug">
                      {b.services.map((s) => (lang === "ar" ? s.nameAr : s.name)).join(", ")}
                    </span>
                    <span className="col-span-5 md:col-span-1 font-display text-[19px] text-espresso tabular-nums text-end" dir="ltr">
                      {formatQAR(b.total, lang)}
                    </span>
                <span className="col-span-12 md:col-span-2 flex items-center justify-end gap-1.5">
                  <Chip tone={STATUS_TONE[b.status]}>{statusL(b.status, lang)}</Chip>
                  <Chip tone={cn(PAY_TONE[b.payment])}>{payL(b.payment, lang)}</Chip>
                </span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} className="overflow-hidden">
                      <div className="px-5 md:px-6 pb-6 pt-1 bg-powder/35 border-t-[0.5px] border-line">
                        <div className="grid md:grid-cols-3 gap-6 pt-5">
                          <div>
                            <p className="eyebrow text-espresso/50 !text-[9.5px]">{t.orders.treatments}</p>
                            <ul className="mt-3 space-y-2">
                              {b.services.map((s) => (
                                <li key={s.id} className="flex items-baseline gap-3 text-[13px] text-espresso">
                                  <span>{lang === "ar" ? s.nameAr : s.name}</span>
                                  <span className="flex-1 border-b-[0.5px] border-dotted border-espresso/30 translate-y-[-3px]" />
                                  <span className="tabular-nums" dir="ltr">
                                    {formatQAR(s.price, lang)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-3 text-[12px] text-espresso/60 tabular-nums" dir="ltr">
                              {Math.floor(b.duration / 60)}h {b.duration % 60}m · {t.orders.deposit}: {formatQAR(b.depositAmount, lang)}
                            </p>
                          </div>

                          <div>
                            <p className="eyebrow text-espresso/50 !text-[9.5px]">{t.orders.guest}</p>
                            <p className="mt-3 font-display text-[19px] text-espresso" dir="ltr">
                              +974 {b.phone}
                            </p>
                            <p className="mt-2 text-[13px] text-espresso/70">{b.method === "apple" ? "Apple Pay" : "Card"}</p>
                            {b.notes && <p className="mt-3 text-[13px] text-espresso/70 italic leading-relaxed">“{b.notes}”</p>}
                            <a href={guestPhoneHref(b)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-espresso text-alabaster text-[12px] transition-shadow duration-500 hover:shadow-[0_0_0_3px_rgba(250,235,166,0.95)]">
                              <WhatsAppIcon className="w-3.5 h-3.5" /> {t.orders.open}
                            </a>
                          </div>

                          <div>
                            <p className="eyebrow text-espresso/50 !text-[9.5px]">{t.orders.status}</p>
                            <div className="mt-3 flex flex-col gap-3">
                              <Select
                                label={t.orders.status}
                                value={b.status}
                                onChange={(v) => admin.setStatus(b.id, v as Booking["status"])}
                                options={(["new", "confirmed", "completed", "cancelled"] as const).map((v) => ({ v, l: statusL(v, lang) }))}
                              />
                              <Select
                                label={t.orders.payment}
                                value={b.payment}
                                onChange={(v) => admin.setPayment(b.id, v as Booking["payment"], v === "paid" ? b.total : undefined)}
                                options={(["pending", "deposit", "paid", "refunded"] as const).map((v) => ({ v, l: payL(v, lang) }))}
                              />
                              <div className="flex items-baseline justify-between border-t-[0.5px] border-line pt-3 text-[13px]">
                                <span className="text-espresso/60">{t.orders.balance}</span>
                                <span className="font-display text-[20px] text-espresso tabular-nums" dir="ltr">
                                  {formatQAR(Math.max(0, b.total - receivedTotal(b)), lang)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────── PAYMENTS ───────── */
export function PaymentsPanel() {
  const { lang } = useLang();
  const t = adminDict(lang);
  const store = useStore();

  const active = store.bookings.filter((b) => b.status !== "cancelled");
  const received = active.reduce((a, b) => a + receivedTotal(b), 0);
  const owed = active.reduce((a, b) => a + Math.max(0, b.total - receivedTotal(b)), 0);
  const refunded = store.bookings.filter((b) => b.payment === "refunded").reduce((a, b) => a + b.depositAmount, 0);
  const rate = received + owed > 0 ? Math.round((received / (received + owed)) * 100) : 0;

  return (
    <div>
      <PanelHead title={t.pay.title} sub={t.pay.sub} />
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        <Stat label={t.pay.received} value={formatQAR(received, lang)} note={`${rate}% ${t.pay.rate}`} accent />
        <Stat label={t.pay.owed} value={formatQAR(owed, lang)} />
        <Stat label={t.pay.refundedTotal} value={formatQAR(refunded, lang)} />
      </div>

      {/* collection bar */}
      <div className="mt-4 rounded-[22px] border-[0.5px] border-line p-6">
        <div className="h-2 rounded-full bg-espresso/[0.07] overflow-hidden">
          <motion.div className="h-full bg-espresso" initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 1.4, ease: EASE }} />
        </div>
        <div className="mt-3 flex justify-between text-[11.5px] text-espresso/60 tabular-nums">
          <span dir="ltr">{t.pay.collected}: {formatQAR(received, lang)}</span>
          <span dir="ltr">{t.pay.due}: {formatQAR(owed, lang)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-[22px] border-[0.5px] border-line overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-4 bg-powder/60 border-b-[0.5px] border-line text-[10px] uppercase tracking-[0.16em] text-espresso/60 keep-tracking">
          <span className="col-span-3">{t.orders.guest}</span>
          <span className="col-span-2">Ref</span>
          <span className="col-span-2 text-end">{t.orders.total}</span>
          <span className="col-span-2 text-end">{t.orders.deposit}</span>
          <span className="col-span-3 text-end">{t.orders.payment}</span>
        </div>
        {store.bookings.length === 0 && (
          <p className="px-6 py-10 text-center text-[13px] text-espresso/50">{t.pay.empty}</p>
        )}
        <ul className="divide-y-[0.5px] divide-line">
          {store.bookings.map((b) => (
            <li key={b.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-3 gap-y-2 items-center px-6 py-4 hover:bg-powder/25 transition-colors duration-500">
              <span className="md:col-span-3 font-display text-[19px] text-espresso truncate">{b.name}</span>
              <span className="md:col-span-2 text-[11.5px] text-espresso/55 tabular-nums text-end md:text-start" dir="ltr">
                {b.ref}
              </span>
              <span className="md:col-span-2 text-[14px] text-espresso tabular-nums text-end" dir="ltr">
                {formatQAR(b.total, lang)}
              </span>
              <span className="md:col-span-2 text-[14px] text-espresso tabular-nums text-end" dir="ltr">
                {formatQAR(receivedTotal(b), lang)}
              </span>
              <span className="md:col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
                <Chip tone={PAY_TONE[b.payment]}>{b.payment === "deposit" ? t.pay.depositPaid : b.payment === "paid" ? t.pay.paidInFull : b.payment === "pending" ? t.pay.pending : t.pay.refunded}</Chip>
                {b.payment !== "paid" && b.payment !== "refunded" && (
                  <button onClick={() => admin.markPaid(b.id)} className="h-7 px-3 rounded-full bg-espresso text-alabaster text-[11px] hover:shadow-[0_0_0_3px_rgba(250,235,166,0.95)] transition-shadow duration-500">
                    {t.pay.markPaid}
                  </button>
                )}
                {b.payment !== "refunded" && (
                  <button onClick={() => admin.setPayment(b.id, "refunded")} className="h-7 px-3 rounded-full border-[0.5px] border-espresso/25 text-[11px] text-espresso/70 hover:bg-butter/60 transition-colors duration-500">
                    {t.pay.refund}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────── SETTINGS ───────── */
export function SettingsPanel() {
  const { lang } = useLang();
  const t = adminDict(lang);
  const store = useStore();
  const [form, setForm] = useState(store.settings);
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => setForm(store.settings), [store.settings]);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const inputCls = "w-full bg-transparent border-b-[0.5px] border-espresso/25 focus:border-espresso py-3 text-[15px] text-espresso focus:outline-none focus-visible:shadow-none transition-colors";

  const save = () => {
    admin.updateSettings((prev) => ({
      ...prev,
      whatsapp: form.whatsapp.replace(/\D/g, "").replace(/^\+?/, ""),
      whatsappDisplay: form.whatsappDisplay.trim(),
      address: form.address.trim(),
      addressAr: form.addressAr.trim(),
      syncUrl: form.syncUrl ?? prev.syncUrl,
      slotCapacity: form.slotCapacity ?? prev.slotCapacity,
    }));
    setSaved(true);
    void pushSync();
    timer.current = window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="max-w-[720px]">
      <PanelHead title={t.set.title} sub={t.set.sub} />

      <div className="mt-9 space-y-8">
        <label className="block">
          <span className="eyebrow text-espresso/55 !text-[10px]">{t.set.wa}</span>
          <input className={inputCls + " tabular-nums"} dir="ltr" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </label>
        <label className="block">
          <span className="eyebrow text-espresso/55 !text-[10px]">{t.set.waLabel}</span>
          <input className={inputCls} dir="ltr" value={form.whatsappDisplay} onChange={(e) => setForm({ ...form, whatsappDisplay: e.target.value })} />
        </label>
        <label className="block">
          <span className="eyebrow text-espresso/55 !text-[10px]">
            {lang === "ar" ? "رابط المزامنة (JSON) — يجعل التعديلات تظهر لجميع الزوار" : "Sync URL (JSON) — makes edits live for every visitor"}
          </span>
          <input
            className={inputCls}
            dir="ltr"
            placeholder="https://your-domain.com/within-sync.json"
            value={form.syncUrl ?? ""}
            onChange={(e) => setForm({ ...form, syncUrl: e.target.value })}
          />
          <span className="mt-2 block text-[11.5px] leading-relaxed text-espresso/50">
            {lang === "ar"
              ? "بدونه تُحفظ التعديلات على هذا الجهاز فقط. أنشئي ملفاً JSON مفتوح الكتابة (CORS) على نطاقكِ أو استخدمي خدمة مثل Supabase/JSONBin، ثم ضعي الرابط هنا واضغطي الحفظ."
              : "Without it, edits stay on this device only. Create a writable JSON endpoint (CORS allowed) on your domain or a service like Supabase/JSONBin, paste it here and save."}
          </span>
        </label>
        <label className="block">
          <span className="eyebrow text-espresso/55 !text-[10px]">
            {lang === "ar" ? "عدد الحجوزات المسموحة لكل موعد — يُغلق الموعد تلقائياً بعد هذا العدد" : "Bookings allowed per slot — the slot closes automatically once reached"}
          </span>
          <input
            className={inputCls + " tabular-nums"}
            inputMode="numeric"
            value={String(form.slotCapacity ?? 3)}
            onChange={(e) => setForm({ ...form, slotCapacity: Math.max(1, Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 1) })}
          />
          <span className="mt-2 block text-[11.5px] text-espresso/50">
            {lang === "ar"
              ? "مثال: ٣ = بمجرد حجز ٣ نساء على الساعة ٥:٠٠ تُلغى الساعة ٥:٠٠ من قائمة الحجز للزائرات التاليات."
              : "Example: 3 = once 3 guests book 17:00, that slot disappears for the next visitors."}
          </span>
        </label>
        <a
          href="#locations"
          onClick={(e) => e.preventDefault()}
          className="block rounded-[22px] border-[0.5px] border-dashed border-espresso/20 p-5 text-[13px] text-espresso/65"
        >
          <span className="eyebrow text-espresso/55 !text-[10px]">{t.nav.locations}</span>
          <span className="block mt-2">{t.loc.sub}</span>
        </a>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button onClick={save} className="h-12 px-7 rounded-full bg-espresso text-alabaster text-[13.5px] transition-shadow duration-500 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]">
            {t.set.save}
          </button>
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-butter text-espresso text-[12.5px]"
              >
                ✓ {t.toastSaved}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 rounded-[22px] border-[0.5px] border-dashed border-espresso/20 p-6">
          <p className="text-[13.5px] text-espresso/65">{t.set.resetHint}</p>
          <button
            onClick={() => {
              if (window.confirm(t.set.confirmReset)) admin.resetDemo();
            }}
            className="mt-4 h-10 px-5 rounded-full border-[0.5px] border-espresso/30 text-[12.5px] text-espresso hover:bg-butter/60 transition-colors duration-500"
          >
            {t.set.reset}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── LOCATIONS ───────── */
const blankLocation = (): SalonLocation => ({
  id: `loc_${Date.now().toString(36)}`,
  name: "",
  nameAr: "",
  address: "",
  addressAr: "",
  mapUrl: "",
  hours: [
    { label: "Saturday — Thursday", labelAr: "السبت — الخميس", from: "10:00", to: "22:00", closed: false },
    { label: "Friday", labelAr: "الجمعة", from: "14:00", to: "22:00", closed: false },
  ],
});

export function LocationsPanel() {
  const { lang } = useLang();
  const t = adminDict(lang);
  const store = useStore();
  const [list, setList] = useState<SalonLocation[]>(() => store.locations.map((l) => ({ ...l, hours: l.hours.map((h) => ({ ...h })) })));
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(false);

  const inputCls =
    "w-full bg-transparent border-b-[0.5px] border-espresso/25 focus:border-espresso py-2 text-[14px] text-espresso focus:outline-none focus-visible:shadow-none transition-colors";

  const edit = (id: string, patch: Partial<SalonLocation>) => {
    setList((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setDirty(true);
  };
  const editHour = (id: string, i: number, patch: Partial<HoursRow>) => {
    setList((l) =>
      l.map((x) => (x.id === id ? { ...x, hours: x.hours.map((h, hi) => (hi === i ? { ...h, ...patch } : h)) } : x)),
    );
    setDirty(true);
  };
  const addHour = (id: string) => edit(id, { hours: [...(list.find((l) => l.id === id)?.hours ?? []), { label: "", labelAr: "", from: "10:00", to: "22:00", closed: false }] });
  const save = () => {
    admin.setLocations(list);
    void pushSync();
    setDirty(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 4200);
  };

  return (
    <div className="pb-32">
      <PanelHead
        title={t.loc.title}
        sub={t.loc.sub}
        action={
          <button
            onClick={save}
            disabled={!dirty}
            className={cn(
              "group h-14 ps-7 pe-2 rounded-full text-[14px] inline-flex items-center gap-6 transition-all duration-500",
              !dirty ? "bg-espresso/[0.08] text-espresso/40 cursor-not-allowed" : "bg-espresso text-alabaster hover:shadow-[0_0_0_5px_rgba(250,235,166,0.95)]",
            )}
          >
            <span className="flex flex-col items-start leading-tight">
              <span>{t.loc.save}</span>
              <span className="text-[10px] opacity-65">{lang === "en" ? "حفظ التعديلات" : "Save Changes"}</span>
            </span>
            <span className={cn("w-10 h-10 rounded-full grid place-items-center transition-transform duration-700 group-hover:translate-x-1", dirty ? "bg-butter text-espresso" : "bg-espresso/10 text-espresso/40")}>
              <ArrowIcon />
            </span>
          </button>
        }
      />

      <div className="mt-8 grid gap-5">
        {list.length === 0 && (
          <div className="rounded-[22px] border-[0.5px] border-dashed border-espresso/20 py-14 text-center">
            <LogoImg className="h-8 mx-auto" alt="within" />
            <p className="mt-2 text-[13.5px] text-espresso/55">{t.loc.empty}</p>
          </div>
        )}

        {list.map((loc, li) => (
          <div key={loc.id} className="rounded-[24px] border-[0.5px] border-line overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 md:px-7 py-4 bg-powder/50 border-b-[0.5px] border-line">
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-full bg-espresso text-butter grid place-items-center text-[11px] tabular-nums">{li + 1}</span>
                <span className="font-display text-[22px] text-espresso truncate">{loc.name || loc.nameAr || t.loc.add}</span>
              </span>
              <button
                onClick={() => {
                  if (window.confirm(t.loc.confirmRemove)) {
                    setList((l) => (l.filter((x) => x.id !== loc.id).length ? l.filter((x) => x.id !== loc.id) : [blankLocation()]));
                    setDirty(true);
                  }
                }}
                className="h-8 px-3.5 rounded-full border-[0.5px] border-espresso/25 text-[11.5px] text-espresso/75 hover:bg-espresso hover:text-alabaster transition-colors duration-500"
              >
                {t.loc.remove}
              </button>
            </div>

            <div className="p-5 md:p-7 grid md:grid-cols-2 gap-x-7 gap-y-5">
              <label className="block">
                <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.loc.name}</span>
                <input className={inputCls} value={loc.name} onChange={(e) => edit(loc.id, { name: e.target.value })} placeholder="within — West Bay" />
              </label>
              <label className="block">
                <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.loc.nameAr}</span>
                <input className={inputCls} dir="rtl" value={loc.nameAr} onChange={(e) => edit(loc.id, { nameAr: e.target.value })} placeholder="ويذين — الوست باي" />
              </label>
              <label className="block">
                <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.loc.address}</span>
                <input className={inputCls} value={loc.address} onChange={(e) => edit(loc.id, { address: e.target.value })} placeholder="Building 25, West Bay, Doha" />
              </label>
              <label className="block">
                <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.loc.addressAr}</span>
                <input className={inputCls} dir="rtl" value={loc.addressAr} onChange={(e) => edit(loc.id, { addressAr: e.target.value })} placeholder="مبنى ٢٥، الوست باي، الدوحة" />
              </label>
              <label className="block md:col-span-2">
                <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.loc.map}</span>
                <input className={inputCls} dir="ltr" value={loc.mapUrl} onChange={(e) => edit(loc.id, { mapUrl: e.target.value })} placeholder="https://maps.google.com/…" />
              </label>
            </div>

            {/* hours */}
            <div className="px-5 md:px-7 pb-6">
              <div className="flex items-center justify-between border-t-[0.5px] border-line pt-5">
                <p className="eyebrow text-espresso/55 !text-[9.5px]">{t.loc.hours}</p>
                <button
                  onClick={() => addHour(loc.id)}
                  className="h-8 px-3.5 rounded-full border-[0.5px] border-espresso/25 text-[11.5px] text-espresso/75 hover:bg-butter/70 transition-colors duration-500"
                >
                  {t.loc.addRow}
                </button>
              </div>

              <div className="mt-3 grid gap-2">
                {loc.hours.map((h, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2.5 items-end rounded-[16px] border-[0.5px] border-line p-3">
                    <label className="col-span-6 md:col-span-4">
                      <span className="eyebrow text-espresso/45 !text-[8.5px]">{t.loc.days}</span>
                      <input className={inputCls} value={h.label} onChange={(e) => editHour(loc.id, i, { label: e.target.value })} />
                    </label>
                    <label className="col-span-6 md:col-span-4">
                      <span className="eyebrow text-espresso/45 !text-[8.5px]">عربي</span>
                      <input className={inputCls} dir="rtl" value={h.labelAr} onChange={(e) => editHour(loc.id, i, { labelAr: e.target.value })} />
                    </label>
                    <span className="col-span-5 md:col-span-2 flex items-center gap-2">
                      <input dir="ltr" className="w-full h-9 rounded-full border-[0.5px] border-espresso/15 text-center text-[13.5px] tabular-nums text-espresso focus:outline-none focus-visible:shadow-[0_0_0_3px_#faeba6]" value={h.from} onChange={(e) => editHour(loc.id, i, { from: e.target.value.replace(/[^\d:]/g, "").slice(0, 5) })} />
                      <span className="text-[11px] text-espresso/45">{t.loc.to}</span>
                      <input dir="ltr" className="w-full h-9 rounded-full border-[0.5px] border-espresso/15 text-center text-[13.5px] tabular-nums text-espresso focus:outline-none focus-visible:shadow-[0_0_0_3px_#faeba6]" value={h.to} onChange={(e) => editHour(loc.id, i, { to: e.target.value.replace(/[^\d:]/g, "").slice(0, 5) })} />
                    </span>
                    <span className="col-span-7 md:col-span-2 flex items-center gap-2.5">
                      <Switch checked={!h.closed} onChange={() => editHour(loc.id, i, { closed: !h.closed })} label={t.loc.closed} />
                      <span className="text-[11.5px] text-espresso/60">{h.closed ? t.loc.closed : `${h.from}–${h.to}`}</span>
                    </span>
                    <span className="col-span-12 md:col-span-1 flex md:justify-end">
                      <button
                        onClick={() => {
                          setList((l) => l.map((x) => (x.id === loc.id ? { ...x, hours: x.hours.filter((_, hi) => hi !== i) } : x)));
                          setDirty(true);
                        }}
                        aria-label="Remove row"
                        className="w-8 h-8 rounded-full border-[0.5px] border-espresso/20 grid place-items-center text-espresso/60 hover:bg-espresso hover:text-alabaster transition-colors duration-500"
                      >
                        <PlusIcon className="rotate-45" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11.5px] text-espresso/50">
                {t.loc.preview}: {lang === "ar" ? `${loc.nameAr || "—"} · ${loc.addressAr || "—"}` : `${loc.name || "—"} · ${loc.address || "—"}`}
              </p>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            setList((l) => [...l, blankLocation()]);
            setDirty(true);
          }}
          className="group self-start inline-flex items-center gap-3 h-11 px-5 rounded-full bg-espresso text-alabaster text-[13px] hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)] transition-shadow duration-500"
        >
          {t.loc.add}
          <span className="w-7 h-7 rounded-full bg-butter text-espresso grid place-items-center transition-transform duration-700 group-hover:rotate-90">
            <PlusIcon />
          </span>
        </button>
      </div>

      {/* sticky save */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed bottom-0 inset-x-0 lg:ms-[266px] z-30 bg-espresso text-alabaster px-5 md:px-10 py-4 flex items-center justify-between gap-4"
          >
            <span className="text-[12.5px]">
              <span className="text-butter">●</span> {t.loc.save}
            </span>
            <button onClick={save} className="group h-11 ps-6 pe-2 rounded-full bg-butter text-espresso text-[13.5px] inline-flex items-center gap-4 transition-transform duration-500 hover:scale-[1.02]">
              <span className="flex flex-col items-start leading-tight">
                <span>{t.loc.save}</span>
                <span className="text-[10px] opacity-70">{lang === "en" ? "حفظ التعديلات" : "Save Changes"}</span>
              </span>
              <span className="w-8 h-8 rounded-full bg-espresso text-butter grid place-items-center">
                <ArrowIcon className="w-3.5 h-3.5" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* green toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.55, ease: EASE }}
            role="status"
            aria-live="polite"
            className="fixed z-50 bottom-6 inset-x-5 lg:ms-[266px] lg:inset-x-8 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto max-w-[520px] w-fit rounded-full bg-[#2f6f4f] text-white px-6 py-4 flex items-center gap-4 shadow-[0_24px_50px_-24px_rgba(47,111,79,0.9)]">
              <span className="w-7 h-7 rounded-full bg-white/15 grid place-items-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[13.5px]">{t.loc.saved}</span>
                <span className="text-[11.5px] opacity-75">{t.loc.savedAr}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* re-exported for the shell */
export { BackIcon, LangToggle, Logo };
