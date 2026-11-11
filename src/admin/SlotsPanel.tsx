import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { admin, pushSync, useStore } from "../lib/store";
import { getSlots, qatarNow, slotKey } from "../lib/booking";
import { ArrowIcon, EASE, PlusIcon } from "../components/ui";
import { cn } from "../utils/cn";

const HOURS = Array.from({ length: 12 }, (_, i) => 10 + i); // 10:00 → 21:00
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function SlotsPanel() {
  const { lang } = useLang();
  const store = useStore();
  const [cap, setCap] = useState(String(store.settings.slotCapacity ?? 3));
  const [rules, setRules] = useState<{ hour: number; capacity: number }[]>(store.settings.slotRules ?? []);
  const [toast, setToast] = useState(false);
  const [dateStr, setDateStr] = useState(() => {
    const d = qatarNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const occupancy = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of store.bookings) {
      if (b.status === "cancelled") continue;
      map[`${b.date}|${b.time}`] = (map[`${b.date}|${b.time}`] ?? 0) + 1;
    }
    return map;
  }, [store.bookings]);

  const date = useMemo(() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y || 2026, (m || 1) - 1, d || 1);
  }, [dateStr]);

  const blocked = useMemo(() => new Set(store.settings.blockedSlots ?? []), [store.settings.blockedSlots]);
  const capacity = Math.max(1, Number(cap) || 1);
  const slots = getSlots(date, occupancy, capacity, blocked, rules);

  const dirty = capacity !== (store.settings.slotCapacity ?? 3) || JSON.stringify(rules) !== JSON.stringify(store.settings.slotRules ?? []);
  const [flash, setFlash] = useState(false);
  const persist = () => {
    void pushSync();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 2200);
  };
  const applyCap = (v: string) => {
    setCap(v);
    const n = Math.max(1, Number(v.replace(/\D/g, "").slice(0, 2)) || 1);
    admin.setSlotCapacity(n);
    persist();
  };
  const applyRules = (next: { hour: number; capacity: number }[]) => {
    setRules(next);
    admin.setSlotRules(next);
    persist();
  };

  const L = {
    title: lang === "ar" ? "المواعيد والشطب" : "Slot rules & capacity",
    sub:
      lang === "ar"
        ? "تحكّمي بمتى يُشطب كل موعد: عدد اشخاص مسموح لكل ساعة، وقواعد خاصة لساعة معيّنة، مع عدّاد مباشر لمن استقبلن ذلك الموعد."
        : "Control when a slot closes: guests allowed per hour, a special rule for a single hour, plus a live count of who booked it.",
    global: lang === "ar" ? "الافتراضي — عدد الحجوزات لكل موعد" : "Default — bookings allowed per slot",
    globalHint: lang === "ar" ? "يُطبَّق على كل الساعات التي بلا قاعدة خاصة." : "Applies to every hour without a specific rule.",
    rules: lang === "ar" ? "قواعد خاصة لكل ساعة" : "Per-hour rules",
    rulesHint: lang === "ar" ? "مثال: الساعة ١٤:٠٠ → بعد حجز شخصين تُشطب الساعة." : "Example: at 14:00 → closes after 2 bookings.",
    add: lang === "ar" ? "+ إضافة قاعدة" : "+ Add rule",
    del: lang === "ar" ? "حذف" : "Delete",
    hour: lang === "ar" ? "الساعة" : "Hour",
    count: lang === "ar" ? "عدد الأشخاص" : "Guests",
    live: lang === "ar" ? "العدّاد المباشر ليوم" : "Live counter for",
    taken: lang === "ar" ? "مقبوض" : "booked",
    open: lang === "ar" ? "متاح" : "Open",
    full: lang === "ar" ? "مشطب" : "Closed",
    passed: lang === "ar" ? "مضى" : "Passed",
    blocked: lang === "ar" ? "محجوب" : "Blocked",
    save: lang === "ar" ? "حفظ قواعد المواعيد" : "Save slot rules",
    saved: lang === "ar" ? "تم تحديث قواعد المواعيد في الموقع" : "Slot rules updated on the live site",
    savedAlt: lang === "ar" ? "Slot rules updated on the live site" : "تم تحديث قواعد المواعيد في الموقع",
  };

  const save = () => {
    admin.setSlotCapacity(capacity);
    admin.setSlotRules(rules);
    void pushSync();
    setToast(true);
    window.setTimeout(() => setToast(false), 4200);
  };

  const inputCls =
    "w-full bg-transparent border-b-[0.5px] border-espresso/25 focus:border-espresso py-2 text-[14px] text-espresso focus:outline-none focus-visible:shadow-none transition-colors tabular-nums";

  return (
    <div className="pb-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-7 border-b-[0.5px] border-line">
        <div>
          <h1 className="font-display font-light text-[clamp(2.2rem,4vw,3.4rem)] leading-[1] tracking-[-0.03em] text-espresso">{L.title}</h1>
          <p className="mt-3 max-w-[560px] text-[13.5px] leading-[1.7] text-espresso/60">{L.sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {flash && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#2f6f4f] text-white text-[12.5px]"
              >
                ✓ {lang === "ar" ? "تم الحفظ فوراً" : "Saved instantly"}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={save}
            className="group h-14 ps-7 pe-2 rounded-full text-[14px] inline-flex items-center gap-6 bg-espresso text-alabaster transition-all duration-500 hover:shadow-[0_0_0_5px_rgba(250,235,166,0.95)]"
          >
            <span className="flex flex-col items-start leading-tight">
              <span>{L.save}</span>
              <span className="text-[10px] opacity-65">{lang === "en" ? "حفظ قواعد المواعيد" : "Save slot rules"}</span>
            </span>
            <span className="w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center transition-transform duration-700 group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </button>
        </div>
      </div>

      {/* global capacity */}
      <div className="mt-8 grid md:grid-cols-2 gap-5">
        <div className="rounded-[22px] border-[0.5px] border-line p-6">
          <p className="eyebrow text-espresso/55 !text-[10px]">{L.global}</p>
          <input
            inputMode="numeric"
            className={inputCls + " !text-[40px] font-display !text-espresso mt-3"}
            value={cap}
            onChange={(e) => applyCap(e.target.value.replace(/\D/g, "").slice(0, 2))}
            aria-label={L.global}
          />
          <p className="mt-3 text-[11.5px] text-espresso/55">{L.globalHint}</p>
        </div>
        <div className="rounded-[22px] border-[0.5px] border-line p-6">
          <p className="eyebrow text-espresso/55 !text-[10px]">{L.rules}</p>
          <p className="mt-2 text-[11.5px] text-espresso/55">{L.rulesHint}</p>

          <div className="mt-4 space-y-2">
            {rules.length === 0 && <p className="text-[12.5px] text-espresso/45">—</p>}
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={r.hour}
                  onChange={(e) => applyRules(rules.map((x, k) => (k === i ? { ...x, hour: Number(e.target.value) } : x)))}
                  className="h-9 rounded-full border-[0.5px] border-espresso/20 px-3 text-[13px] text-espresso tabular-nums bg-alabaster focus-visible:shadow-[0_0_0_3px_#faeba6]"
                  aria-label={L.hour}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hh(h)}
                    </option>
                  ))}
                </select>
                <span className="text-[12px] text-espresso/55">←</span>
                <input
                  inputMode="numeric"
                  value={String(r.capacity)}
                  onChange={(e) => applyRules(rules.map((x, k) => (k === i ? { ...x, capacity: Math.max(1, Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 1) } : x)))}
                  className="w-16 h-9 rounded-full border-[0.5px] border-espresso/20 px-3 text-center text-[13px] text-espresso tabular-nums bg-alabaster focus-visible:shadow-[0_0_0_3px_#faeba6]"
                  aria-label={L.count}
                />
                <span className="text-[12px] text-espresso/55 flex-1">{lang === "ar" ? "شخص → تُشطب" : "guests → closes"}</span>
                <button
                  onClick={() => applyRules(rules.filter((_, k) => k !== i))}
                  className="w-8 h-8 rounded-full border-[0.5px] border-espresso/20 grid place-items-center text-espresso/70 hover:bg-espresso hover:text-alabaster transition-colors"
                  aria-label={L.del}
                >
                  <PlusIcon className="rotate-45" />
                </button>
              </div>
            ))}
            <button
              onClick={() => applyRules([...rules, { hour: rules.length ? Math.min(21, rules[rules.length - 1].hour + 1) : 14, capacity: 2 }])}
              className="mt-2 inline-flex items-center gap-2 h-9 px-4 rounded-full border-[0.5px] border-espresso/30 text-[12.5px] text-espresso hover:bg-butter/70 transition-colors"
            >
              {L.add}
            </button>
          </div>
        </div>
      </div>

      {/* live counter */}
      <div className="mt-8 rounded-[24px] border-[0.5px] border-line overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-powder/50 border-b-[0.5px] border-line">
          <p className="eyebrow text-espresso/60 !text-[10px]">{L.live}</p>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="h-9 rounded-full border-[0.5px] border-espresso/20 px-4 text-[13px] text-espresso tabular-nums bg-alabaster focus-visible:shadow-[0_0_0_3px_#faeba6]"
            aria-label={L.live}
          />
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line/50">
          {slots.map((s) => {
            const key = slotKey(date, s.time);
            const taken = occupancy[key] ?? 0;
            const rule = rules.find((r) => r.hour === s.hour);
            const capFor = rule ? rule.capacity : capacity;
            const isBlocked = blocked.has(key);
            const past = !s.available && !isBlocked && taken < capFor;
            const status = isBlocked ? L.blocked : !s.available && taken >= capFor ? L.full : past ? L.passed : L.open;
            const tone = isBlocked
              ? "bg-espresso/[0.06] text-espresso/60"
              : taken >= capFor
                ? "bg-espresso text-alabaster"
                : past
                  ? "border-[0.5px] border-dashed border-espresso/25 text-espresso/45"
                  : "bg-butter text-espresso";
            return (
              <li key={s.time} className="bg-alabaster px-5 py-4 flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-display text-[20px] text-espresso tabular-nums" dir="ltr">
                    {s.time}
                  </span>
                  <span className="block text-[11.5px] text-espresso/55">
                    {L.taken}: {taken} / {capFor}
                    {rule ? ` ★` : ""}
                  </span>
                </span>
                <span className={cn("h-7 px-3 rounded-full text-[11px] inline-flex items-center", tone)}>{status}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* sticky save + toast */}
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
              <span className="text-butter">●</span> {L.save}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setCap(String(store.settings.slotCapacity ?? 3));
                  setRules(store.settings.slotRules ?? []);
                }}
                className="h-11 px-5 rounded-full text-[12.5px] text-alabaster/70 hover:text-alabaster transition-colors"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={save} className="group h-11 ps-6 pe-2 rounded-full bg-butter text-espresso text-[13.5px] inline-flex items-center gap-4 transition-transform duration-500 hover:scale-[1.02]">
                <span className="flex flex-col items-start leading-tight">
                  <span>{L.save}</span>
                  <span className="text-[10px] opacity-70">{lang === "en" ? "حفظ قواعد المواعيد" : "Save slot rules"}</span>
                </span>
                <span className="w-8 h-8 rounded-full bg-espresso text-butter grid place-items-center">
                  <ArrowIcon className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="text-[13.5px]">{L.saved}</span>
                <span className="text-[11.5px] opacity-75">{L.savedAlt}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
