export type Category = "nails" | "hair" | "spa";

export interface Service {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  duration: number; // minutes
  category: Category;
  image: string;
}

export const IMAGES = {
  hero: "images/hero.jpg",
  manicure: "images/manicure.jpg",
  pedicure: "images/pedicure.jpg",
  blowdry: "images/blowdry.jpg",
  color: "images/color.jpg",
  atelier: "images/atelier.jpg",
};

/* ───────── Official price list — 65 services (QAR) ───────── */
interface Row {
  en: string;
  ar: string;
  dur: number;
  price: number;
  cat: Category;
}

/** Future menu (65 official treatments) — kept for later, NOT shown on the site now. */
export const FUTURE_MENU: Row[] = [
  { en: "The Essential Classic Manicure", ar: "مانيكير كلاسيك أساسي", dur: 35, price: 60, cat: "nails" },
  { en: "The Essential Classic Pedicure", ar: "باديكير كلاسيك أساسي", dur: 45, price: 60, cat: "nails" },
  { en: "Prêt-à-Porter Express Manicure", ar: "مانيكير إكسبريس سريع", dur: 25, price: 60, cat: "nails" },
  { en: "Prêt-à-Porter Express Pedicure", ar: "باديكير إكسبريس سريع", dur: 25, price: 60, cat: "nails" },
  { en: "The Signature Russian Manicure", ar: "مانيكير روسي", dur: 50, price: 60, cat: "nails" },
  { en: "The Signature Russian Pedicure", ar: "باديكير روسي", dur: 60, price: 60, cat: "nails" },
  { en: "The Russian Gel Couture Manicure", ar: "مانيكير جل روسي فاخر", dur: 75, price: 60, cat: "nails" },
  { en: "The Russian Gel Couture Pedicure", ar: "باديكير جل روسي فاخر", dur: 75, price: 60, cat: "nails" },
  { en: "Long-Wear Gel Polish Application", ar: "طلاء جل يدوم طويلاً", dur: 40, price: 71, cat: "nails" },
  { en: "Long-Wear Gel Polish Pedicure", ar: "باديكير طلاء جل يدوم طويلاً", dur: 40, price: 71, cat: "nails" },
  { en: "Gel Polish Refresh & Color Shift", ar: "تجديد طلاء الجل وتغيير اللون", dur: 45, price: 71, cat: "nails" },
  { en: "Gentle Professional Gel Removal", ar: "إزالة طلاء الجل باحتراف ولطف", dur: 20, price: 71, cat: "nails" },
  { en: "Classic Pure Polish Application", ar: "طلاء أظافر كلاسيكي نقي", dur: 15, price: 51, cat: "nails" },
  { en: "Classic Satin Pedicure Polish", ar: "طلاء أظافر ساتان كلاسيكي", dur: 15, price: 51, cat: "nails" },
  // Extensions & Polygel
  { en: "Bespoke Polygel Full Sculpting", ar: "تشكيل بولي جل كامل حسب الطلب", dur: 90, price: 89, cat: "nails" },
  { en: "Polygel Natural Nail Overlay", ar: "تغطية الأظافر الطبيعية بالبولي جل", dur: 75, price: 89, cat: "nails" },
  { en: "Polygel Balance & Refill Ritual", ar: "توازن وتجديد البولي جل", dur: 60, price: 89, cat: "nails" },
  { en: "Hard Gel Architecture Extensions", ar: "تطويل الأظافر بهارد جل", dur: 90, price: 71, cat: "nails" },
  { en: "Hard Gel Refill & Sculpt", ar: "تجديد وتشكيل الهارد جل", dur: 50, price: 71, cat: "nails" },
  { en: "Gentle Hard Gel Removal", ar: "إزالة الهارد جل ولطف", dur: 30, price: 71, cat: "nails" },
  { en: "Extended Artistry Polish Finish", ar: "تشطيب فني ممتد للطلاء", dur: 45, price: 51, cat: "nails" },
  // Nail Art & Add-ons
  { en: "Timeless Parisian French Design", ar: "تصميم فرنسي كلاسيكي خالد", dur: 20, price: 53, cat: "nails" },
  { en: "Subtle Gradient Ombré Finish", ar: "تدرّج أومبريه ناعم", dur: 20, price: 53, cat: "nails" },
  { en: "Velvet Cat-Eye Magnetic Polish", ar: "طلاء كات آي مغناطيسي مخملي", dur: 20, price: 57, cat: "nails" },
  { en: "Minimalist Editorial Nail Art", ar: "زخرفة أظافر مينيمالية أنيقة", dur: 20, price: 53, cat: "nails" },
  { en: "Haute Couture Pro Nail Artistry", ar: "فن أظافر أوت كوتور", dur: 35, price: 53, cat: "nails" },
  { en: "Swarovski Crystal Embellishment", ar: "تزيين كريستال سواروفسكي", dur: 10, price: 53, cat: "nails" },

  // Hair Artistry
  { en: "The Signature Atelier Blowout (Short)", ar: "سشوار صالون تنفيذي — قصير", dur: 30, price: 100, cat: "hair" },
  { en: "The Signature Atelier Blowout (Medium)", ar: "سشوار صالون تنفيذي — متوسط", dur: 45, price: 130, cat: "hair" },
  { en: "The Signature Atelier Blowout (Long)", ar: "سشوار صالون تنفيذي — طويل", dur: 60, price: 160, cat: "hair" },
  { en: "Couture Precision Cut & Styling", ar: "قص وتصفيف دقيق", dur: 45, price: 180, cat: "hair" },
  { en: "Effortless Glamour Waves & Styling", ar: "تمويج وتصفيف انسيابي", dur: 60, price: 200, cat: "hair" },
  { en: "Custom Seamless Root Retouch", ar: "صبغة جذور متكاملة", dur: 90, price: 250, cat: "hair" },
  { en: "Full Dimensional Color Alchemy", ar: "صبغة شعر كاملة متعددة الأبعاد", dur: 120, price: 450, cat: "hair" },
  { en: "Bespoke Balayage & Sun-Kissed Lights", ar: "باليج وهايلايت مصمم", dur: 150, price: 500, cat: "hair" },
  { en: "Couture Deep Recovery Hair Ritual", ar: "طقس علاج وترميم عميق", dur: 60, price: 200, cat: "hair" },

  // Brows & Lashes
  { en: "Keratin Lash Lift & Deep Tint", ar: "ليفت رموش بالكيراتين وصبغة", dur: 50, price: 66, cat: "spa" },
  { en: "Gentle Lash Extension Removal", ar: "إزالة رموش صناعية لطيفة", dur: 25, price: 66, cat: "spa" },
  { en: "Fluffy Brow Lamination & Sculpt", ar: "لامينيشن وتصميم الحواجب", dur: 45, price: 57, cat: "spa" },
  { en: "Bespoke Brow Tinting & Definition", ar: "صبغة حواجب مصممة", dur: 20, price: 57, cat: "spa" },
  { en: "Natural Brow Bleach & Softening", ar: "تفتيح حواجب طبيعي", dur: 20, price: 57, cat: "spa" },
  { en: "Custom Tailored Brow Architecture", ar: "نحت هندسي للحواجب", dur: 15, price: 51, cat: "spa" },
  // Waxing & Threading
  { en: "Complete Silk Full Body Waxing", ar: "شمع حرير كامل للجسم", dur: 90, price: 53, cat: "spa" },
  { en: "Private Brazilian Silk Waxing", ar: "شمع برازيلي خاص", dur: 30, price: 53, cat: "spa" },
  { en: "Full Leg Velvet Waxing", ar: "شمع الساقين بالكامل", dur: 40, price: 53, cat: "spa" },
  { en: "Half Leg Satin Waxing", ar: "شمع نصف الساق", dur: 25, price: 53, cat: "spa" },
  { en: "Full Arm Velvet Waxing", ar: "شمع الذراعين", dur: 30, price: 53, cat: "spa" },
  { en: "Half Arm Satin Waxing", ar: "شمع نصف الذراع", dur: 20, price: 53, cat: "spa" },
  { en: "Delicate Underarm Silk Waxing", ar: "شمع الإبطين الحريري اللطيف", dur: 15, price: 53, cat: "spa" },
  { en: "Chest & Torso Velvet Care", ar: "شمع الصدر والجذع", dur: 30, price: 53, cat: "spa" },
  { en: "Back Smoothing Waxing Ritual", ar: "طقس شمع تنعيم الظهر", dur: 25, price: 53, cat: "spa" },
  { en: "Complete Facial Wax & Brow Sculpt", ar: "شمع الوجه الكامل وتصميم الحواجب", dur: 30, price: 53, cat: "spa" },
  { en: "Precision Facial Threading & Brows", ar: "خيط وجه دقيق والحواجب", dur: 30, price: 44, cat: "spa" },
  { en: "Forehead Smoothing Threading", ar: "خيط تنعيم الجبهة", dur: 15, price: 44, cat: "spa" },
  { en: "Precision Eyebrow Waxing", ar: "شمع حواجب دقيق", dur: 15, price: 53, cat: "spa" },
  { en: "Artisanal Eyebrow Threading", ar: "خيط حواجب حرفي", dur: 15, price: 44, cat: "spa" },
  { en: "Upper Lip Silk Waxing", ar: "شمع الشفة العلوية حريري", dur: 10, price: 53, cat: "spa" },
  { en: "Upper Lip Precision Threading", ar: "خيط الشفة العلوية الدقيق", dur: 10, price: 44, cat: "spa" },
  { en: "Chin Smoothing Silk Waxing", ar: "شمع تنعيم الذقن", dur: 10, price: 53, cat: "spa" },
  { en: "Chin Precision Threading", ar: "خيط الذقن الدقيق", dur: 10, price: 44, cat: "spa" },
  // Spa & Massage
  { en: "Royal Botanical Foot Spa Therapy", ar: "طقس سبا نباتي ملكي للقدمين", dur: 30, price: 57, cat: "spa" },
  { en: "Aromatherapy Hand & Arm Renewal", ar: "تجديد اليدين والذراعين بالعطر", dur: 30, price: 57, cat: "spa" },
  { en: "Intense Keratin Nail Repair Treatment", ar: "علاج كيراتين مكثف للأظافر", dur: 20, price: 51, cat: "spa" },
  { en: "Fortifying Calcium Nail Shield", ar: "درع تقوية بالكالسيوم للأظافر", dur: 30, price: 51, cat: "spa" },
  { en: "Illuminating Eye Contour Therapy", ar: "علاج إشراقة محيط العين", dur: 20, price: 71, cat: "spa" },
];

/* ───────── Live menu (images: NAIL / ADDITIONAL / KIDS) — this is all that is shown now ───────── */
const MENU: Row[] = [
  // Nail services
  { en: "Classic Manicure", ar: "مانيكير كلاسيك", dur: 30, price: 80, cat: "nails" },
  { en: "Classic Pedicure", ar: "باديكير كلاسيك", dur: 45, price: 90, cat: "nails" },
  { en: "Classic Manicure & Pedicure without color", ar: "مانيكير وباديكير بدون طلاء", dur: 75, price: 150, cat: "nails" },
  { en: "Classic Manicure & Pedicure with color", ar: "مانيكير وباديكير مع طلاء", dur: 90, price: 180, cat: "nails" },
  { en: "Regular Polish hand", ar: "طلاء أظافر اليد", dur: 15, price: 30, cat: "nails" },
  { en: "Regular Polish feet", ar: "طلاء أظافر القدم", dur: 15, price: 35, cat: "nails" },

  // Additional services
  { en: "Hand Massage 15min", ar: "مساج يد ١٥ دقيقة", dur: 15, price: 35, cat: "spa" },
  { en: "Foot Massage 15min", ar: "مساج قدم ١٥ دقيقة", dur: 15, price: 40, cat: "spa" },
  { en: "Hand & Foot Massage 30min", ar: "مساج يد وقدم ٣٠ دقيقة", dur: 30, price: 70, cat: "spa" },
  { en: "Hand Mask", ar: "ماسك يد", dur: 20, price: 30, cat: "spa" },
  { en: "Hand & Foot Mask", ar: "ماسك يد وقدم", dur: 30, price: 50, cat: "spa" },

  // Kids services
  { en: "Kids Nail Polish", ar: "طلاء أظافر أطفال", dur: 15, price: 25, cat: "nails" },
  { en: "Kids Manicure & Pedicure", ar: "مانيكير وباديكير أطفال", dur: 45, price: 45, cat: "nails" },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function pickImage(name: string, cat: Category): string {
  const n = name.toLowerCase();
  if (cat === "nails") {
    if (n.includes("pedicure") || n.includes("foot")) return IMAGES.pedicure;
    if (n.includes("polygel") || n.includes("extension") || n.includes("hard gel")) return IMAGES.manicure;
    return IMAGES.manicure;
  }
  if (cat === "hair") {
    if (n.includes("color") || n.includes("balayage") || n.includes("root")) return IMAGES.color;
    return IMAGES.blowdry;
  }
  if (n.includes("brow") || n.includes("lash") || n.includes("eye")) return IMAGES.pedicure;
  if (n.includes("nail") || n.includes("keratin")) return IMAGES.manicure;
  return IMAGES.atelier;
}

export const SERVICES: Service[] = MENU.map((r, i) => ({
  id: `${slug(r.en)}-${i + 1}`,
  name: r.en,
  nameAr: r.ar,
  price: r.price,
  duration: r.dur,
  category: r.cat,
  image: pickImage(r.en, r.cat),
}));

export const CATEGORY_LABEL: Record<Category, { en: string; ar: string }> = {
  nails: { en: "Nails", ar: "الأظافر" },
  hair: { en: "Hair", ar: "الشعر" },
  spa: { en: "Care & Spa", ar: "العناية والسبا" },
};

export interface Artisan {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  image: string;
}

/** Temporary: staff portraits hidden until real photos are supplied.
 *  Set back to `true` when the official photos are uploaded to public/images/. */
export const SHOW_ARTISAN_IMAGES = false;

export const ARTISANS: Artisan[] = [
  {
    id: "noor",
    name: "Noor",
    nameAr: "نور",
    title: "Atelier Director · Colour",
    titleAr: "مديرة الأتيليه",
    image: "images/artisan1.jpg",
  },
  {
    id: "sofia",
    name: "Sofia",
    nameAr: "صوفيا",
    title: "Senior Stylist · Cut & Form",
    titleAr: "خبيرة تصفيف الشعر",
    image: "images/artisan2.jpg",
  },
  {
    id: "maya",
    name: "Maya",
    nameAr: "مايا",
    title: "Master Nail Artisan",
    titleAr: "أخصائية العناية بالأظافر",
    image: "images/artisan3.jpg",
  },
];

export const SALON = {
  whatsapp: "97450000000",
  whatsappDisplay: "+974 5000 0000",
  instagram: "https://instagram.com/",
  address: "Pearl Boulevard, The Pearl-Qatar, Doha",
  addressAr: "بوليفارد اللؤلؤة، اللؤلؤة-قطر، الدوحة",
  maps: "https://maps.google.com/?q=The+Pearl+Qatar+Doha",
};

export function formatQAR(n: number, lang: "en" | "ar") {
  const v = n.toLocaleString("en-US");
  return lang === "ar" ? `${v} ر.ق` : `QAR ${v}`;
}

export function formatDuration(mins: number, lang: "en" | "ar") {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (lang === "ar") {
    if (h && m) return `${h} س ${m} د`;
    if (h) return `${h} ساعة`;
    return `${m} دقيقة`;
  }
  if (h && m) return `${h}H ${m}M`;
  if (h) return `${h}H`;
  return `${m} MINS`;
}
