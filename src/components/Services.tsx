import { useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useLang } from "../lib/i18n";
import { CATEGORY_LABEL, IMAGES, formatDuration, formatQAR, type Category, type Service } from "../lib/data";
import { isUnavailable, useServices, useStore } from "../lib/store";
import { CheckIcon, EASE, Line, PlusIcon, Reveal, useFinePointer } from "./ui";
import { cn } from "../utils/cn";

type Tab = "all" | Category;
const FOLLOWER_IMAGES = [IMAGES.manicure, IMAGES.pedicure, IMAGES.blowdry, IMAGES.color];

export function Services({ cart, onToggle, onCheckout }: { cart: string[]; onToggle: (id: string) => void; onCheckout: () => void }) {
  const { t, lang } = useLang();
  const fine = useFinePointer();
  const [tab, setTab] = useState<Tab>("all");
  const [hovered, setHovered] = useState<Service | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const menu = useServices();
  const store = useStore();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 22, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 110, damping: 22, mass: 0.6 });

  const groups = useMemo(() => {
    const cats: Category[] = tab === "all" ? ["nails", "hair", "spa"] : [tab];
    return cats.map((c) => ({
      cat: c,
      // available treatments first, unavailable ones pushed to the end
      items: menu
        .filter((s) => s.category === c)
        .sort((x, y) => (isUnavailable(store, x.id) ? 1 : 0) - (isUnavailable(store, y.id) ? 1 : 0)),
    }));
  }, [tab, menu, store]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: t.menu.all, count: menu.length },
    ...(Object.keys(CATEGORY_LABEL) as Category[])
      .filter((c) => menu.some((s) => s.category === c))
      .map((c) => ({ id: c as Tab, label: CATEGORY_LABEL[c][lang], count: menu.filter((s) => s.category === c).length })),
  ];

  const add = (s: Service) => {
    if (isUnavailable(store, s.id)) return;
    onToggle(s.id);
    setJustAdded(cart.includes(s.id) ? null : s.id);
    window.setTimeout(() => setJustAdded((v) => (v === s.id ? null : v)), 2200);
  };

  let counter = 0;

  return (
    <section id="services" className="relative bg-alabaster py-28 md:py-40">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        {/* Heading */}
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <p className="eyebrow text-espresso/60">{t.menu.eyebrow}</p>
            </Reveal>
            <h2 className="mt-6 font-display font-light text-espresso text-[clamp(2.8rem,6vw,6rem)] leading-[0.95] tracking-[-0.03em]">
              <Line>{t.menu.title1}</Line>
              <Line delay={0.1}>
                <span className="accent">{t.menu.accent}</span>
              </Line>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:justify-self-end">
            <Reveal delay={0.15}>
              <p className="max-w-[380px] text-[14.5px] leading-[1.75] text-espresso/65">{t.menu.sub}</p>
              <p className="mt-4 text-[12.5px] text-espresso/55">{t.menu.tapHint}</p>
            </Reveal>
          </div>
        </div>

        {/* Tabs */}
        <Reveal delay={0.1} className="mt-16 flex items-center justify-between gap-6 border-b-[0.5px] border-line pb-6">
          <div role="tablist" aria-label={t.nav.services} className="flex items-center gap-1.5 rounded-full border-[0.5px] border-line p-1">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                role="tab"
                aria-selected={tab === tb.id}
                onClick={() => setTab(tb.id)}
                className={cn(
                  "relative h-10 px-5 rounded-full text-[13px] transition-colors duration-500",
                  tab === tb.id ? "text-alabaster" : "text-espresso/70 hover:text-espresso",
                )}
              >
                {tab === tb.id && (
                  <motion.span layoutId="svc-tab" className="absolute inset-0 rounded-full bg-espresso" transition={{ duration: 0.7, ease: EASE }} />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tb.label}
                  <sup className={cn("text-[9px]", tab === tb.id ? "text-butter" : "text-espresso/40")}>{String(tb.count).padStart(2, "0")}</sup>
                </span>
              </button>
            ))}
          </div>

          {cart.length > 0 && (
            <button
              onClick={onCheckout}
              className="group hidden md:inline-flex items-center gap-3 h-10 ps-5 pe-1.5 rounded-full bg-espresso text-alabaster text-[12.5px] transition-shadow duration-500 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]"
            >
              {lang === "ar" ? "ملخص الموعد" : "View summary"}
              <span className="h-6 min-w-6 px-1.5 rounded-full bg-butter text-espresso text-[10.5px] tabular-nums grid place-items-center">{cart.length}</span>
            </button>
          )}
        </Reveal>

        {/* List */}
        <div
          onMouseMove={(e) => {
            mx.set(e.clientX);
            my.set(e.clientY);
          }}
          onMouseLeave={() => setHovered(null)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {groups.map((g) => (
                <div key={g.cat} className="mt-14 first:mt-10">
                  {tab === "all" && (
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="eyebrow text-espresso">{CATEGORY_LABEL[g.cat][lang]}</span>
                      <span className="flex-1 h-[0.5px] bg-line" />
                    </div>
                  )}
                  <ul>
                    {g.items.map((s) => {
                      counter += 1;
                      const idx = String(counter).padStart(2, "0");
                      const primary = lang === "ar" ? s.nameAr : s.name;
                      const secondary = lang === "ar" ? s.name : s.nameAr;
                      const paused = isUnavailable(store, s.id);
                      const inCart = cart.includes(s.id);
                      return (
                        <li key={s.id} className={cn("border-b-[0.5px] border-line", paused && "opacity-60")}>
                          <button
                            onClick={() => add(s)}
                            onMouseEnter={() => fine && !paused && setHovered(s)}
                            onFocus={() => fine && setHovered(null)}
                            disabled={paused}
                            aria-pressed={inCart}
                            className={cn(
                              "group w-full grid grid-cols-12 items-center gap-x-4 py-6 md:py-7 text-start rounded-md",
                              paused && "cursor-not-allowed",
                            )}
                            aria-label={
                              paused
                                ? `${primary} — ${lang === "ar" ? "غير متوفرة حالياً" : "unavailable at the moment"}`
                                : `${inCart ? (lang === "ar" ? "إزالة من الملخص" : "Remove from summary") : t.menu.reserve} — ${primary}, ${formatDuration(s.duration, lang)}, ${formatQAR(s.price, lang)}`
                            }
                          >
                            <span className="col-span-1 hidden md:block text-[11px] text-espresso/40 tabular-nums">{idx}</span>

                            <span className="col-span-9 md:col-span-6 flex items-center gap-4 min-w-0">
                              {!fine && (
                                <img src={s.image} alt="" loading="lazy" className="w-14 h-16 shrink-0 object-cover rounded-t-full rounded-b-lg" />
                              )}
                              <span className="min-w-0">
                                <span className="block font-display font-light text-espresso text-[26px] md:text-[44px] leading-[1.05] tracking-[-0.02em] transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-3 rtl:group-hover:-translate-x-3">
                                  <span className="group-hover:italic rtl:group-hover:not-italic">{primary}</span>
                                </span>
                                <span className="mt-1 flex items-center gap-3 flex-wrap">
                                  <span className="text-[12px] text-espresso/45">{secondary}</span>
                                  {paused && (
                                    <span className="inline-flex items-center h-5 px-2 rounded-full bg-butter text-[9.5px] tracking-[0.1em] uppercase text-espresso">
                                      {lang === "ar" ? "غير متوفرة" : "Unavailable"}
                                    </span>
                                  )}
                                  {inCart && !paused && (
                                    <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full bg-espresso text-alabaster text-[9.5px] tracking-[0.1em] uppercase">
                                      <CheckIcon className="w-3 h-3" /> {lang === "ar" ? "تم الاختيار" : "In summary"}
                                    </span>
                                  )}
                                  {!paused && justAdded === s.id && !inCart && (
                                    <span className="inline-flex items-center h-5 px-2 rounded-full bg-butter text-[9.5px] uppercase text-espresso">
                                      {lang === "ar" ? "تمت الإزالة" : "Removed"}
                                    </span>
                                  )}
                                </span>
                              </span>
                            </span>

                            <span className="col-span-3 md:col-span-2 hidden md:flex">
                              <span className="inline-flex items-center h-7 px-3 rounded-full border-[0.5px] border-espresso/20 text-[10.5px] tracking-[0.14em] text-espresso/70">
                                {formatDuration(s.duration, lang)}
                              </span>
                            </span>

                            <span className="col-span-3 md:col-span-2 text-end md:text-start">
                              <span className="block font-display text-[20px] md:text-[24px] text-espresso tabular-nums">{formatQAR(s.price, lang)}</span>
                              <span className="md:hidden block mt-1 text-[10px] tracking-[0.12em] text-espresso/50">{formatDuration(s.duration, lang)}</span>
                            </span>

                            <span className="hidden md:flex col-span-1 justify-end">
                              <span
                                className={cn(
                                  "w-11 h-11 rounded-full border-[0.5px] grid place-items-center transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)]",
                                  inCart
                                    ? "bg-espresso border-espresso text-butter rotate-0"
                                    : "border-espresso/20 text-espresso group-hover:bg-butter group-hover:border-butter group-hover:rotate-90",
                                  paused && "opacity-40 group-hover:rotate-0 group-hover:bg-transparent group-hover:border-espresso/20",
                                )}
                              >
                                {inCart ? <CheckIcon /> : <PlusIcon />}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Cursor follower (desktop only) */}
      {fine && (
        <motion.div style={{ x: sx, y: sy }} className="pointer-events-none fixed top-0 left-0 z-40" aria-hidden>
          <div style={{ transform: "translate(-50%, -50%)" }}>
            <AnimatePresence>
              {hovered && (
                <motion.div
                  key="follower"
                  initial={{ opacity: 0, scale: 0.82, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.86, rotate: 3 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="relative w-[230px] h-[300px]"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-[20px] shadow-[0_30px_80px_-30px_rgba(60,36,36,0.55)]">
                    {FOLLOWER_IMAGES.map((src) => (
                      <motion.img
                        key={src}
                        src={src}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={false}
                        animate={{ opacity: hovered.image === src ? 1 : 0, scale: hovered.image === src ? 1 : 1.12 }}
                        transition={{ duration: 0.8, ease: EASE }}
                      />
                    ))}
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-butter px-3.5 py-1.5 text-[10.5px] text-espresso tracking-[0.12em] shadow-[0_8px_24px_-12px_rgba(60,36,36,0.4)]">
                    {formatDuration(hovered.duration, lang)} · {formatQAR(hovered.price, lang)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </section>
  );
}
