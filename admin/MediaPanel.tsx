import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../lib/i18n";
import { admin, pushSync, useStore, type Media } from "../lib/store";
import { ArrowIcon, EASE, PlusIcon } from "../components/ui";
import { cn } from "../utils/cn";

const inputCls =
  "w-full bg-transparent border-b-[0.5px] border-espresso/25 focus:border-espresso py-2 text-[14px] text-espresso focus:outline-none focus-visible:shadow-none transition-colors";

function Thumb({ url, className }: { url: string; className?: string }) {
  const [bad, setBad] = useState(false);
  if (!url || bad)
    return (
      <span className={cn("grid place-items-center rounded-xl border-[0.5px] border-dashed border-espresso/25 bg-espresso/[0.03] text-[10px] text-espresso/45", className)}>
        ?
      </span>
    );
  return <img src={url} alt="" loading="lazy" onError={() => setBad(true)} className={cn("object-cover rounded-xl border-[0.5px] border-line", className)} />;
}

function Field({
  label,
  hint,
  value,
  onChange,
  preview,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  preview: string;
}) {
  return (
    <div className="rounded-[22px] border-[0.5px] border-line p-5">
      <div className="flex items-start gap-4">
        <Thumb url={preview} className="h-16 w-24 shrink-0" />
        <label className="flex-1 min-w-0">
          <span className="eyebrow text-espresso/55 !text-[9.5px]">{label}</span>
          <input dir="ltr" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={hint} />
        </label>
      </div>
    </div>
  );
}

export function MediaPanel() {
  const { lang } = useLang();
  const store = useStore();
  const [draft, setDraft] = useState<Media>(() => ({ ...store.media, gallery: [...store.media.gallery] }));
  const [toast, setToast] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(store.media);
  const set = (patch: Partial<Media>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    admin.setMedia(draft);
    void pushSync();
    setToast(true);
    window.setTimeout(() => setToast(false), 4200);
  };

  const pick = (key: "heroImage" | "storefrontImage" | "shampooImage" | "basinImage") => (v: string) =>
    set({ [key]: v } as Partial<Media>);

  const L = {
    title: lang === "ar" ? "إدارة الصور والوسائط" : "Media & Images",
    sub:
      lang === "ar"
        ? "حدّثي روابط الصور مباشرة — الصورة الرئيسية، واجهة المحل، معرض الأعمال وصور العناية. التحديث يظهر في الموقع فور الحفظ."
        : "Update image URLs live — hero, storefront, lookbook and care imagery. Changes appear on the site the moment you save.",
    s1: lang === "ar" ? "الصور الرئيسية والواجهة" : "Hero & storefront media",
    s2: lang === "ar" ? "معرض الأعمال" : "Interactive lookbook / gallery",
    s3: lang === "ar" ? "العناية والمنتجات" : "Atelier care & products",
    hero: lang === "ar" ? "رابط صورة الهيرو الرئيسية" : "Hero main image URL",
    store: lang === "ar" ? "رابط صورة واجهة المحل" : "Storefront exterior image URL",
    shampoo: lang === "ar" ? "رابط صورة الشامبو والفرش" : "Shampoo & brush image URL",
    basin: lang === "ar" ? "رابط صورة حوض السبا" : "Spa basin image URL",
    add: lang === "ar" ? "+ إضافة صورة جديدة" : "+ Add new image",
    del: lang === "ar" ? "حذف" : "Delete",
    save: lang === "ar" ? "حفظ تحديثات الصور" : "Save all image changes",
    saved: lang === "ar" ? "تم تحديث صور الموقع بنجاح" : "Images updated successfully on the live site!",
    savedAlt: lang === "ar" ? "Images updated successfully on the live site!" : "تم تحديث صور الموقع بنجاح",
    empty: lang === "ar" ? "لا توجد صور في المعرض — أضيفي أول صورة." : "No gallery images yet — add your first photo.",
    ph: "https://…",
    count: (n: number) => (lang === "ar" ? `${n} صورة في المعرض` : `${n} images in the lookbook`),
  };

  return (
    <div className="pb-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-7 border-b-[0.5px] border-line">
        <div>
          <h1 className="font-display font-light text-[clamp(2.2rem,4vw,3.4rem)] leading-[1] tracking-[-0.03em] text-espresso">{L.title}</h1>
          <p className="mt-3 max-w-[560px] text-[13.5px] leading-[1.7] text-espresso/60">{L.sub}</p>
        </div>
        <button
          onClick={save}
          disabled={!dirty}
          aria-live="polite"
          className={cn(
            "group h-14 ps-7 pe-2 rounded-full text-[14px] inline-flex items-center gap-6 transition-all duration-500",
            dirty ? "bg-espresso text-alabaster hover:shadow-[0_0_0_5px_rgba(250,235,166,0.95)]" : "bg-espresso/[0.08] text-espresso/45 cursor-not-allowed",
          )}
        >
          <span className="flex flex-col items-start leading-tight">
            <span>{L.save}</span>
            <span className="text-[10px] opacity-65">{lang === "en" ? "حفظ تحديثات الصور" : "Save all image changes"}</span>
          </span>
          <span className={cn("w-10 h-10 rounded-full grid place-items-center transition-transform duration-700 group-hover:translate-x-1", dirty ? "bg-butter text-espresso" : "bg-espresso/10 text-espresso/40")}>
            <ArrowIcon />
          </span>
        </button>
      </div>

      {/* 1 — hero & storefront */}
      <section className="mt-9">
        <p className="eyebrow text-espresso/55 !text-[10px]">{L.s1}</p>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Field label={L.hero} hint={L.ph} value={draft.heroImage} onChange={pick("heroImage")} preview={draft.heroImage} />
          <Field label={L.store} hint={L.ph} value={draft.storefrontImage} onChange={pick("storefrontImage")} preview={draft.storefrontImage} />
        </div>
      </section>

      {/* 2 — gallery */}
      <section className="mt-10 rounded-[24px] border-[0.5px] border-line p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow text-espresso/55 !text-[10px]">{L.s2}</p>
          <span className="text-[11.5px] text-espresso/55">{L.count(draft.gallery.length)}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {draft.gallery.map((src, i) => (
              <motion.figure
                key={src + i}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="group relative"
              >
                <Thumb url={src} className="w-full h-36 md:h-44" />
                <button
                  onClick={() => set({ gallery: draft.gallery.filter((_, k) => k !== i) })}
                  className="absolute top-2 end-2 h-8 px-3 rounded-full bg-alabaster/95 text-espresso text-[11.5px] border-[0.5px] border-espresso/20 hover:bg-espresso hover:text-alabaster transition-colors duration-500"
                >
                  {L.del}
                </button>
                <figcaption className="mt-1.5 truncate text-[11px] text-espresso/50" dir="ltr">
                  {src}
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
          {draft.gallery.length === 0 && <p className="col-span-full text-[13px] text-espresso/55 py-6 text-center">{L.empty}</p>}
        </div>

        <button
          onClick={() => setAdding((v) => !v)}
          className="mt-5 group inline-flex items-center gap-3 h-10 px-5 rounded-full border-[0.5px] border-espresso/30 text-[12.5px] text-espresso hover:bg-butter/70 transition-colors duration-500"
        >
          {L.add}
          <span className="w-6 h-6 rounded-full bg-espresso text-butter grid place-items-center transition-transform duration-700 group-hover:rotate-90">
            <PlusIcon />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {adding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden">
              <div className="mt-5 flex flex-col sm:flex-row gap-3 items-end">
                <label className="flex-1 w-full">
                  <span className="eyebrow text-espresso/55 !text-[9.5px]">URL</span>
                  <input dir="ltr" className={inputCls} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder={L.ph} />
                </label>
                <Thumb url={newUrl} className="h-14 w-20 shrink-0" />
                <button
                  onClick={() => {
                    const v = newUrl.trim();
                    if (!v) return;
                    set({ gallery: [...draft.gallery, v] });
                    setNewUrl("");
                    setAdding(false);
                  }}
                  className="h-11 px-6 rounded-full bg-espresso text-alabaster text-[13px] hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)] transition-shadow duration-500"
                >
                  {lang === "ar" ? "إضافة" : "Add"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3 — care & products */}
      <section className="mt-10">
        <p className="eyebrow text-espresso/55 !text-[10px]">{L.s3}</p>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Field label={L.shampoo} hint={L.ph} value={draft.shampooImage} onChange={pick("shampooImage")} preview={draft.shampooImage} />
          <Field label={L.basin} hint={L.ph} value={draft.basinImage} onChange={pick("basinImage")} preview={draft.basinImage} />
        </div>
      </section>

      {/* sticky save */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed bottom-0 inset-x-0 lg:ms-[266px] z-30 bg-espresso text-alabaster px-5 md:px-10 py-4 flex items-center justify-between gap-4"
          >
            <span className="text-[12.5px]">
              <span className="text-butter">●</span> {L.save}
            </span>
            <div className="flex items-center gap-2.5">
              <button onClick={() => setDraft({ ...store.media, gallery: [...store.media.gallery] })} className="h-11 px-5 rounded-full text-[12.5px] text-alabaster/70 hover:text-alabaster transition-colors">
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={save} className="group h-11 ps-6 pe-2 rounded-full bg-butter text-espresso text-[13.5px] inline-flex items-center gap-4 transition-transform duration-500 hover:scale-[1.02]">
                <span className="flex flex-col items-start leading-tight">
                  <span>{L.save}</span>
                  <span className="text-[10px] opacity-70">{lang === "en" ? "حفظ تحديثات الصور" : "Save all image changes"}</span>
                </span>
                <span className="w-8 h-8 rounded-full bg-espresso text-butter grid place-items-center">
                  <ArrowIcon className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.55, ease: EASE }}
            role="status"
            aria-live="polite"
            className="fixed z-50 bottom-6 inset-x-5 lg:ms-[266px] lg:inset-x-8 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto max-w-[520px] w-fit rounded-full bg-[#2f6f4f] text-white px-6 py-4 flex items-center gap-4 shadow-[0_24px_50px_-24px_rgba(47,111,79,0.9)]">
              <span className="w-7 h-7 rounded-full bg-white/15 grid place-items-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[13.5px]">{L.saved}</span>
                <span className="text-[11.5px] opacity-75">{L.savedAlt}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
