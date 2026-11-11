import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { ARTISANS, CATEGORY_LABEL, SHOW_ARTISAN_IMAGES, formatDuration, formatQAR, type Category, type Service } from "../lib/data";
import { admin as storeAdmin, resolveServices, useStore, type Booking as AdminBooking } from "../lib/store";
import {
  PAYMENTS_ENABLED,
  downloadICS,
  formatLongDate,
  getSlots,
  makeReference,
  qatarNow,
  sameDay,
  whatsappMessage,
  whatsappUrl,
  type BookingSummary,
} from "../lib/booking";
import { AppleIcon, ArrowIcon, BackIcon, CheckIcon, CloseIcon, EASE, LogoImg, Magnetic, PlusIcon, WhatsAppIcon } from "./ui";
import { cn } from "../utils/cn";

/** Concise WhatsApp inquiry built from the services chosen so far (steps 1–2). */
function quickInquiry(lang: "en" | "ar", services: Service[]) {
  const lines = services.map((s) => `• ${lang === "ar" ? s.nameAr : s.name} — ${formatQAR(s.price, lang)}`).join("\n");
  const dur = services.reduce((a, s) => a + s.duration, 0);
  const total = services.reduce((a, s) => a + s.price, 0);
  if (lang === "ar") {
    return [
      `السلام عليكم within ✨`,
      `أرغب بحجز المواعيد التالية:`,
      services.length ? lines : "• (لم أحدّد علاجات بعد)",
      services.length ? `\nالمدة التقديرية: ${formatDuration(dur, lang)}\nالإجمالي: ${formatQAR(total, lang)}` : "",
      `\nهل يمكنكم إرسال المواعيد المتاحة؟`,
    ].join("\n");
  }
  return [
    `Hello within ✨`,
    `I'd like to book the following:`,
    services.length ? lines : "• (haven't chosen yet)",
    services.length ? `\nEstimated duration: ${formatDuration(dur, lang)}\nTotal: ${formatQAR(total, lang)}` : "",
    `\nCould you share your available times?`,
  ].join("\n");
}

type Props = { open: boolean; onClose: () => void; initialService: string | null; cart: string[]; setCart: (v: string[] | ((c: string[]) => string[])) => void };
type Tab = "all" | Category;

export function BookingDrawer({ open, onClose, initialService, cart, setCart }: Props) {
  const { t, lang, dir } = useLang();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0); // 0..3, 4 = confirmed
  const [direction, setDirection] = useState(1);
  const [tab, setTab] = useState<Tab>("all");
  const [showMenu, setShowMenu] = useState(false);
  const [artisan, setArtisan] = useState<string>("any");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [deposit, setDeposit] = useState<"half" | "full">("half");
  const [method, setMethod] = useState<"apple" | "card">("apple");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ref, setRef] = useState("");

  // Live menu: reflects admin price edits + availability
  const store = useStore();
  const menu = useMemo(() => resolveServices(store), [store]);

  // Open / reset
  useEffect(() => {
    if (!open) return;
    if (step === 3) {
      setStep(0);
      setCart([]);
      setArtisan("any");
      setDate(null);
      setTime(null);
      setNotes("");
      setCard({ number: "", exp: "", cvc: "" });
      setRef("");
    }
    if (initialService) {
      setCart((c) => (c.includes(initialService) ? c : [...c, initialService]));
      if (step === 3) setStep(0);
    }
    setError(null);
    const id = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 650);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialService]);

  // Keyboard: Esc + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, processing]);

  // On step change: scroll to top & focus heading
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    const id = setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 700);
    return () => clearTimeout(id);
  }, [step]);

  const chosen = useMemo(() => menu.filter((s) => cart.includes(s.id)), [menu, cart]);
  const totalPrice = chosen.reduce((a, s) => a + s.price, 0);
  const totalDuration = chosen.reduce((a, s) => a + s.duration, 0);
  const due = deposit === "half" ? Math.round(totalPrice / 2) : totalPrice;
  const artisanObj = ARTISANS.find((a) => a.id === artisan);
  const artisanName = artisanObj ? (lang === "ar" ? artisanObj.nameAr : artisanObj.name) : t.drawer.anyTitle;

  const toggle = (id: string) => {
    setError(null);
    setCart((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  const validate = (): string | null => {
    if (step === 0 && !cart.length) return t.drawer.errors.services;
    if (step === 1 && (!date || !time)) return t.drawer.errors.datetime;
    if (step === 2) {
      if (name.trim().length < 2) return t.drawer.errors.name;
      if (!/^[3567]\d{7}$/.test(phone.replace(/\s/g, ""))) return t.drawer.errors.phone;
      if (PAYMENTS_ENABLED && method === "card") {
        const num = card.number.replace(/\s/g, "");
        if (num.length < 16 || !/^\d{2}\s?\/\s?\d{2}$/.test(card.exp) || card.cvc.length < 3) return t.drawer.errors.card;
      }
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step === 1 && date && time) {
      const r = makeReference();
      setRef(r);

      /* AUTO-SEND to WhatsApp — fired inside this click (user gesture),
         so browsers & mobile apps open WhatsApp without blocking it. */
      const url = whatsappUrl(
        whatsappMessage(
          {
            ref: r,
            services: chosen,
            artisanName,
            date,
            time,
            duration: totalDuration,
            total: totalPrice,
            deposit,
            name: name.trim(),
            phone: phone.replace(/\s/g, ""),
            notes: notes.trim(),
          },
          lang,
          formatDuration(totalDuration, lang),
        ),
      );
      const auto = document.createElement("a");
      auto.href = url;
      auto.target = "_blank";
      auto.rel = "noopener noreferrer";
      document.body.appendChild(auto);
      auto.click();
      auto.remove();

      setProcessing(true);
      setTimeout(() => {
        const lines: AdminBooking["services"] = chosen.map((s) => ({
          id: s.id,
          name: s.name,
          nameAr: s.nameAr,
          price: s.price,
          duration: s.duration,
        }));
        const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        // → lands in the atelier Back Office (Orders / Payments)
        storeAdmin.addBooking({
          id: `b_${Date.now()}`,
          ref: r,
          createdAt: new Date().toISOString(),
          date: d,
          time,
          duration: totalDuration,
          total: totalPrice,
          deposit,
          name: name.trim(),
          phone: phone.replace(/\s/g, ""),
          notes: notes.trim(),
          artisan: artisanName,
          method,
          services: lines,
          status: "new",
          payment: PAYMENTS_ENABLED ? (deposit === "full" ? "paid" : "deposit") : "pending",
          depositAmount: PAYMENTS_ENABLED ? due : 0,
        });
        setProcessing(false);
        setDirection(1);
        setStep(3);
      }, 1400);
      return;
    }
    if (step === 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const back = () => {
    setError(null);
    if (step === 0 || step === 3) return onClose();
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const summary: BookingSummary | null =
    date && time
      ? {
          ref,
          services: chosen,
          artisanName,
          date,
          time,
          duration: totalDuration,
          total: totalPrice,
          deposit,
          name: name.trim(),
          phone: phone.replace(/\s/g, ""),
          notes: notes.trim(),
        }
      : null;

  const stepNames = t.drawer.steps;
  const indicator =
    step < 3 ? `0${step + 1} / 03 — ${stepNames[step]}` : `✓ — ${t.drawer.confirmed}`;

  const sideSign = dir === "rtl" ? -1 : 1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-espresso/30 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            onClick={() => !processing && onClose()}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.drawer.title}
            data-lenis-prevent
            className="absolute top-0 bottom-0 end-0 w-full sm:w-[min(600px,100vw)] bg-alabaster flex flex-col shadow-[0_0_120px_-20px_rgba(60,36,36,0.45)]"
            initial={{ x: `${100 * sideSign}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${100 * sideSign}%` }}
            transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-alabaster/90 backdrop-blur-xl border-b-[0.5px] border-line">
              <div className="min-h-24 px-5 sm:px-8 py-3 flex items-center justify-between gap-4 overflow-visible">
                <button
                  onClick={back}
                  aria-label={t.drawer.back}
                  className={cn(
                    "w-10 h-10 rounded-full grid place-items-center text-espresso hover:bg-powder/60 transition-colors duration-500",
                    step === 0 || step === 3 ? "opacity-30" : "",
                  )}
                >
                  <BackIcon />
                </button>
                <p className="eyebrow text-espresso tabular-nums min-w-0 truncate" aria-live="polite">
                  {indicator}
                </p>
                <Magnetic strength={0.45}>
                <span className="flex items-center gap-3 shrink-0">
                  <img
                    src="https://i.postimg.cc/9M2tgrgG/IMG-4209.png"
                    alt="within BEAUTY SALON AND SPA"
                    className="h-7 md:h-8 w-auto object-contain mix-blend-multiply"
                    loading="eager"
                    decoding="async"
                  />
                  <button
                    onClick={onClose}
                    aria-label={t.drawer.close}
                    data-autofocus
                    className="w-10 h-10 rounded-full border-[0.5px] border-espresso/20 grid place-items-center text-espresso transition-all duration-700 hover:bg-butter hover:border-butter hover:rotate-90"
                  >
                    <CloseIcon />
                  </button>
                </span>
                </Magnetic>
              </div>
              {/* progress */}
              <div className="px-5 sm:px-8 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[2px] flex-1 rounded-full bg-line overflow-hidden">
                    <motion.div
                      className="h-full bg-espresso origin-[left] rtl:origin-[right]"
                      initial={false}
                      animate={{ scaleX: step >= i ? 1 : 0 }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                  </div>
                ))}
              </div>
              {/* live totals */}
              <div className="px-5 sm:px-8 py-3.5 flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-espresso/60">
                  <span className={cn("w-1.5 h-1.5 rounded-full transition-colors duration-500", chosen.length ? "bg-butter ring-[0.5px] ring-espresso/30" : "bg-line")} />
                  {chosen.length ? `${chosen.length} × ` : t.drawer.empty}
                  {chosen.length > 0 && (
                    <span className="truncate max-w-[150px] sm:max-w-[220px]">
                      {chosen.map((s) => (lang === "ar" ? s.nameAr : s.name)).join(", ")}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-5">
                  <span className="text-espresso/55">
                    {t.drawer.duration}{" "}
                    <Ticker value={formatDuration(totalDuration, lang)} className="text-espresso" />
                  </span>
                  <span className="text-espresso/55">
                    {t.drawer.total} <Ticker value={formatQAR(totalPrice, lang)} className="text-espresso font-medium" />
                  </span>
                </span>
              </div>
            </div>

            {/* Body */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: 40 * direction * sideSign }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 * direction * sideSign }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="px-5 sm:px-8 pt-10 pb-12"
                >
                  {step === 0 && (
                    <>
                      <StepHeading ref_={headingRef} title={t.drawer.s1.title} accent={t.drawer.s1.accent} sub={t.drawer.s1.sub} />
                      <BasketSummary
                        chosen={chosen}
                        onRemove={toggle}
                        lang={lang}
                        total={totalPrice}
                        duration={totalDuration}
                        labels={{
                          your: lang === "ar" ? "ملخص موعدكِ" : "Your summary",
                          empty: lang === "ar" ? "سلتكِ فارغة — اضغطي «عرض قائمة الخدمات» لبدء الاختيار." : "Your basket is empty — tap “Show the service menu” to start.",
                          add: lang === "ar" ? "إضافة خدمة من القائمة" : "Add another treatment",
                          hide: lang === "ar" ? "إخفاء القائمة" : "Hide menu",
                          remove: lang === "ar" ? "إزالة" : "Remove",
                        }}
                      />
                      <AnimatePresence initial={false}>
                        {showMenu && (
                          <motion.div key="menu" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.55, ease: EASE }} className="overflow-hidden">
                            <StepServices menu={menu} tab={tab} setTab={setTab} selected={cart} toggle={toggle} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        onClick={() => setShowMenu((v) => !v)}
                        aria-expanded={showMenu}
                        className="mt-5 inline-flex items-center gap-3 h-11 px-5 rounded-full border-[0.5px] border-espresso/30 text-[13px] text-espresso hover:bg-powder/60 transition-colors duration-500"
                      >
                        <span className={cn("w-6 h-6 rounded-full bg-espresso text-butter grid place-items-center transition-transform duration-700", showMenu && "rotate-45")}>
                          <PlusIcon />
                        </span>
                        {showMenu
                          ? lang === "ar"
                            ? "إخفاء القائمة"
                            : "Hide menu"
                          : chosen.length > 0
                            ? lang === "ar"
                              ? "إضافة خدمة من القائمة"
                              : "Add another treatment"
                            : lang === "ar"
                              ? "عرض قائمة الخدمات"
                              : "Show the service menu"}
                      </button>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <StepHeading ref_={headingRef} title={t.drawer.s3.title} accent={t.drawer.s3.accent} sub={t.drawer.s3.sub} />
                      <StepDate
                        date={date}
                        time={time}
                        setDate={(d) => {
                          setDate(d);
                          setTime(null);
                          setError(null);
                        }}
                        setTime={(tm) => {
                          setTime(tm);
                          setError(null);
                        }}
                      />
                    </>
                  )}
                  {step === 2 && summary && (
                    <>
                      <StepHeading ref_={headingRef} title={t.drawer.s4.title} accent={t.drawer.s4.accent} sub={t.drawer.s4.sub} />
                      <StepProfile
                        name={name}
                        setName={(v) => {
                          setName(v);
                          setError(null);
                        }}
                        phone={phone}
                        setPhone={(v) => {
                          setPhone(v);
                          setError(null);
                        }}
                        notes={notes}
                        setNotes={setNotes}
                        deposit={deposit}
                        setDeposit={setDeposit}
                        method={method}
                        setMethod={(m) => {
                          setMethod(m);
                          setError(null);
                        }}
                        card={card}
                        setCard={(c) => {
                          setCard(c);
                          setError(null);
                        }}
                        summary={summary}
                      />
                    </>
                  )}
                  {step === 3 && summary && <Confirmation headingRef={headingRef} summary={summary} onDone={onClose} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step < 3 && (
              <div className="sticky bottom-0 z-20 bg-alabaster/95 backdrop-blur-xl border-t-[0.5px] border-line px-5 sm:px-8 pt-4 pb-5">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="overflow-hidden"
                      role="status"
                    >
                      <div className="mb-3 flex items-center gap-3 rounded-full bg-butter/60 ps-3 pe-4 py-2 text-[12.5px] text-espresso">
                        <span className="w-5 h-5 shrink-0 rounded-full border-[0.5px] border-espresso/30 grid place-items-center font-display italic text-[12px]">i</span>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={next}
                  disabled={processing}
                  className="group w-full h-14 rounded-full bg-espresso text-alabaster text-[14px] flex items-center justify-between ps-7 pe-2 transition-shadow duration-700 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)] disabled:opacity-80"
                >
                  <span className="flex items-center gap-2">
                    {step === 2 && PAYMENTS_ENABLED && method === "apple" && <AppleIcon className="w-4 h-4 -mt-0.5" />}
                    {step === 2 ? (PAYMENTS_ENABLED ? (method === "apple" ? `Pay · ${formatQAR(due, lang)}` : `${t.drawer.pay} · ${formatQAR(due, lang)}`) : t.drawer.confirm) : t.drawer.continue}
                  </span>
                  <span className="w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center transition-transform duration-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    <ArrowIcon />
                  </span>
                </button>
                {step < 2 && (
                  <a
                    href={whatsappUrl(quickInquiry(lang, chosen))}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-3 mx-auto flex items-center gap-2 w-fit text-[12.5px] text-espresso/60 hover:text-espresso transition-colors duration-500 rounded-sm"
                    aria-label={lang === "ar" ? "أو احجزي عبر واتساب" : "Or book via WhatsApp"}
                  >
                    <span className="w-7 h-7 rounded-full border-[0.5px] border-espresso/20 grid place-items-center transition-all duration-700 group-hover:bg-butter group-hover:border-butter">
                      <WhatsAppIcon className="w-[13px] h-[13px]" />
                    </span>
                    {lang === "ar" ? "أو أكملي الحجز عبر واتساب" : "Or complete the booking on WhatsApp"}
                  </a>
                )}
              </div>
            )}

            {/* Processing veil */}
            <AnimatePresence>
              {processing && (
                <motion.div
                  className="absolute inset-0 z-30 bg-alabaster/85 backdrop-blur-md grid place-items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  role="status"
                  aria-live="assertive"
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative w-20 h-20">
                      <motion.svg viewBox="0 0 80 80" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}>
                        <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(60,36,36,0.1)" strokeWidth="0.5" />
                        <circle cx="40" cy="40" r="38" fill="none" stroke="#3c2424" strokeWidth="1" strokeDasharray="40 200" strokeLinecap="round" />
                      </motion.svg>
                      <span className="absolute inset-0 grid place-items-center">
                        <LogoImg className="h-7" />
                      </span>
                    </div>
                    <p className="font-display text-[20px] text-espresso accent">{t.drawer.processing}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ───────── Pieces ───────── */

function Ticker({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("relative inline-flex overflow-hidden align-bottom tabular-nums", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* Basket — shows ONLY what the guest picked (menu stays one click away) */
function BasketSummary({
  chosen,
  onRemove,
  lang,
  total,
  duration,
  labels,
}: {
  chosen: Service[];
  onRemove: (id: string) => void;
  lang: "en" | "ar";
  total: number;
  duration: number;
  labels: { your: string; empty: string; add: string; hide: string; remove: string };
}) {
  return (
    <div className="mb-7">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <p className="eyebrow text-espresso/60">
          {labels.your} — {String(chosen.length).padStart(2, "0")}
        </p>
        <p className="text-[12.5px] text-espresso/60 tabular-nums" dir="ltr">
          {formatDuration(duration, lang)} · <span className="font-display text-[19px] text-espresso">{formatQAR(total, lang)}</span>
        </p>
      </div>

      {chosen.length === 0 ? (
        <div className="rounded-[20px] border-[0.5px] border-dashed border-espresso/20 px-6 py-9 text-center">
          <LogoImg className="h-7 md:h-8 mx-auto" alt="within" />
          <p className="mt-2 text-[13px] text-espresso/60">{labels.empty}</p>
        </div>
      ) : (
        <ul className="rounded-[20px] border-[0.5px] border-line overflow-hidden divide-y-[0.5px] divide-line">
          {chosen.map((s) => (
            <li key={s.id} className="flex items-center gap-3.5 px-4 py-3 bg-alabaster">
              <img src={s.image} alt="" loading="lazy" className="w-11 h-11 rounded-xl object-cover shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] leading-tight text-espresso truncate">{lang === "ar" ? s.nameAr : s.name}</span>
                <span className="block text-[11.5px] text-espresso/50">{formatDuration(s.duration, lang)}</span>
              </span>
              <span className="font-display text-[18px] text-espresso tabular-nums whitespace-nowrap">{formatQAR(s.price, lang)}</span>
              <button
                onClick={() => onRemove(s.id)}
                aria-label={`${labels.remove} — ${s.name}`}
                className="w-8 h-8 shrink-0 rounded-full border-[0.5px] border-espresso/20 grid place-items-center text-espresso/70 hover:bg-espresso hover:text-alabaster transition-colors duration-500"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepHeading({
  title,
  accent,
  sub,
  ref_,
}: {
  title: string;
  accent: string;
  sub: string;
  ref_: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="mb-9">
      <h2 ref={ref_} tabIndex={-1} className="font-display font-light text-espresso text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.03em] rounded-sm">
        {title} <span className="accent">{accent}</span>
      </h2>
      <p className="mt-4 max-w-[400px] text-[13.5px] leading-[1.7] text-espresso/60">{sub}</p>
    </div>
  );
}

function StepServices({
  menu,
  tab,
  setTab,
  selected,
  toggle,
}: {
  menu: Service[];
  tab: Tab;
  setTab: (t: Tab) => void;
  selected: string[];
  toggle: (id: string) => void;
}) {
  const { t, lang } = useLang();
  const store = useStore();
  const list = menu.filter((s) => tab === "all" || s.category === tab);
  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: t.menu.all },
    ...(Object.keys(CATEGORY_LABEL) as Category[])
      .filter((c) => menu.some((s) => s.category === c))
      .map((c) => ({ id: c as Tab, label: CATEGORY_LABEL[c][lang] })),
  ];
  return (
    <div>
      <div role="tablist" className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-line p-1 mb-7">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={cn("relative h-9 px-5 rounded-full text-[12.5px] transition-colors duration-500", tab === tb.id ? "text-alabaster" : "text-espresso/70 hover:text-espresso")}
          >
            {tab === tb.id && <motion.span layoutId="drawer-tab" className="absolute inset-0 rounded-full bg-espresso" transition={{ duration: 0.6, ease: EASE }} />}
            <span className="relative z-10">{tb.label}</span>
          </button>
        ))}
      </div>
      <motion.ul layout className="grid gap-2.5">
        <AnimatePresence initial={false}>
          {list.map((s, i) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: i * 0.025 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <ServiceCard
                s={s}
                active={selected.includes(s.id)}
                onToggle={() => toggle(s.id)}
                lang={lang}
                paused={!!store.overrides[s.id]?.unavailable}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

function ServiceCard({
  s,
  active,
  onToggle,
  lang,
  paused,
}: {
  s: Service;
  active: boolean;
  onToggle: () => void;
  lang: "en" | "ar";
  paused?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      disabled={paused}
      title={paused ? (lang === "ar" ? "هذه الخدمة غير متوفرة حالياً" : "This treatment is unavailable at the moment") : undefined}
      className={cn(
        "group w-full flex items-center gap-4 rounded-[20px] border-[0.5px] p-3 pe-5 text-start transition-all duration-500",
        paused && "opacity-55 cursor-not-allowed bg-espresso/[0.02] border-line",
        !paused && active ? "bg-powder border-powder" : "bg-alabaster border-line hover:border-espresso/25 hover:shadow-[0_0_0_3px_rgba(250,235,166,0.7)]",
      )}
    >
      <img src={s.image} alt="" loading="lazy" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-display text-[21px] leading-tight text-espresso truncate">{lang === "ar" ? s.nameAr : s.name}</span>
        {paused && (
          <span className="mt-1 inline-flex items-center h-5 px-2 rounded-full bg-butter/70 text-[9.5px] tracking-[0.1em] uppercase text-espresso">
            {lang === "ar" ? "غير متوفرة" : "Unavailable"}
          </span>
        )}
        <span className="mt-1.5 flex items-center gap-2">
          <span className={cn("inline-flex items-center h-6 px-2.5 rounded-full text-[10px] tracking-[0.14em]", active ? "bg-alabaster/70 text-espresso" : "border-[0.5px] border-espresso/15 text-espresso/65")}>
            {formatDuration(s.duration, lang)}
          </span>
          <span className="text-[11px] text-espresso/40 truncate">{lang === "ar" ? s.name : s.nameAr}</span>
        </span>
      </span>
      <span className="font-display text-[19px] text-espresso tabular-nums whitespace-nowrap">{formatQAR(s.price, lang)}</span>
      <span
        className={cn(
          "w-8 h-8 rounded-full grid place-items-center shrink-0 transition-all duration-500",
          active ? "bg-espresso text-butter" : "border-[0.5px] border-espresso/20 text-transparent group-hover:text-espresso/40",
          paused && "border-line",
        )}
      >
        <CheckIcon />
      </span>
    </button>
  );
}

function StepArtisan({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t, lang } = useLang();
  const any = value === "any";
  return (
    <div className="grid gap-3">
      <button
        onClick={() => onChange("any")}
        aria-pressed={any}
        className={cn(
          "relative overflow-hidden flex items-center gap-5 rounded-[24px] p-5 text-start border-[0.5px] transition-all duration-500",
          any ? "bg-powder border-powder" : "border-line hover:shadow-[0_0_0_3px_rgba(250,235,166,0.7)]",
        )}
      >
          <span className="w-16 h-16 rounded-full bg-alabaster grid place-items-center shrink-0 border-[0.5px] border-line">
            <LogoImg className="h-7" alt="within" />
          </span>
        <span className="flex-1">
          <span className="block font-display text-[24px] text-espresso leading-tight">{t.drawer.anyTitle}</span>
          <span className="block mt-1 text-[12px] text-espresso/60">{t.drawer.anySub}</span>
        </span>
        <Radio active={any} />
      </button>

      <div className="grid grid-cols-3 gap-3 mt-2">
        {ARTISANS.map((a) => {
          const active = value === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onChange(a.id)}
              aria-pressed={active}
              className={cn(
                "group text-start rounded-[22px] p-2 pb-4 border-[0.5px] transition-all duration-500",
                active ? "bg-powder border-powder" : "border-line hover:shadow-[0_0_0_3px_rgba(250,235,166,0.7)]",
              )}
            >
              <span className="block aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[14px] bg-powder grid place-items-center">
                {SHOW_ARTISAN_IMAGES ? (
                  <img src={a.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105" />
                ) : (
                  <span aria-hidden className="font-display text-[34px] leading-none text-espresso/25">
                    {(lang === "ar" ? a.nameAr : a.name).charAt(0)}
                  </span>
                )}
              </span>
              <span className="mt-3 px-1.5 flex items-center justify-between gap-2">
                <span className="font-display text-[20px] text-espresso accent">{lang === "ar" ? a.nameAr : a.name}</span>
                <Radio active={active} small />
              </span>
              <span className="block px-1.5 mt-0.5 text-[10.5px] leading-snug text-espresso/55">{lang === "ar" ? a.titleAr : a.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Radio({ active, small }: { active: boolean; small?: boolean }) {
  return (
    <span className={cn("rounded-full border-[0.5px] grid place-items-center shrink-0 transition-all duration-500", small ? "w-5 h-5" : "w-7 h-7", active ? "bg-espresso border-espresso" : "border-espresso/25")}>
      <motion.span initial={false} animate={{ scale: active ? 1 : 0 }} transition={{ duration: 0.4, ease: EASE }} className={cn("rounded-full bg-butter", small ? "w-1.5 h-1.5" : "w-2 h-2")} />
    </span>
  );
}

function StepDate({
  date,
  time,
  setDate,
  setTime,
}: {
  date: Date | null;
  time: string | null;
  setDate: (d: Date) => void;
  setTime: (t: string) => void;
}) {
  const { t, lang } = useLang();
  const store = useStore();
  const now = qatarNow();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = new Date(today.getTime() + 60 * 86400000);
  const [view, setView] = useState(() => new Date((date ?? today).getFullYear(), (date ?? today).getMonth(), 1));
  const locale = lang === "ar" ? "ar-QA-u-nu-latn" : "en-GB";

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const offset = view.getDay();
  const cells: (Date | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(locale, { weekday: "narrow" }));

  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(view.getFullYear(), view.getMonth() + 1, 1) <= maxDate;
  const occupancy = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of store.bookings) {
      if (b.status === "cancelled") continue;
      const k = `${b.date}|${b.time}`;
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [store.bookings]);
  const blockedSet = useMemo(() => new Set(store.settings.blockedSlots ?? []), [store.settings.blockedSlots]);
  const capacity = store.settings.slotCapacity ?? 3;
  const rules = store.settings.slotRules ?? [];
  const slots = date ? getSlots(date, occupancy, capacity, blockedSet, rules) : [];
  const anyAvail = slots.some((s) => s.available);

  return (
    <div>
      <div className="rounded-[24px] border-[0.5px] border-line p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-[26px] text-espresso">
            {view.toLocaleDateString(locale, { month: "long" })} <span className="text-espresso/40">{view.getFullYear()}</span>
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={!canPrev}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="w-9 h-9 rounded-full border-[0.5px] border-line grid place-items-center text-espresso disabled:opacity-25 hover:bg-powder/60 transition-colors"
            >
              <BackIcon className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!canNext}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              aria-label="Next month"
              className="w-9 h-9 rounded-full border-[0.5px] border-line grid place-items-center text-espresso disabled:opacity-25 hover:bg-powder/60 transition-colors"
            >
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w, i) => (
            <span key={i} className="text-[10px] uppercase tracking-[0.16em] text-espresso/40 py-2">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const disabled = d < today || d > maxDate;
            const isSel = date && sameDay(d, date);
            const isToday = sameDay(d, today);
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => setDate(d)}
                aria-pressed={!!isSel}
                aria-label={d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                className={cn(
                  "relative aspect-square rounded-full text-[13.5px] tabular-nums transition-all duration-500",
                  disabled && "text-espresso/20 cursor-not-allowed",
                  !disabled && !isSel && "text-espresso hover:bg-powder/70",
                  isSel && "bg-espresso text-alabaster",
                )}
              >
                {d.getDate()}
                {isToday && <span className={cn("absolute bottom-[18%] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", isSel ? "bg-butter" : "bg-espresso/50")} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        {!date ? (
          <Quiet>{t.drawer.selectDate}</Quiet>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <p className="font-display text-[22px] text-espresso accent">{formatLongDate(date, lang)}</p>
              <p className="text-[10.5px] text-espresso/45" dir="ltr">GMT+3 · Doha</p>
            </div>
            {anyAvail ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {slots.map((s) => {
                  const sel = time === s.time;
                  return (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setTime(s.time)}
                      aria-pressed={sel}
                      className={cn(
                        "h-11 rounded-full text-[13px] tabular-nums border-[0.5px] transition-all duration-500",
                        !s.available && "border-transparent bg-espresso/[0.03] text-espresso/25 line-through decoration-[0.5px] cursor-not-allowed",
                        s.available && !sel && "border-espresso/20 text-espresso hover:border-espresso/40 hover:shadow-[0_0_0_3px_rgba(250,235,166,0.9)]",
                        sel && "bg-espresso border-espresso text-alabaster shadow-[0_0_0_3px_rgba(250,235,166,0.9)]",
                      )}
                      dir="ltr"
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Quiet>{t.drawer.noSlots}</Quiet>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Quiet({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[20px] border-[0.5px] border-dashed border-espresso/20 px-6 py-8 text-center">
      <LogoImg className="h-7 mx-auto" alt="within" />
      <p className="mt-2 text-[13px] text-espresso/60">{children}</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block group">
      <span className="flex items-baseline justify-between">
        <span className="eyebrow text-espresso/55 !text-[10px]">{label}</span>
        {hint && <span className="text-[10.5px] text-espresso/40">{hint}</span>}
      </span>
      <span className="mt-2 flex items-center border-b-[0.5px] border-espresso/25 transition-colors duration-500 group-focus-within:border-espresso">{children}</span>
    </label>
  );
}

function StepProfile(p: {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  deposit: "half" | "full";
  setDeposit: (v: "half" | "full") => void;
  method: "apple" | "card";
  setMethod: (v: "apple" | "card") => void;
  card: { number: string; exp: string; cvc: string };
  setCard: (c: { number: string; exp: string; cvc: string }) => void;
  summary: BookingSummary;
}) {
  const { t, lang } = useLang();
  const inputCls = "w-full bg-transparent py-3 text-[16px] text-espresso focus:outline-none focus-visible:shadow-none";
  const total = p.summary.total;
  const half = Math.round(total / 2);

  return (
    <div className="space-y-10">
      <div className="space-y-7">
        <Field label={t.drawer.name}>
          <input className={inputCls} value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder={t.drawer.namePh} autoComplete="name" />
        </Field>
        <Field label={t.drawer.phone}>
          <span dir="ltr" className="flex items-center w-full">
            <span className="pe-3 me-3 border-e-[0.5px] border-line text-[15px] text-espresso/70 tabular-nums">🇶🇦 +974</span>
            <input
              className={inputCls + " tabular-nums"}
              value={p.phone}
              inputMode="tel"
              autoComplete="tel-national"
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 8);
                p.setPhone(d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d);
              }}
              placeholder={t.drawer.phonePh}
            />
          </span>
        </Field>
        <Field label={t.drawer.notes} hint={t.drawer.optional}>
          <textarea className={inputCls + " resize-none"} rows={2} value={p.notes} onChange={(e) => p.setNotes(e.target.value)} placeholder={t.drawer.notesPh} />
        </Field>
      </div>

      <Ticket summary={p.summary} />

      {/* Deposit — hidden while checkout runs through WhatsApp only */}
      {PAYMENTS_ENABLED && (
      <div>
        <p className="eyebrow text-espresso/55 !text-[10px] mb-3">{t.drawer.deposit}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {(["half", "full"] as const).map((d) => {
            const active = p.deposit === d;
            return (
              <button
                key={d}
                onClick={() => p.setDeposit(d)}
                aria-pressed={active}
                className={cn(
                  "rounded-[20px] border-[0.5px] p-4 text-start transition-all duration-500",
                  active ? "bg-powder border-powder" : "border-line hover:shadow-[0_0_0_3px_rgba(250,235,166,0.7)]",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-[12.5px] text-espresso/70">{d === "half" ? t.drawer.half : t.drawer.full}</span>
                  <Radio active={active} small />
                </span>
                <span className="block mt-3 font-display text-[26px] text-espresso tabular-nums">{formatQAR(d === "half" ? half : total, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Payment — hidden while checkout runs through WhatsApp only */}
      {PAYMENTS_ENABLED && (
      <div>
        <p className="eyebrow text-espresso/55 !text-[10px] mb-3">{t.drawer.method}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => p.setMethod("apple")}
            aria-pressed={p.method === "apple"}
            className={cn(
              "h-14 rounded-full flex items-center justify-center gap-1.5 text-[15px] transition-all duration-500",
              p.method === "apple" ? "bg-espresso text-alabaster shadow-[0_0_0_3px_rgba(250,235,166,0.95)]" : "border-[0.5px] border-espresso/25 text-espresso hover:bg-powder/50",
            )}
            dir="ltr"
          >
            <AppleIcon className="w-[18px] h-[18px] -mt-0.5" />
            <span className="font-medium tracking-[-0.01em]">Pay</span>
          </button>
          <button
            onClick={() => p.setMethod("card")}
            aria-pressed={p.method === "card"}
            className={cn(
              "h-14 rounded-full flex items-center justify-center gap-2 text-[13.5px] transition-all duration-500",
              p.method === "card" ? "bg-espresso text-alabaster shadow-[0_0_0_3px_rgba(250,235,166,0.95)]" : "border-[0.5px] border-espresso/25 text-espresso hover:bg-powder/50",
            )}
          >
            <span className="w-5 h-3.5 rounded-[3px] border-[0.5px] border-current relative">
              <span className="absolute top-1 inset-x-0 h-[1.5px] bg-current opacity-60" />
            </span>
            {t.drawer.card}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {p.method === "card" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="pt-6" dir="ltr">
                {/* Card preview */}
                <div className="relative aspect-[1.7/1] max-w-[340px] mx-auto rounded-[22px] bg-espresso text-alabaster p-6 overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full border-[0.5px] border-alabaster/15" />
                  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-[0.5px] border-alabaster/15" />
                  <div className="flex items-start justify-between">
                    <span className="w-10 h-7 rounded-md bg-butter/90" />
                    <LogoImg className="h-6" alt="within" />
                  </div>
                  <p className="absolute left-6 bottom-12 font-display text-[22px] tracking-[0.12em] tabular-nums keep-tracking">
                    {(p.card.number || "•••• •••• •••• ••••").padEnd(19, "•")}
                  </p>
                  <div className="absolute left-6 right-6 bottom-5 flex justify-between text-[10px] tracking-[0.2em] uppercase text-alabaster/60 keep-tracking">
                    <span>{p.summary.name || "Guest"}</span>
                    <span>{p.card.exp || "MM/YY"}</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-6 gap-5">
                  <div className="col-span-6">
                    <Field label={t.drawer.cardNumber}>
                      <input
                        className={inputCls + " tabular-nums"}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={p.card.number}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "").slice(0, 16);
                          p.setCard({ ...p.card, number: d.replace(/(.{4})/g, "$1 ").trim() });
                        }}
                      />
                    </Field>
                  </div>
                  <div className="col-span-3">
                    <Field label={t.drawer.expiry}>
                      <input
                        className={inputCls + " tabular-nums"}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="08 / 28"
                        value={p.card.exp}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                          p.setCard({ ...p.card, exp: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d });
                        }}
                      />
                    </Field>
                  </div>
                  <div className="col-span-3">
                    <Field label={t.drawer.cvc}>
                      <input
                        className={inputCls + " tabular-nums"}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="•••"
                        value={p.card.cvc}
                        onChange={(e) => p.setCard({ ...p.card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-5 text-center text-[11px] text-espresso/45">{t.drawer.secure}</p>
      </div>
      )}
    </div>
  );
}

/* ───────── Editorial invitation ticket ───────── */
function Ticket({ summary, showRef }: { summary: BookingSummary; showRef?: boolean }) {
  const { t, lang } = useLang();
  const due = summary.deposit === "half" ? Math.round(summary.total / 2) : summary.total;
  return (
    <div className="relative rounded-[24px] bg-alabaster border-[0.5px] border-espresso/15 shadow-[0_30px_60px_-40px_rgba(60,36,36,0.4)]">
      {/* top */}
      <div className="p-6 sm:p-7 bg-powder/50 rounded-t-[24px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-espresso/55 !text-[9.5px]">{t.drawer.ticket}</p>
            <p className="mt-2 font-display text-[30px] leading-none text-espresso">
              <span className="accent">{summary.name || t.drawer.guest}</span>
            </p>
          </div>
          <LogoImg className="h-8" alt="within" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-5">
          <div>
            <p className="eyebrow text-espresso/45 !text-[9px]">{t.drawer.when}</p>
            <p className="mt-1.5 text-[13px] text-espresso leading-snug">
              {formatLongDate(summary.date, lang)}
              <br />
              <span className="font-display text-[22px] tabular-nums" dir="ltr">{summary.time}</span>
            </p>
          </div>
          <div>
            <p className="eyebrow text-espresso/45 !text-[9px]">{t.drawer.with}</p>
            <p className="mt-1.5 text-[13px] text-espresso leading-snug">{summary.artisanName}</p>
            <p className="mt-1 text-[11.5px] text-espresso/55">{formatDuration(summary.duration, lang)}</p>
          </div>
        </div>
      </div>

      {/* perforation */}
      <div className="relative h-0">
        <span className="absolute -top-3 -start-3 w-6 h-6 rounded-full bg-alabaster border-[0.5px] border-espresso/15 [clip-path:inset(0_0_0_50%)] rtl:[clip-path:inset(0_50%_0_0)]" />
        <span className="absolute -top-3 -end-3 w-6 h-6 rounded-full bg-alabaster border-[0.5px] border-espresso/15 [clip-path:inset(0_50%_0_0)] rtl:[clip-path:inset(0_0_0_50%)]" />
        <div className="mx-6 border-t-[0.5px] border-dashed border-espresso/25" />
      </div>

      {/* bottom */}
      <div className="p-6 sm:p-7">
        <ul className="space-y-2.5">
          {summary.services.map((s) => (
            <li key={s.id} className="flex items-baseline gap-3 text-[13.5px] text-espresso">
              <span>{lang === "ar" ? s.nameAr : s.name}</span>
              <span className="flex-1 border-b-[0.5px] border-dotted border-espresso/25 translate-y-[-3px]" />
              <span className="tabular-nums">{formatQAR(s.price, lang)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t-[0.5px] border-line flex items-end justify-between">
          <div>
            <p className="eyebrow text-espresso/45 !text-[9px]">{t.drawer.total}</p>
            <p className="mt-1 font-display text-[30px] leading-none text-espresso tabular-nums">{formatQAR(summary.total, lang)}</p>
          </div>
          <div className="text-end">
            {PAYMENTS_ENABLED ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-3 py-1 text-[11px] text-espresso">
                  {t.drawer.dueNow} · {formatQAR(due, lang)}
                </span>
                {summary.deposit === "half" && (
                  <p className="mt-1.5 text-[10.5px] text-espresso/50">
                    {t.drawer.remaining} · {formatQAR(summary.total - due, lang)}
                  </p>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-3 py-1 text-[11px] text-espresso">
                {t.drawer.conf.wa}
              </span>
            )}
          </div>
        </div>
        {showRef && (
          <div className="mt-5 pt-4 border-t-[0.5px] border-line flex items-center justify-between">
            <p className="eyebrow text-espresso/45 !text-[9px]">{t.drawer.conf.ref}</p>
            <p className="font-display text-[20px] text-espresso tabular-nums tracking-[0.06em]" dir="ltr">
              {summary.ref}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Confirmation({
  summary,
  onDone,
  headingRef,
}: {
  summary: BookingSummary;
  onDone: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { t, lang } = useLang();
  const msg = whatsappMessage(summary, lang, formatDuration(summary.duration, lang));
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <LogoImg className="h-7 md:h-8 w-auto mx-auto object-contain mix-blend-multiply mb-5" alt="within BEAUTY SALON AND SPA" />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        className="w-16 h-16 mx-auto rounded-full bg-butter grid place-items-center text-espresso mb-8"
      >
        <CheckIcon className="w-6 h-6" />
      </motion.div>
      <p className="eyebrow text-espresso/55">{t.drawer.conf.eyebrow}</p>
      <h2 ref={headingRef} tabIndex={-1} className="mt-4 font-display font-light text-espresso text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.03em] rounded-sm">
        {t.drawer.conf.title} <span className="accent">{t.drawer.conf.accent}</span>
      </h2>
      <p className="mt-4 max-w-[420px] text-[13.5px] leading-[1.7] text-espresso/60">{t.drawer.conf.sub}</p>

      <div className="mt-9">
        <Ticket summary={summary} showRef />
      </div>

      <div className="mt-8 grid gap-3">
        <a
          href={whatsappUrl(msg)}
          target="_blank"
          rel="noreferrer"
          className="group h-14 rounded-full bg-espresso text-alabaster text-[14px] flex items-center justify-between ps-7 pe-2 transition-shadow duration-700 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]"
        >
          <span className="flex items-center gap-3">
            <WhatsAppIcon />
            {t.drawer.conf.wa}
          </span>
          <span className="w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center">
            <ArrowIcon />
          </span>
        </a>
        <button
          onClick={() => {
            try {
              void navigator.clipboard.writeText(msg);
            } catch {
              /* clipboard unavailable */
            }
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2600);
          }}
          className="h-14 rounded-full border-[0.5px] border-espresso/25 text-espresso text-[14px] flex items-center justify-center gap-3 transition-colors duration-500 hover:bg-powder/60"
          aria-live="polite"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
            <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" />
            <path d="M15.5 5.5h-8a3 3 0 00-3 3v8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          {copied
            ? lang === "ar"
              ? "تم نسخ الرسالة ✓"
              : "Message copied ✓"
            : lang === "ar"
              ? "نسخ الرسالة وإلصقها في واتساب"
              : "Copy message into WhatsApp"}
        </button>

        <button
          onClick={() => downloadICS(summary)}
          className="h-14 rounded-full border-[0.5px] border-espresso/25 text-espresso text-[14px] flex items-center justify-center gap-3 transition-colors duration-500 hover:bg-powder/60"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
            <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1" />
            <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          {t.drawer.conf.ics}
        </button>
        <button onClick={onDone} className="mt-2 text-[12.5px] text-espresso/60 hover:text-espresso transition-colors underline-offset-4 hover:underline rounded-sm">
          {t.drawer.conf.done}
        </button>
      </div>
    </div>
  );
}
