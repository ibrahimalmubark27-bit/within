import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLang } from "../lib/i18n";
import { IMAGES } from "../lib/data";
import { useStore } from "../lib/store";
import { Line, LogoImg, Reveal } from "./ui";

export function Atelier() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const { media } = useStore();

  return (
    <section id="atelier" ref={ref} className="relative bg-powder py-28 md:py-40 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 grid grid-cols-12 gap-x-6 gap-y-16">
        <div className="col-span-12 lg:col-span-5 relative">
          <Reveal y={40}>
            <div className="relative aspect-[3/4] w-full max-w-[480px] overflow-hidden rounded-t-[999px] rounded-b-[20px] grain">
              <motion.img
                src={IMAGES.atelier}
                alt="Arched alcoves and a powder-blue chair inside the within atelier"
                loading="lazy"
                style={{ y, scale: 1.18 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </Reveal>
          <div className="absolute -bottom-8 end-4 lg:end-6 rounded-full bg-alabaster w-32 h-32 grid place-items-center border-[0.5px] border-line">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_30s_linear_infinite]" aria-hidden>
              <defs>
                <path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text fontSize="7.4" letterSpacing="2.6" fill="#3c2424" style={{ fontFamily: "'Plus Jakarta Sans'" }}>
                <textPath href="#circ">WOMEN ONLY · BESPOKE CARE · DOHA · </textPath>
              </text>
            </svg>
            <LogoImg className="h-7" alt="within" />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 lg:col-start-7 flex flex-col justify-center">
          <Reveal>
            <p className="eyebrow text-espresso/60">{t.atelier.eyebrow}</p>
          </Reveal>
          <h2 className="mt-6 font-display font-light text-espresso text-[clamp(2.8rem,5.6vw,5.6rem)] leading-[0.95] tracking-[-0.03em]">
            <Line>{t.atelier.title1}</Line>
            <Line delay={0.1}>
              <span className="accent">{t.atelier.accent}</span>
            </Line>
          </h2>
          <Reveal delay={0.15}>
            <p className="mt-10 max-w-[520px] text-[15.5px] leading-[1.85] text-espresso/75">{t.atelier.body}</p>
          </Reveal>

          <div className="mt-14 border-t-[0.5px] border-line">
            {t.atelier.pillars.map((p, i) => (
              <Reveal key={p.t} delay={0.1 + i * 0.08}>
                <div className="grid grid-cols-12 gap-4 py-6 border-b-[0.5px] border-line">
                  <span className="col-span-2 text-[11px] text-espresso/45 tabular-nums pt-1.5">0{i + 1}</span>
                  <h3 className="col-span-10 md:col-span-4 font-display text-[22px] text-espresso leading-snug">{p.t}</h3>
                  <p className="col-span-10 col-start-3 md:col-span-6 md:col-start-auto text-[13.5px] leading-[1.7] text-espresso/65">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Care & products — images managed from /admin › Media */}
        <div className="col-span-12 grid sm:grid-cols-2 gap-5 md:gap-8">
          {[
            { src: media.shampooImage, label: lang === "ar" ? "العناية اليومية" : "Everyday care" },
            { src: media.basinImage, label: lang === "ar" ? "طقوس السبا" : "Spa rituals" },
          ].map((it) => (
            <Reveal key={it.src}>
              <figure className="group relative overflow-hidden">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[140px] rounded-b-[16px] bg-powder">
                  <img
                    src={it.src}
                    alt={it.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]"
                  />
                </div>
                <figcaption className="mt-3 eyebrow text-espresso/60 !text-[9.5px]">{it.label}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
