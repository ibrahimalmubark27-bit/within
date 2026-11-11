import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { SERVICES, formatQAR } from "../lib/data";
import { useStore } from "../lib/store";
import { waHref } from "../lib/booking";
import { EASE, Magnetic, WhatsAppIcon } from "./ui";

/** Short, concierge-toned message. Adds the full menu only when no price filter needed. */
function introMessage(lang: "en" | "ar", lastAdded?: string) {
  if (lang === "ar") {
    return lastAdded
      ? `السلام عليكم within ✨\nأرغب بالحجز: ${lastAdded}\nهل يوجد موعد متاح؟`
      : `السلام عليكم within ✨\nأرغب بحجز موعد في الأتيليه. ممكن المساعدة من فضلك؟`;
  }
  return lastAdded
    ? `Hello within ✨\nI'd like to book: ${lastAdded}\nDo you have any availability?`
    : `Hello within ✨\nI'd like to book an appointment at the atelier. Could you help me?`;
}

/** Suggests an artisan-facing price list so the guest knows what to expect. */
export function quickMenu(lang: "en" | "ar") {
  const lines = SERVICES.map(
    (s) => `• ${lang === "ar" ? s.nameAr : s.name} — ${formatQAR(s.price, lang)}`,
  );
  return lines.join("\n");
}

export function WhatsAppFab() {
  const { lang, t } = useLang();
  const { settings } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = waHref(settings.whatsapp, introMessage(lang));
  const label = lang === "ar" ? "احجزي عبر واتساب" : "Book via WhatsApp";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-5 inset-x-5 sm:inset-x-auto sm:end-6 z-[60] flex justify-end pointer-events-none"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <Magnetic strength={0.35} className="pointer-events-auto">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="group relative flex items-center gap-3 rounded-full bg-espresso text-alabaster ps-2 pe-5 h-14 shadow-[0_18px_45px_-20px_rgba(60,36,36,0.75)] transition-shadow duration-700 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]"
            >
              <span className="relative w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center shrink-0">
                <WhatsAppIcon className="w-[18px] h-[18px]" />
                <span className="absolute inset-0 rounded-full bg-butter animate-ping opacity-60" style={{ animationDuration: "2.6s" }} aria-hidden />
              </span>
              <span className="relative overflow-hidden">
                <span className="block font-display text-[17px] leading-none whitespace-nowrap accent opacity-90 group-hover:opacity-100 transition-opacity duration-500">
                  {label}
                </span>
                <span className="block mt-0.5 text-[10px] tracking-[0.18em] uppercase text-alabaster/45 tabular-nums whitespace-nowrap" dir="ltr">
                  {settings.whatsappDisplay}
                </span>
              </span>
              {/* hidden on narrow screens: compact circle only */}
              <span className="hidden" aria-hidden>
                {t.footer.follow}
              </span>
            </a>
          </Magnetic>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { introMessage };
