import { useLang } from "../lib/i18n";
import { useStore } from "../lib/store";
import { Line, Reveal } from "./ui";

export function Gallery() {
  const { t, lang } = useLang();
  const { media } = useStore();

  const labels =
    lang === "ar"
      ? ["أظافر", "تصفيف", "صبغات", "الأتيليه", "رموش", "تجميل"]
      : ["Nails", "Blow dry", "Colour", "The atelier", "Lashes", "Beauty"];

  const shots = media.gallery.map((src, i) => ({ src, label: labels[i % labels.length] }));

  return (
    <section id="gallery" className="relative bg-alabaster py-24 md:py-32 border-t-[0.5px] border-line">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal>
          <p className="eyebrow text-espresso/60">{t.nav.gallery}</p>
        </Reveal>

        <h2 className="mt-6 font-display font-light text-espresso text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.98] tracking-[-0.03em]">
          <Line>{lang === "ar" ? "من داخل" : "Inside the"}</Line>
          <Line delay={0.08}>
            <span className="accent">{lang === "ar" ? "الأتيليه" : "atelier"}</span>
          </Line>
        </h2>

        {shots.length === 0 ? (
          <div className="mt-12 rounded-[22px] border-[0.5px] border-dashed border-espresso/20 py-16 text-center">
            <span className="font-display text-[18px] text-espresso/50">
              {lang === "ar" ? "المعرض يُجهَّز حالياً" : "The lookbook is being styled."}
            </span>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {shots.map((s, i) => (
              <Reveal key={s.src + i} delay={Math.min(i, 5) * 0.07} className={i % 2 === 1 ? "md:mt-12" : ""}>
                <figure className="group relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[18px] bg-powder">
                  <img
                    src={s.src}
                    alt={s.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
                  />
                  <figcaption
                    className="absolute inset-x-0 bottom-0 p-4 text-[11.5px] tracking-[0.16em] uppercase text-alabaster keep-tracking"
                    style={{ textShadow: "0 1px 14px rgba(60,36,36,0.75)" }}
                  >
                    {s.label}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
