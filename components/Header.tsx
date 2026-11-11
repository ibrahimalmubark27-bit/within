import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { EASE, LangToggle, Magnetic } from "./ui";
import { cn } from "../utils/cn";

export function Header({ onBook, onNav, count = 0 }: { onBook: () => void; onNav: (id: string) => void; count?: number }) {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { id: "services", label: t.nav.services },
    { id: "atelier", label: t.nav.atelier },
    { id: "gallery", label: t.nav.gallery },
    { id: "visit", label: t.nav.visit },
  ];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700",
        scrolled ? "bg-alabaster/75 backdrop-blur-xl border-b-[0.5px] border-line" : "bg-transparent border-b-[0.5px] border-transparent",
      )}
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 h-20 flex items-center justify-between gap-4">
        <nav className="hidden md:flex items-center gap-9" aria-label="Primary">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => onNav(l.id)}
              className="group relative text-[13px] text-espresso/80 hover:text-espresso transition-colors duration-500 rounded-sm"
            >
              {l.label}
              <span className="absolute -bottom-1 start-0 h-[0.5px] w-full bg-espresso origin-[left] rtl:origin-[right] scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]" />
            </button>
          ))}
        </nav>
        <div className="md:hidden" />

        <button
          onClick={() => onNav("top")}
          aria-label="within — home"
          className="flex items-center overflow-visible py-2 border-0 bg-transparent p-0"
        >
          <img
            src="https://i.postimg.cc/9M2tgrgG/IMG-4209.png"
            alt="within BEAUTY SALON AND SPA"
            style={{ width: "210px", height: "auto", minWidth: "180px" }}
            className="object-contain mix-blend-multiply transition-transform duration-200 hover:scale-105"
            loading="eager"
            decoding="async"
          />
        </button>

        <div className="flex items-center justify-end gap-3 md:gap-4">
          <LangToggle />
          <Magnetic strength={0.35} className="hidden sm:inline-block">
            <button
              onClick={onBook}
              aria-label={`${t.book}${count ? ` — ${count}` : ""}`}
              className="group relative h-10 pe-4 ps-5 rounded-full bg-espresso text-alabaster text-[12.5px] overflow-hidden inline-flex items-center gap-3 transition-shadow duration-700 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.9)]"
            >
              <span className="relative z-10">{t.book}</span>
              {count > 0 && (
                <span className="relative z-10 min-w-5 h-5 px-1 rounded-full bg-butter text-espresso text-[10.5px] tabular-nums grid place-items-center">
                  {count}
                </span>
              )}
            </button>
          </Magnetic>
          <button
            onClick={onBook}
            className="sm:hidden h-9 px-4 rounded-full bg-espresso text-alabaster text-[12px]"
          >
            {t.bookShort}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
