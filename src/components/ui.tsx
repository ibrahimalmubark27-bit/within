import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useLang } from "../lib/i18n";
import { cn } from "../utils/cn";

export const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────── Pointer capability ───────── */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/* ───────── Original logo file — no filters, no tint, exact file colors ───────── */
export function BrandImg({ className, fallbackSize = "sm" }: { className?: string; fallbackSize?: "sm" | "md" | "lg" | "xl" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Logo size={fallbackSize} className={className} />;
  return (
    <img
      src="https://i.postimg.cc/9M2tgrgG/IMG-4209.png"
      alt="within BEAUTY SALON AND SPA"
      className={cn("h-12 max-w-[42vw] sm:max-w-[36vw] md:max-w-none md:h-16 lg:h-20 w-auto object-contain mix-blend-multiply", className)}
      onError={() => setFailed(true)}
      loading="eager"
      decoding="async"
    />
  );
}

/* ───────── Wordmark: calligraphic w + serif ithin ───────── */
export const LOGO_SRC = "https://i.postimg.cc/9M2tgrgG/IMG-4209.png";

export function LogoImg({ className = "", alt = "within BEAUTY SALON AND SPA" }: { className?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="inline-block h-[1em] w-[6em] rounded-sm bg-current/10" aria-hidden />;
  return <img src={LOGO_SRC} alt={alt} className={cn("w-auto object-contain mix-blend-multiply", className)} onError={() => setFailed(true)} loading="eager" decoding="async" />;
}

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  sub?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "espresso" | "powder" | "butter" | "alabaster";
}) {
  const heights: Record<string, string> = {
    sm: "h-8 md:h-9",
    md: "h-10 md:h-11",
    lg: "h-12",
    xl: "h-10 md:h-11 opacity-90",
  };
  return <LogoImg className={cn("w-auto object-contain mix-blend-multiply", heights[size], className)} />;
}

/* legacy signature kept so call sites keep compiling */
export function __legacyLogo(_: {
  className?: string;
  sub?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "espresso" | "powder" | "butter" | "alabaster";
}) {
  return null;
}

export function unusedLogoBody() {
  const tone = "espresso" as const;
  const size = "md" as const;
  const className = "";
  const sub = false;
  /* One lockup, one set of ratios — every instance scales from these numbers.
     w (calligraphic) sits on the same baseline as the serif "ithin",
     pulled left so its exit stroke crosses the "i", exactly like the wordmark. */
  const scale: Record<string, string> = {
    sm: "34px",
    md: "46px",
    lg: "72px",
    xl: "clamp(4.5rem, 13vw, 13rem)",
  };
  const color = {
    espresso: "text-espresso",
    powder: "text-powder",
    butter: "text-butter",
    alabaster: "text-alabaster",
  }[tone];

  return (
    <span
      dir="ltr"
      style={{ fontSize: scale[size] }}
      className={cn("inline-flex flex-col items-center leading-none select-none", color, className)}
    >
      <span className="flex items-baseline justify-center whitespace-nowrap">
        {/* calligraphic w — same optical height as the serif, tucked under the “i” */}
        <span
          style={{
            fontFamily: '"Pinyon Script", "Snell Roundhand", cursive',
            fontSize: "1.16em",
            lineHeight: 1,
            marginRight: "-0.3em",
            letterSpacing: "-0.02em",
          }}
        >
          w
        </span>
        {/* high-contrast serif “ithin” */}
        <span
          style={{
            fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
            fontWeight: 400,
            fontSize: "1em",
            letterSpacing: "-0.028em",
            lineHeight: 1,
          }}
        >
          ithin
        </span>
      </span>

      {sub && (
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "0.155em",
            letterSpacing: "0.34em",
            marginTop: "0.62em",
            textIndent: "0.34em",
          }}
          className="font-normal uppercase whitespace-nowrap"
        >
          Beauty Salon and Spa
        </span>
      )}
    </span>
  );
}

/* ───────── Magnetic pull ───────── */
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 140, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 140, damping: 18, mass: 0.6 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        if (!fine || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ───────── Reveal on view ───────── */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.2, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ───────── Mask-reveal line for headlines ───────── */
export function Line({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <span className={cn("block overflow-hidden pb-[0.08em]", className)}>
      <motion.span
        className="block"
        initial={{ y: "105%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ───────── Language toggle ───────── */
export function LangToggle({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "relative inline-flex items-center rounded-full p-[3px] border-[0.5px]",
        dark ? "border-alabaster/20" : "border-line bg-alabaster/60",
        className,
      )}
    >
      {(["en", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "relative z-10 h-7 min-w-9 px-2.5 rounded-full text-[11px] transition-colors duration-500",
            lang === l ? (dark ? "text-espresso" : "text-espresso") : dark ? "text-alabaster/60 hover:text-alabaster" : "text-espresso/50 hover:text-espresso",
          )}
          style={{ fontFamily: l === "ar" ? "'IBM Plex Sans Arabic'" : "'Plus Jakarta Sans'" }}
        >
          {lang === l && (
            <motion.span
              layoutId={dark ? "lang-pill-dark" : "lang-pill"}
              className={cn("absolute inset-0 -z-10 rounded-full", dark ? "bg-butter" : "bg-powder")}
              transition={{ duration: 0.6, ease: EASE }}
            />
          )}
          {l === "en" ? "EN" : "ع"}
        </button>
      ))}
    </div>
  );
}

/* ───────── Icons (hairline) ───────── */
type IconProps = { className?: string };
export const ArrowIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4 rtl:-scale-x-100", className)} aria-hidden>
    <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const BackIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4 rtl:-scale-x-100", className)} aria-hidden>
    <path d="M20 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const CloseIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4", className)} aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);
export const PlusIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("w-3.5 h-3.5", className)} aria-hidden>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);
export const CheckIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("w-3.5 h-3.5", className)} aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const WhatsAppIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-4 h-4", className)} aria-hidden>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
  </svg>
);
export const InstagramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4", className)} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1" />
    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
  </svg>
);
export const AppleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-4 h-4", className)} aria-hidden>
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
  </svg>
);
