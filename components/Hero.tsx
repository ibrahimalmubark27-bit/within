import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLang } from "../lib/i18n";
import { IMAGES } from "../lib/data";
import { useStore } from "../lib/store";
import { ArrowIcon, EASE, Line, Logo, Magnetic } from "./ui";

export function Hero({ onBook, onExplore }: { onBook: () => void; onExplore: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  /* The original model photo already carries the powder-blue wordmark inside it.
     It is used untouched: no gradient, no grain, no tint. If the file isn't in place yet,
     we fall back to the generated shot + the typographic lockup. */
  const [original, setOriginal] = useState(true);
  const { media } = useStore();

  return (
    <section id="top" ref={ref} className="relative min-h-[100svh] pt-20 bg-alabaster overflow-hidden">
      {/* soft powder atmosphere */}
      <div className="pointer-events-none absolute -top-40 end-[-10%] w-[70vw] h-[70vw] rounded-full bg-powder/60 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-5 md:px-10 grid grid-cols-12 gap-x-6 pt-10 md:pt-16 pb-16">
        {/* Copy */}
        <motion.div style={{ y: textY }} className="col-span-12 lg:col-span-6 flex flex-col justify-center order-2 lg:order-1 mt-12 lg:mt-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.4 }}
            className="eyebrow text-espresso/60 flex items-center gap-4"
          >
            <span className="inline-block w-10 h-[0.5px] bg-espresso/40" />
            {t.hero.eyebrow}
          </motion.p>

          <h1 className="mt-8 font-display font-light text-espresso text-[clamp(3.2rem,7.4vw,7.6rem)] leading-[0.95] tracking-[-0.03em]">
            <Line delay={0.5}>{t.hero.l1}</Line>
            <Line delay={0.62}>{t.hero.l2}</Line>
            <Line delay={0.74}>
              <span className="accent font-normal">{t.hero.accent}</span>
            </Line>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE, delay: 1 }}
            className="mt-8 max-w-[440px] text-[15px] leading-[1.75] text-espresso/70"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE, delay: 1.15 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic strength={0.4}>
              <button
                onClick={onBook}
                className="group h-14 ps-7 pe-2 rounded-full bg-espresso text-alabaster text-[14px] flex items-center gap-5 transition-shadow duration-700 hover:shadow-[0_0_0_5px_rgba(250,235,166,0.95)]"
              >
                {t.hero.cta}
                <span className="w-10 h-10 rounded-full bg-butter text-espresso grid place-items-center transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:rotate-[-45deg] rtl:group-hover:rotate-[45deg]">
                  <ArrowIcon />
                </span>
              </button>
            </Magnetic>
            <button
              onClick={onExplore}
              className="group h-14 px-7 rounded-full border-[0.5px] border-espresso/25 text-espresso text-[14px] transition-colors duration-700 hover:bg-powder/60"
            >
              {t.hero.explore}
            </button>
          </motion.div>
        </motion.div>

        {/* Visual — original photo, untouched */}
        <div className="col-span-12 lg:col-span-6 order-1 lg:order-2 relative">
          <motion.div
            initial={{ clipPath: "inset(100% 0% 0% 0% round 999px 999px 24px 24px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 999px 999px 24px 24px)" }}
            transition={{ duration: 1.8, ease: EASE, delay: 0.2 }}
            className={cnFrame(original)}
          >
            <motion.img
              src={original ? media.heroImage : IMAGES.hero}
              alt="within — butter yellow manicure editorial"
              onError={() => setOriginal(false)}
              style={{ y: imgY, scale: imgScale }}
              className="absolute inset-0 h-full w-full object-cover rounded-t-[160px] rounded-b-2xl shadow-lg"
              fetchPriority="high"
            />

            {/* Only for the fallback shot: legibility scrim + the typographic lockup.
                The original photo already contains the powder-blue wordmark → nothing added. */}
            {!original && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-10 flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.6, ease: EASE, delay: 1.1 }}
                  >
                    <Logo size="lg" tone="powder" sub={false} className="origin-bottom" />
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>

          {/* floating badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE, delay: 1.4 }}
            className="absolute top-[12%] start-0 lg:start-[-2%] rounded-full bg-alabaster/85 backdrop-blur-md border-[0.5px] border-line ps-3 pe-4 py-2 flex items-center gap-2.5 shadow-[0_10px_40px_-20px_rgba(60,36,36,0.35)]"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-butter animate-ping opacity-80" />
              <span className="relative w-2 h-2 rounded-full bg-butter ring-[0.5px] ring-espresso/30" />
            </span>
            <span className="text-[11.5px] text-espresso">{t.hero.badge}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 1.6 }}
            className="absolute bottom-[-6px] end-0 lg:end-[-2%] rounded-2xl bg-powder px-5 py-4 max-w-[200px] hidden sm:block"
          >
            <p className="eyebrow text-espresso/60 !text-[9.5px]">N°01</p>
            <p className="mt-1.5 font-display text-[19px] leading-tight text-espresso accent">{t.hero.caption.split("—")[1]?.trim()}</p>
          </motion.div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative border-y-[0.5px] border-line py-5 overflow-hidden bg-alabaster" dir="ltr">
        <div className="marquee flex w-max whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {[...t.marquee, ...t.marquee].map((w, i) => (
                <span key={i} className="flex items-center">
                  <span className="px-8 font-display text-[28px] md:text-[34px] font-light text-espresso/80 accent">{w}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-butter ring-[0.5px] ring-espresso/20" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Arched frame — tall & generous, corners live on the image itself. */
function cnFrame(_original: boolean) {
  return "relative mx-auto lg:ms-auto lg:me-0 w-full max-w-md lg:max-w-lg h-[540px] md:h-[640px]";
}
