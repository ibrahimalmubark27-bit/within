import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import { LangProvider, useLang } from "./lib/i18n";
import { formatQAR } from "./lib/data";
import { pullSync, useServices } from "./lib/store";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";

import { Atelier } from "./components/Atelier";
import { Gallery } from "./components/Gallery";
import { Visit } from "./components/Visit";
import { Footer } from "./components/Footer";
import { BookingDrawer } from "./components/BookingDrawer";
import { WhatsAppFab } from "./components/WhatsAppFab";
import { AdminApp } from "./admin/AdminApp";
import { ArrowIcon, EASE } from "./components/ui";

type Route = "site" | "admin";
const readRoute = (): Route => {
  const path = window.location.pathname.replace(/\/+$/, "");
  const hash = window.location.hash.replace(/^#/, "");
  const query = new URLSearchParams(window.location.search);
  const isAdmin = path.endsWith("/admin") || path === "/admin" || hash.startsWith("/admin") || query.get("admin") === "1";
  return isAdmin ? "admin" : "site";
};

const CART_KEY = "within-cart";

function Site() {
  const [route, setRoute] = useState<Route>(readRoute);
  const lenisRef = useRef<Lenis | null>(null);
  const [open, setOpen] = useState(false);

  /* ── Basket (persists) ── */
  const [cart, setCart] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const toggleCart = useCallback((id: string) => {
    setCart((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }, []);

  /* ── Routing ── */
  useEffect(() => {
    // pull the owner's live store (prices / availability / media) if a sync URL is configured
    void pullSync();
    const id = window.setInterval(() => void pullSync(), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    window.addEventListener("admin:navigate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      window.removeEventListener("admin:navigate", onHash);
    };
  }, []);

  useEffect(() => {
    if (route === "admin") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;
    let id = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.style.overflow = "";
    };
  }, [route]);

  useEffect(() => {
    const l = lenisRef.current;
    if (open) {
      l?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      l?.start();
      document.documentElement.style.overflow = "";
    }
  }, [open]);

  const nav = useCallback((id: string) => {
    const target = id === "top" ? 0 : (document.getElementById(id) as HTMLElement | null);
    if (target === null) return;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: id === "top" ? 0 : -40, duration: 1.8 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }, []);

  const openDrawer = useCallback(() => setOpen(true), []);

  const exitAdmin = useCallback(() => {
    const clean = window.location.pathname.replace(/\/admin\/?$/, "") + window.location.search.replace(/[?&]admin=1/, "").replace(/^\?$/, "");
    history.replaceState(null, "", clean || "/");
    setRoute("site");
    window.scrollTo({ top: 0 });
  }, []);

  if (route === "admin") return <AdminApp onExit={exitAdmin} />;

  return (
    <div className="relative">
      <Header count={cart.length} onBook={openDrawer} onNav={nav} />
      <main>
        <Hero onBook={openDrawer} onExplore={() => nav("services")} />
        <Services cart={cart} onToggle={toggleCart} onCheckout={openDrawer} />
        <Atelier />
        <Gallery />
        <Visit />
      </main>
      <Footer onBook={openDrawer} onNav={nav} />
      {cart.length === 0 && <WhatsAppFab />}
      <CartBar cart={cart} onOpen={openDrawer} onClear={() => setCart([])} />
      <BookingDrawer open={open} onClose={() => setOpen(false)} initialService={null} cart={cart} setCart={setCart} />
    </div>
  );
}

/* Persistent basket bar — the step between menu and checkout */
function CartBar({ cart, onOpen, onClear }: { cart: string[]; onOpen: () => void; onClear: () => void }) {
  const { t, lang } = useLang();
  const services = useServices();
  const count = cart.length;
  const chosenNow = services.filter((s) => cart.includes(s.id));
  const total = chosenNow.reduce((a, s) => a + s.price, 0);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.aside
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="fixed bottom-0 inset-x-0 z-[70] bg-espresso text-alabaster px-4 md:px-8 py-3 flex items-center justify-between gap-4"
          aria-label={t.book}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 h-8 min-w-8 px-1.5 rounded-full bg-butter text-espresso text-[12px] tabular-nums grid place-items-center">{count}</span>
            <span className="font-display text-[17px] leading-none tabular-nums">
              {formatQAR(total, lang)}
            </span>
            <span className="hidden sm:block text-[12px] text-alabaster/55 truncate max-w-[38vw]">
              {chosenNow.map((s) => (lang === "ar" ? s.nameAr : s.name)).join(" · ")}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClear} className="h-10 px-3.5 rounded-full text-[12px] text-alabaster/60 hover:text-alabaster transition-colors">
              {lang === "ar" ? "تفريغ" : "Clear"}
            </button>
            <button
              onClick={onOpen}
              className="group h-10 ps-5 pe-1.5 rounded-full bg-alabaster text-espresso text-[13px] inline-flex items-center gap-3 transition-shadow duration-500 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]"
            >
              {lang === "ar" ? "إتمام الحجز" : "Checkout"}
              <span className="w-7 h-7 rounded-full bg-butter grid place-items-center transition-transform duration-700 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                <ArrowIcon className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Site />
    </LangProvider>
  );
}
