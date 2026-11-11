import { useLang } from "../lib/i18n";
import { formatQAR } from "../lib/data";
import { Reveal } from "./ui";

export interface SheetItem {
  en: string;
  ar: string;
  price: number | null;
}

export const SHEETS: { key: string; en: string; ar: string; items: SheetItem[] }[] = [
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

/* The menu as printed sheets — cards only, no extra headings or wordmarks. */
export function SheetCards() {
  const { lang } = useLang();

  return (
    <div className="mt-14 grid gap-5 md:grid-cols-3">
      {SHEETS.map((sheet, i) => (
        <Reveal key={sheet.key} delay={i * 0.08} className="h-full">
          <article className="h-full rounded-[24px] bg-alabaster border-[0.5px] border-line p-7 md:p-8 transition-shadow duration-700 hover:shadow-[0_0_0_3px_rgba(250,235,166,0.7)]">
            <h3 className="text-center font-display text-[20px] text-espresso border-b-[0.5px] border-line pb-5">
              {lang === "ar" ? sheet.ar : sheet.en}
            </h3>

            <ul className="mt-5">
              <li className="flex items-baseline justify-between gap-3 pb-3 border-b-[0.5px] border-line">
                <span className="eyebrow text-espresso/45 !text-[9px]">{lang === "ar" ? "الخدمة" : "Service"}</span>
                <span className="eyebrow text-espresso/45 !text-[9px]">{lang === "ar" ? "السعر" : "Price"}</span>
              </li>
              {sheet.items.map((it) => (
                <li
                  key={it.en}
                  className="flex items-baseline justify-between gap-3 py-3.5 border-b-[0.5px] border-line last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-[17px] leading-snug text-espresso">
                      {lang === "ar" ? it.ar : it.en}
                    </span>
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
  );
}


