import { useLang } from "../lib/i18n";
import { formatQAR } from "../lib/data";
import { Line, Reveal } from "./ui";

interface LineItem {
  en: string;
  ar: string;
  price: number | null;
}

const SHEETS: { key: string; en: string; ar: string; items: LineItem[] }[] = [
  {
    key: "nails",
    en: "Nail Services",
    ar: "خدمات الأظافر",
    items: [
      { en: "Classic Manicure", ar: "مانيكير كلاسيك", price: 80 },
      { en: "Classic Pedicure", ar: "باديكير كلاسيك", price: 90 },
      { en: "Classic Manicure & Pedicure without color", ar: "مانيكير وباديكير بدون طلاء", price: 150 },
      { en: "Classic Manicure & Pedicure with color", ar: "مانيكير وباديكير مع طلاء", price: 180 },
      { en: "Regular Polish hand", ar: "طلاء أظافر اليد", price: 30 },
      { en: "Regular Polish feet", ar: "طلاء أظافر القدم", price: 35 },
    ],
  },
  {
    key: "additional",
    en: "Additional Services",
    ar: "خدمات إضافية",
    items: [
      { en: "Hand Massage 15min", ar: "مساج يد ١٥ دقيقة", price: 35 },
      { en: "Foot Massage 15min", ar: "مساج قدم ١٥ دقيقة", price: 40 },
      { en: "Hand & Foot Massage 30min", ar: "مساج يد وقدم ٣٠ دقيقة", price: 70 },
      { en: "Foot Mask", ar: "ماسك قدم", price: null },
      { en: "Hand Mask", ar: "ماسك يد", price: 30 },
      { en: "Hand & Foot Mask", ar: "ماسك يد وقدم", price: 50 },
    ],
  },
  {
    key: "kids",
    en: "Kids Services",
    ar: "خدمات الأطفال",
    items: [
      { en: "Nail Polish", ar: "طلاء أظافر", price: 25 },
      { en: "Manicure & Pedicure", ar: "مانيكير وباديكير", price: 45 },
    ],
  },
];

export function PriceList() {
  const { t, lang } = useLang();

  return (
    <section id="price-list" className="relative bg-powder py-24 md:py-32">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <p className="eyebrow text-espresso/60">(" {lang === "ar" ? "قائمة الأسعار" : "Price list"} ")</p>
            </Reveal>
            <h2 className="mt-5 font-display font-light text-espresso text-[clamp(2.6rem,5.4vw,5rem)] leading-[0.95] tracking-[-0.03em]">
              <Line>{lang === "ar" ? "الأسعار" : "The prices,"}</Line>
              <Line delay={0.1}>
                <span className="accent">{lang === "ar" ? "جلسةً واحدة." : "in one sheet."}</span>
              </Line>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:justify-self-end">
            <Reveal delay={0.12}>
              <p className="max-w-[340px] text-[14px] leading-[1.75] text-espresso/65">{t.menu.sub}</p>
            </Reveal>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SHEETS.map((sheet, i) => (
            <Reveal key={sheet.key} delay={i * 0.08}>
              <article className="h-full rounded-[24px] bg-alabaster border-[0.5px] border-line p-7 md:p-8">
                <header className="text-center border-b-[0.5px] border-line pb-5">
                  <span className="font-script text-[38px] leading-none text-espresso block">w</span>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.34em] text-espresso/60 keep-tracking">
                    {lang === "ar" ? "قائمة الأسعار" : "Price List"}
                  </p>
                  <h3 className="mt-6 font-display text-[22px] text-espresso">
                    {lang === "ar" ? sheet.ar : sheet.en}
                  </h3>
                </header>

                <ul className="mt-6">
                  <li className="flex items-baseline justify-between gap-3 pb-3 border-b-[0.5px] border-line">
                    <span className="eyebrow text-espresso/45 !text-[9px]">{lang === "ar" ? "الخدمة" : "Service"}</span>
                    <span className="eyebrow text-espresso/45 !text-[9px]">{lang === "ar" ? "السعر" : "Price"}</span>
                  </li>
                  {sheet.items.map((it) => (
                    <li key={it.en} className="flex items-baseline justify-between gap-3 py-3.5 border-b-[0.5px] border-line last:border-0">
                      <span className="min-w-0">
                        <span className="block font-display text-[17px] leading-snug text-espresso">{lang === "ar" ? it.ar : it.en}</span>
                        {lang === "ar" && <span className="block text-[11.5px] text-espresso/45 mt-0.5">{it.en}</span>}
                      </span>
                      <span className="shrink-0 font-display text-[17px] text-espresso tabular-nums" dir="ltr">
                        {it.price === null ? "—" : formatQAR(it.price, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <p className="mt-7 text-[11.5px] text-espresso/55">
            {lang === "ar"
              ? "* جميع الأسعار بالريال القطري · الخدمات الكاملة (٦٥ خدمة) متاحة في قسم «الخدمات»."
              : "* All prices in Qatari Riyal · the full 65-treatment menu is available in the Services section."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
