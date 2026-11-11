import { useMemo, useState } from "react";
import type * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { adminDict } from "../lib/adminI18n";
import { CATEGORY_LABEL, type Category } from "../lib/data";
import { admin, isUnavailable, pushSync, resolveServices, useStore } from "../lib/store";
import { EASE, LangToggle, Logo, PlusIcon, ArrowIcon, WhatsAppIcon } from "../components/ui";
import { cn } from "../utils/cn";
import { OrdersPanel, PaymentsPanel, SettingsPanel, Switch, Chip, PanelHead } from "./panels";
import { MediaPanel } from "./MediaPanel";
import { SlotsPanel } from "./SlotsPanel";

const AUTH_KEY = "within-admin-auth";
const PASSCODE = "within2026";

type Route = "prices" | "locations" | "media" | "slots" | "orders" | "payments" | "settings";

export function AdminApp({ onExit }: { onExit: () => void }) {
  const { lang } = useLang();
  const t = adminDict(lang);
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "ok");
  const [route, setRoute] = useState<Route>("prices");
  const store = useStore();

  const newCount = store.bookings.filter((b) => b.status === "new").length;
  const nav: { k: Route; label: string; badge?: number }[] = [
    { k: "prices", label: t.nav.prices },
    { k: "media", label: lang === "ar" ? "إدارة الصور والوسائط" : "Media & Images" },
    { k: "slots", label: lang === "ar" ? "المواعيد والشطب" : "Slot rules" },
    { k: "orders", label: t.nav.orders, badge: newCount },
    { k: "payments", label: t.nav.payments },
    { k: "settings", label: t.nav.settings },
  ];

  if (!authed) return <Gate onPass={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-alabaster">
      {/* Rail */}
      <aside className="lg:fixed lg:inset-y-0 lg:w-[266px] bg-espresso text-alabaster z-40 flex lg:flex-col">
        <div className="flex-1 lg:shrink-0 p-6 lg:p-8 flex lg:flex-col gap-6 lg:gap-10 items-center lg:items-stretch lg:justify-between">
          <div className="flex flex-col items-center lg:items-start gap-8 w-full">
            <div className="flex flex-col items-center lg:items-start">
              <Logo size="sm" tone="powder" />
              <p className="mt-3 text-[9.5px] uppercase tracking-[0.3em] text-powder/50 keep-tracking whitespace-nowrap">{t.title}</p>
            </div>

            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 lg:px-0 w-full" aria-label={t.title}>
              {nav.map((n) => {
                const active = route === n.k;
                return (
                  <button
                    key={n.k}
                    onClick={() => setRoute(n.k)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative shrink-0 h-10 px-4 lg:px-5 rounded-full text-[13px] whitespace-nowrap transition-colors duration-500 text-start flex items-center gap-2.5",
                      active ? "text-espresso" : "text-alabaster/65 hover:text-alabaster",
                    )}
                  >
                    {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-full bg-butter" transition={{ duration: 0.6, ease: EASE }} />}
                    <span className="relative z-10">{n.label}</span>
                    {!!n.badge && n.badge > 0 && (
                      <span
                        className={cn(
                          "relative z-10 min-w-4.5 px-1 rounded-full grid place-items-center text-[9.5px] tabular-nums leading-none py-0.5",
                          active ? "bg-espresso text-butter" : "bg-butter text-espresso",
                        )}
                      >
                        {n.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:flex flex-col gap-3">
            <LangToggle dark />
            <a
              href={`https://wa.me/${store.settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 rounded-full border-[0.5px] border-alabaster/20 text-alabaster/75 hover:text-espresso hover:bg-butter hover:border-butter transition-all duration-500 text-[12.5px] flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span className="tabular-nums text-[11.5px]">{store.settings.whatsappDisplay}</span>
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <LangToggle dark />
            <button onClick={onExit} className="h-9 px-4 rounded-full bg-alabaster text-espresso text-[12px]">
              ← {t.gate.site}
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ms-[266px] px-5 md:px-10 py-8 md:py-12 min-h-screen">
        {/* Top bar: live status + the two required buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-7 mb-2 border-b-[0.5px] border-line">
          <span className="inline-flex items-center gap-2.5 text-[11.5px] text-espresso/60">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-butter animate-ping opacity-70" />
              <span className="relative w-2 h-2 rounded-full bg-espresso/70" />
            </span>
            {t.kicker}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onExit}
              className="group h-10 ps-5 pe-3 rounded-full border-[0.5px] border-espresso/25 text-[12.5px] text-espresso inline-flex items-center gap-2.5 hover:bg-powder/60 transition-colors duration-500"
            >
              {t.gate.site}
              <ArrowIcon className="transition-transform duration-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem(AUTH_KEY);
                setAuthed(false);
              }}
              className="h-10 px-5 rounded-full bg-espresso text-alabaster text-[12.5px] hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)] transition-shadow duration-500"
            >
              🔒 {t.logout}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {route === "prices" && <PricesPanel />}
            {route === "media" && <MediaPanel />}
            {route === "slots" && <SlotsPanel />}
            {route === "orders" && <OrdersPanel />}
            {route === "payments" && <PaymentsPanel />}
            {route === "settings" && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ───────── Gate ───────── */
function Gate({ onPass }: { onPass: () => void }) {
  const { lang } = useLang();
  const t = adminDict(lang);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === PASSCODE) {
      sessionStorage.setItem(AUTH_KEY, "ok");
      onPass();
    } else {
      setErr(true);
      setShake((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-powder grid place-items-center px-5 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -start-32 w-[520px] h-[520px] rounded-full bg-alabaster blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -end-24 w-[560px] h-[560px] rounded-full bg-butter/60 blur-[120px]" />
      <motion.form
        onSubmit={submit}
        key={shake}
        initial={shake ? { x: -8 } : { opacity: 0, y: 20 }}
        animate={shake ? { x: [0, 8, -6, 4, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: shake ? 0.45 : 1.1, ease: EASE }}
        className="relative w-full max-w-[420px] rounded-[28px] bg-alabaster border-[0.5px] border-line p-8 sm:p-10 shadow-[0_40px_90px_-50px_rgba(60,36,36,0.6)]"
        noValidate
      >
        <div className="flex justify-center overflow-visible">
          <img
            src="https://i.postimg.cc/9M2tgrgG/IMG-4209.png"
            alt="within BEAUTY SALON AND SPA"
            className="h-10 md:h-11 w-auto mx-auto object-contain mix-blend-multiply mb-5"
            loading="eager"
            decoding="async"
          />
        </div>
        <p className="mt-7 eyebrow text-espresso/55 text-center !text-[10px]">{t.title}</p>
        <p className="mt-3 text-center text-[13.5px] leading-relaxed text-espresso/65">{t.gate.sub}</p>

        <label className="block mt-8">
          <span className="eyebrow text-espresso/60 !text-[10px]">{t.gate.label}</span>
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setErr(false);
            }}
            className="mt-2 w-full bg-transparent border-b-[0.5px] border-espresso/30 focus:border-espresso py-3 text-center text-[18px] tracking-[0.35em] text-espresso focus:outline-none focus-visible:shadow-none transition-colors"
            placeholder="••••••••"
            aria-label={t.gate.label}
          />
        </label>

        <AnimatePresence>
          {err && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="mt-4 overflow-hidden"
              role="alert"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-butter px-3 py-1.5 text-[12px] text-espresso">i {t.gate.wrong}</span>
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="group mt-7 w-full h-14 rounded-full bg-espresso text-alabaster text-[14px] flex items-center justify-between ps-7 pe-2 transition-shadow duration-700 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]"
        >
          <span className="flex flex-col items-start leading-tight">
            <span>{t.gate.enter}</span>
            <span className="text-[10.5px] opacity-60">{lang === "en" ? "دخول للوحة التحكم" : "Login to Dashboard"}</span>
          </span>
          <span className="w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center transition-transform duration-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            <ArrowIcon />
          </span>
        </button>

        <p className="mt-6 text-center text-[11.5px] text-espresso/45">{t.gate.hint}</p>
      </motion.form>
    </div>
  );
}

/* ───────── Prices & durations (main table + Save Changes) ───────── */
type Draft = Record<string, { price?: string; duration?: string; unavailable?: boolean }>;

function PricesPanel() {
  const { lang } = useLang();
  const t = adminDict(lang);
  const store = useStore();
  const [draft, setDraft] = useState<Draft>({});
  const [toast, setToast] = useState(false);
  const [cat, setCat] = useState<"all" | Category>("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", price: "", duration: "30", category: "nails" as Category });

  const all = useMemo(() => resolveServices(store), [store]);
  const filtered = useMemo(
    () =>
      all
        .filter((s) => (cat === "all" || s.category === cat) && (s.name + s.nameAr).toLowerCase().includes(q.trim().toLowerCase()))
        // unavailable services re-ordered to the bottom of the table
        .sort((x, y) => (isUnavailable(store, x.id) ? 1 : 0) - (isUnavailable(store, y.id) ? 1 : 0)),
    [all, cat, q, store],
  );
  const dirty = Object.keys(draft).length;

  const get = (id: string) => draft[id] ?? {};
  const setField = (id: string, patch: { price?: string; duration?: string; unavailable?: boolean }) =>
    setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  /** Availability applies instantly (no Save needed) and is persisted straight away. */
  const toggleAvail = (id: string, next: boolean) => {
    admin.toggleUnavailable(id, next);
    setDraft((d) => {
      const entry = d[id];
      if (!entry) return d;
      const rest = { ...entry };
      delete rest.unavailable;
      if (Object.keys(rest).length === 0) {
        const copy = { ...d };
        delete copy[id];
        return copy;
      }
      return { ...d, [id]: rest };
    });
    setSavedFlash(id);
    window.setTimeout(() => setSavedFlash((f) => (f === id ? null : f)), 1800);
  };

  const save = () => {
    Object.entries(draft).forEach(([id, v]) => {
      const price = Number((v.price ?? "").replace(/\D/g, ""));
      const duration = Number((v.duration ?? "").replace(/\D/g, ""));
      if (v.price !== undefined && price > 0 && price !== all.find((s) => s.id === id)?.price) admin.setPrice(id, price);
      if (v.duration !== undefined && duration > 0 && duration !== all.find((s) => s.id === id)?.duration) admin.setDuration(id, duration);
      if (v.unavailable !== undefined) admin.toggleUnavailable(id, v.unavailable);
    });
    setDraft({});
    setToast(true);
    void pushSync();
    window.setTimeout(() => setToast(false), 4200);
  };

  const addService = () => {
    const price = Number(form.price);
    const duration = Number(form.duration);
    if (!form.name.trim() || !price || !duration) return;
    admin.addService({ name: form.name, nameAr: form.nameAr, price, duration, category: form.category });
    setForm({ name: "", nameAr: "", price: "", duration: "30", category: "nails" });
    setAdding(false);
  };

  const inputCls = "w-full bg-transparent border-b-[0.5px] border-espresso/25 focus:border-espresso py-2 text-[14px] text-espresso focus:outline-none focus-visible:shadow-none transition-colors";
  const numCls = "w-full h-10 rounded-full border-[0.5px] border-espresso/15 bg-alabaster text-center text-[15px] font-display tabular-nums text-espresso focus:outline-none focus-visible:shadow-[0_0_0_3px_#faeba6] transition-all duration-500 hover:border-espresso/35 focus:border-espresso";

  const Row = (s: (typeof all)[number]) => {
    const paused = get(s.id).unavailable ?? isUnavailable(store, s.id);
    const isCustom = store.custom.some((c) => c.id === s.id);
    const offMenu = store.removed.includes(s.id);
    return (
      <li key={s.id} className={cn("grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-3 items-center px-5 md:px-6 py-4 transition-colors duration-500 hover:bg-powder/25", (paused || offMenu) && "opacity-70")}>
        <span className="col-span-2 md:col-span-5 min-w-0">
          <span className="flex items-center gap-2.5 flex-wrap">
            <span className="font-display text-[21px] leading-tight text-espresso">{lang === "ar" ? s.nameAr : s.name}</span>
            <Chip tone={s.category === "nails" ? "bg-powder text-espresso" : "bg-espresso/[0.06] text-espresso/70"}>{s.category}</Chip>
            {isCustom && <Chip tone="border-[0.5px] border-espresso/25 text-espresso/60">{t.svc.custom}</Chip>}
            {get(s.id).price !== undefined || get(s.id).duration !== undefined ? (
              <Chip tone="bg-butter text-espresso">•</Chip>
            ) : null}
          </span>
          <span className="block text-[12px] text-espresso/45 mt-0.5 truncate">{lang === "ar" ? s.name : s.nameAr}</span>
        </span>

        <span className="col-span-1 md:col-span-3 flex items-center gap-2">
          <span className="md:hidden text-[11px] text-espresso/55">{t.prices.col.price}</span>
          <span className="text-[12px] text-espresso/55" dir="ltr">QAR</span>
          <input
            aria-label={`${t.prices.col.price} — ${s.name}`}
            inputMode="numeric"
            value={get(s.id).price ?? String(s.price)}
            onChange={(e) => setField(s.id, { price: e.target.value.replace(/\D/g, "").slice(0, 5) })}
            className={numCls}
          />
        </span>

        <span className="col-span-1 md:col-span-2 flex items-center gap-2">
          <span className="md:hidden text-[11px] text-espresso/55">{t.prices.col.duration}</span>
          <input
            aria-label={`${t.prices.col.duration} — ${s.name}`}
            inputMode="numeric"
            value={get(s.id).duration ?? String(s.duration)}
            onChange={(e) => setField(s.id, { duration: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            className={numCls}
          />
          <span className="hidden md:inline text-[11px] text-espresso/50">min</span>
        </span>

        <span className="col-span-1 md:col-span-2 flex items-center gap-3">
          <Switch checked={!paused} onChange={() => toggleAvail(s.id, !paused)} label={`${t.prices.col.availability} ${s.name}`} />
          <span className={cn("text-[11.5px] transition-colors duration-500", savedFlash === s.id ? "text-espresso" : "text-espresso/60")}>
            {savedFlash === s.id ? `✓ ${lang === "ar" ? "تم الحفظ" : "Saved"}` : paused ? t.svc.paused : t.svc.available}
          </span>
        </span>

        <span className="col-span-1 md:col-span-2 flex md:justify-end items-center gap-2 flex-wrap">
          <button
            onClick={() => admin.hide(s.id, !offMenu)}
            className={cn(
              "h-8 px-3.5 rounded-full border-[0.5px] text-[11.5px] transition-colors duration-500",
              offMenu ? "border-espresso/40 bg-butter text-espresso" : "border-espresso/25 text-espresso/75 hover:bg-butter/70",
            )}
          >
            {offMenu ? t.svc.restore : t.svc.remove}
          </button>
          {isCustom && (
            <button
              onClick={() => {
                if (window.confirm(t.svc.confirmRemove)) admin.remove(s.id);
              }}
              aria-label={`${t.svc.remove} ${s.name}`}
              className="w-8 h-8 rounded-full border-[0.5px] border-espresso/25 grid place-items-center text-espresso/70 hover:bg-espresso hover:text-alabaster transition-colors duration-500"
            >
              <PlusIcon className="rotate-45" />
            </button>
          )}
        </span>
      </li>
    );
  };

  return (
    <div className="pb-32">
      <PanelHead
        title={t.prices.title}
        sub={t.prices.sub}
        action={
          <button
            onClick={save}
            aria-live="polite"
            className="group h-14 ps-7 pe-2 rounded-full text-[14px] inline-flex items-center gap-6 bg-espresso text-alabaster transition-all duration-500 hover:shadow-[0_0_0_5px_rgba(250,235,166,0.95)] shadow-[0_14px_35px_-22px_rgba(60,36,36,0.8)]"
          >
            <span className="flex flex-col items-start leading-tight">
              <span>{t.prices.save}</span>
              <span className="text-[10px] opacity-65">{lang === "en" ? "حفظ التعديلات" : "Save Changes"}</span>
            </span>
            <span className="w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center transition-transform duration-700 group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </button>
        }
      />

      {/* toolbar */}
      <div className="mt-7 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex gap-1 rounded-full border-[0.5px] border-line p-1 self-start">
          {(["all", "nails", "hair", "spa"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn("relative h-9 px-5 rounded-full text-[12.5px] transition-colors duration-500", cat === c ? "text-alabaster" : "text-espresso/65 hover:text-espresso")}
            >
              {cat === c && <motion.span layoutId="price-cat" className="absolute inset-0 rounded-full bg-espresso" transition={{ duration: 0.6, ease: EASE }} />}
              <span className="relative z-10">
                {c === "all" ? (lang === "ar" ? "الكل" : "All") : CATEGORY_LABEL[c as Category][lang]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-[11.5px]", dirty ? "bg-butter text-espresso" : "text-espresso/45")}>
            {dirty ? `● ${dirty} ${t.prices.dirty}` : `✓ ${t.prices.clean}`}
          </span>
          <div className="relative md:w-[220px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.svc.search}
              aria-label={t.svc.search}
              className="w-full h-10 ps-9 pe-4 rounded-full border-[0.5px] border-line bg-alabaster text-[13.5px] text-espresso placeholder:text-espresso/40 focus:outline-none focus-visible:shadow-[0_0_0_3px_#faeba6] transition-shadow"
            />
            <svg viewBox="0 0 20 20" className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-45" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.1" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* table */}
      <div className="mt-5 rounded-[22px] border-[0.5px] border-line overflow-hidden bg-alabaster">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-powder/60 border-b-[0.5px] border-line text-[10px] uppercase tracking-[0.16em] text-espresso/60 keep-tracking">
          <span className="col-span-5">{t.prices.col.service}</span>
          <span className="col-span-3">{t.prices.col.price}</span>
          <span className="col-span-2">{t.prices.col.duration}</span>
          <span className="col-span-2">{t.prices.col.availability}</span>
        </div>

        {filtered.length === 0 && <p className="px-6 py-12 text-center text-[13.5px] text-espresso/55">{t.svc.empty}</p>}

        <ul className="divide-y-[0.5px] divide-line">
          {cat === "all" &&
            (["nails", "hair"] as const).map((group) => (
              <li key={group} className="bg-powder/35">
                <div className="flex items-center gap-4 px-5 md:px-6 py-3">
                  <span className="eyebrow text-espresso/70 !text-[10px]">{group === "nails" ? (lang === "ar" ? "الأظافر" : "Nails") : lang === "ar" ? "الشعر" : "Hair"}</span>
                  <span className="flex-1 h-[0.5px] bg-line" />
                  <span className="text-[11px] text-espresso/45 tabular-nums">
                    {filtered.filter((s) => s.category === group).length}
                  </span>
                </div>
              </li>
            ))}
          {cat === "all"
            ? (["nails", "hair"] as const).flatMap((group) => filtered.filter((s) => s.category === group).map(Row))
            : filtered.map(Row)}
        </ul>
      </div>

      {/* add treatment */}
      <div className="mt-6 rounded-[22px] border-[0.5px] border-dashed border-espresso/20 p-5 md:p-6">
        <button
          onClick={() => setAdding((v) => !v)}
          className="group inline-flex items-center gap-3 h-10 px-5 rounded-full border-[0.5px] border-espresso/30 text-[12.5px] text-espresso hover:bg-butter/70 transition-colors duration-500"
        >
          {t.prices.add}
          <span className="w-6 h-6 rounded-full bg-espresso text-butter grid place-items-center transition-transform duration-700 group-hover:rotate-90">
            <PlusIcon />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {adding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.55, ease: EASE }} className="overflow-hidden">
              <div className="mt-6 grid md:grid-cols-5 gap-5 items-end">
                <label className="block md:col-span-2">
                  <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.svc.name}</span>
                  <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className="block">
                  <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.svc.nameAr}</span>
                  <input className={inputCls} dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
                </label>
                <label className="block">
                  <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.svc.category}</span>
                  <select className={inputCls + " cursor-pointer"} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                    <option value="nails">{CATEGORY_LABEL.nails[lang]}</option>
                    <option value="hair">{CATEGORY_LABEL.hair[lang]}</option>
                    <option value="spa">{CATEGORY_LABEL.spa[lang]}</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.svc.price}</span>
                    <input className={numCls} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} placeholder="120" />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-espresso/55 !text-[9.5px]">{t.svc.duration}</span>
                    <input className={numCls} inputMode="numeric" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value.replace(/\D/g, "") })} />
                  </label>
                </div>
              </div>
              <button
                onClick={addService}
                className="mt-6 h-11 px-6 rounded-full bg-espresso text-alabaster text-[13px] hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)] transition-shadow duration-500"
              >
                {t.svc.save}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* sticky Save bar */}
      <AnimatePresence>
        {dirty > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed bottom-0 inset-x-0 lg:ms-[266px] z-30 bg-espresso text-alabaster px-5 md:px-10 py-4 flex items-center justify-between gap-4"
          >
            <span className="text-[12.5px]">
              <span className="text-butter">●</span> {dirty} {t.prices.dirty}
            </span>
            <div className="flex items-center gap-2.5">
              <button onClick={() => setDraft({})} className="h-11 px-5 rounded-full text-[12.5px] text-alabaster/70 hover:text-alabaster transition-colors">
                {t.svc.cancel}
              </button>
              <button
                onClick={save}
                className="group h-11 ps-6 pe-2 rounded-full bg-butter text-espresso text-[13.5px] inline-flex items-center gap-4 transition-transform duration-500 hover:scale-[1.02]"
              >
                <span className="flex flex-col items-start leading-tight">
                  <span>{t.prices.save}</span>
                  <span className="text-[10px] opacity-70">{lang === "en" ? "حفظ التعديلات" : "Save Changes"}</span>
                </span>
                <span className="w-8 h-8 rounded-full bg-espresso text-butter grid place-items-center">
                  <ArrowIcon className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* green success toast */}
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
                <span className="text-[13.5px]">{t.prices.saved}</span>
                <span className="text-[11.5px] opacity-75">{t.prices.savedAr}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
