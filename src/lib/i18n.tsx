import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const en = {
  nav: { services: "Services", atelier: "The Atelier", gallery: "Gallery", visit: "Visit" },
  book: "Book Appointment",
  bookShort: "Book",
  hero: {
    eyebrow: "Doha — A women-only sanctuary",
    l1: "The quiet art",
    l2: "of being",
    accent: "within.",
    sub: "A private atelier for nails and hair in the heart of Doha. Unhurried rituals, bespoke attention, and an hour that belongs entirely to you.",
    cta: "Book Appointment",
    explore: "Explore Services",
    badge: "Appointments open this week",
    caption: "Ritual N°01 — Butter Gloss",
    scroll: "Scroll",
  },
  marquee: ["Nails", "Hair", "Rituals", "Women only", "Doha", "Bespoke care"],
  menu: {
    eyebrow: "(The Menu)",
    title1: "Treatments,",
    accent: "considered.",
    sub: "Every service begins with a quiet consultation. All prices in Qatari Riyal.",
    all: "All",
    nails: "Nails",
    hair: "Hair",
    reserve: "Reserve",
    tapHint: "Select any treatment to begin your reservation.",
  },
  atelier: {
    eyebrow: "(The Atelier)",
    title1: "An architecture",
    accent: "of calm.",
    body: "within was imagined as a pause — soft light, arched alcoves and the hush of a private salon. Here, every appointment is unhurried. Every artisan listens first. Every detail, from the temperature of the towel to the shade of the polish, is chosen for you.",
    pillars: [
      { t: "Bespoke consultation", d: "A private conversation before every ritual, so nothing is assumed." },
      { t: "Women-only sanctuary", d: "A discreet, fully private space designed for comfort and ease." },
      { t: "Considered products", d: "Clean, gentle formulas selected for the Gulf climate." },
    ],
    artisans: "Our artisans",
    artisansSub: "Exceptional craft, care beyond expectation.",
  },
  visit: {
    eyebrow: "(Visit)",
    title1: "Find us,",
    accent: "softly.",
    address: "Address",
    hours: "Hours",
    days: [
      { d: "Saturday — Thursday", h: "10:00 — 22:00" },
      { d: "Friday", h: "14:00 — 22:00" },
    ],
    tz: "All times Arabia Standard Time (GMT+3)",
    concierge: "Concierge",
    whatsapp: "Message on WhatsApp",
    maps: "Open in Maps",
  },
  footer: {
    line: "Beauty, quietly returned to you.",
    rights: "All rights reserved.",
    follow: "Follow",
    language: "Language",
  },
  drawer: {
    title: "Concierge",
    steps: ["Treatment", "Date & Time", "Guest details"],
    confirmed: "Confirmed",
    duration: "Duration",
    total: "Total",
    back: "Back",
    close: "Close",
    continue: "Continue",
    confirm: "Confirm booking",
    pay: "Confirm & Pay",
    processing: "Securing your appointment…",
    s1: { title: "Choose your", accent: "treatments.", sub: "Select one or several. Your concierge total updates as you go." },
    s2: { title: "Your", accent: "artisan.", sub: "Request a specialist, or let us pair you with the first available master." },
    anyTitle: "First Available Master",
    anySub: "Matched to your treatments by our concierge",
    s3: { title: "Date &", accent: "hour.", sub: "Doha time (GMT+3). Muted hours are already reserved." },
    selectDate: "Select a day to reveal available hours.",
    noSlots: "This day is fully reserved. Perhaps another?",
    s4: { title: "Guest", accent: "profile.", sub: "A few details, and a deposit to hold your hour." },
    name: "Full name",
    namePh: "Your name",
    phone: "WhatsApp number",
    phonePh: "5555 1234",
    notes: "Special requests",
    notesPh: "Allergies, preferences, a favourite shade…",
    optional: "Optional",
    deposit: "Deposit",
    half: "50% Deposit",
    full: "Pay in full",
    method: "Payment",
    apple: "Apple Pay",
    card: "Card",
    cardNumber: "Card number",
    expiry: "MM / YY",
    cvc: "CVC",
    secure: "Simulated payment — no charge will be made.",
    ticket: "Invitation",
    guest: "Guest",
    when: "When",
    with: "With",
    dueNow: "Due today",
    remaining: "Remaining at atelier",
    errors: {
      services: "Please select at least one treatment to continue.",
      datetime: "Kindly choose a day and an hour.",
      name: "May we have your full name?",
      phone: "Please share a valid Qatar number — 8 digits.",
      card: "Please complete the card details.",
    },
    conf: {
      eyebrow: "Your hour is held",
      title: "We look forward",
      accent: "to welcoming you.",
      sub: "A confirmation will follow on WhatsApp. Kindly arrive ten minutes early to settle in.",
      ref: "Atelier reference",
      wa: "Confirm via WhatsApp",
      ics: "Save to Calendar",
      done: "Return to the atelier",
    },
    empty: "Nothing selected yet",
  },
};

type Dict = typeof en;

const ar: Dict = {
  nav: { services: "الخدمات", atelier: "عن الصالون", gallery: "معرض الأعمال", visit: "موقعنا" },
  book: "احجزي موعدكِ",
  bookShort: "احجزي",
  hero: {
    eyebrow: "الدوحة — ملاذ مخصص للسيدات",
    l1: "فنُّ السكينة",
    l2: "أن تكوني",
    accent: "في ذاتكِ.",
    sub: "أتيليه خاص للأظافر والشعر في قلب الدوحة. طقوس بلا استعجال، وعناية مصممة لكِ، وساعة تنتمي إليكِ وحدكِ.",
    cta: "احجزي موعدكِ الآن",
    explore: "استكشفي قائمة الأسعار",
    badge: "بالحجز المسبق فقط • الدوحة، قطر",
    caption: "الطقس رقم ٠١ — لمعة الزبدة",
    scroll: "مرّري",
  },
  marquee: ["الأظافر", "الشعر", "الطقوس", "للسيدات فقط", "الدوحة", "عناية خاصة"],
  menu: {
    eyebrow: "(القائمة)",
    title1: "علاجات،",
    accent: "مختارة بعناية.",
    sub: "تبدأ كل خدمة باستشارة هادئة. جميع الأسعار بالريال القطري.",
    all: "جميع الخدمات",
    nails: "الأظافر",
    hair: "الشعر",
    reserve: "اختيار الخدمة",
    tapHint: "اختاري أي علاج لبدء حجزكِ.",
  },
  atelier: {
    eyebrow: "(الأتيليه)",
    title1: "عمارةٌ",
    accent: "من الهدوء.",
    body: "صُمّم within ليكون وقفة — ضوء ناعم، أقواس هادئة، وسكينة صالون خاص. هنا لا استعجال في أي موعد. كل خبيرة تُصغي أولاً. وكل تفصيل، من دفء المنشفة إلى درجة الطلاء، يُختار لأجلكِ.",
    pillars: [
      { t: "استشارة خاصة", d: "حديث خاص قبل كل طقس، حتى لا يُفترض شيء." },
      { t: "ملاذ للسيدات فقط", d: "مساحة خاصة وهادئة صُممت لراحتكِ التامة." },
      { t: "منتجات مختارة", d: "تركيبات نقية ولطيفة تناسب مناخ الخليج." },
    ],
    artisans: "نخبة الخبيرات",
    artisansSub: "حرفية استثنائية وعناية تفوق التوقعات",
  },
  visit: {
    eyebrow: "(زورينا)",
    title1: "تجديننا",
    accent: "بهدوء.",
    address: "العنوان",
    hours: "ساعات العمل",
    days: [
      { d: "السبت — الخميس", h: "10:00 — 22:00" },
      { d: "الجمعة", h: "14:00 — 22:00" },
    ],
    tz: "جميع الأوقات بتوقيت قطر (GMT+3)",
    concierge: "الكونسيرج",
    whatsapp: "راسلينا عبر واتساب",
    maps: "افتحي الخريطة",
  },
  footer: {
    line: "الجمال، يعود إليكِ بهدوء.",
    rights: "جميع الحقوق محفوظة.",
    follow: "تابعينا",
    language: "اللغة",
  },
  drawer: {
    title: "حجز موعد جديد",
    steps: ["اختيار الخدمة", "تحديد الموعد", "بياناتكِ الشخصية"],
    confirmed: "تم التأكيد",
    duration: "المدة",
    total: "الإجمالي",
    back: "رجوع",
    close: "إغلاق",
    continue: "متابعة",
    confirm: "تأكيد الحجز عبر واتساب",
    pay: "تأكيد والدفع",
    processing: "جارٍ تثبيت موعدكِ…",
    s1: { title: "اختاري", accent: "علاجاتكِ.", sub: "اختاري خدمة أو أكثر، ويتحدّث الإجمالي تلقائياً." },
    s2: { title: "خبيرتكِ", accent: "المفضّلة.", sub: "اطلبي خبيرة بعينها، أو دعينا نختار لكِ أول خبيرة متاحة." },
    anyTitle: "أول خبيرة متاحة",
    anySub: "نختارها لكِ بما يناسب علاجاتكِ",
    s3: { title: "اليوم", accent: "والساعة.", sub: "بتوقيت الدوحة (GMT+3). الساعات الباهتة محجوزة مسبقاً." },
    selectDate: "اختاري يوماً لعرض الساعات المتاحة.",
    noSlots: "هذا اليوم محجوز بالكامل. ربما يوم آخر؟",
    s4: { title: "بيانات", accent: "الضيفة.", sub: "بعض التفاصيل، ومقدّم بسيط لتثبيت موعدكِ." },
    name: "الاسم الكامل",
    namePh: "اسمكِ",
    phone: "رقم الجوال (+974)",
    phonePh: "5555 1234",
    notes: "ملاحظات إضافية (اختياري)",
    notesPh: "حساسية، تفضيلات، لونكِ المفضل…",
    optional: "اختياري",
    deposit: "المقدّم",
    half: "مقدّم ٥٠٪",
    full: "الدفع كاملاً",
    method: "طريقة الدفع",
    apple: "Apple Pay",
    card: "بطاقة",
    cardNumber: "رقم البطاقة",
    expiry: "MM / YY",
    cvc: "CVC",
    secure: "دفع تجريبي — لن يتم خصم أي مبلغ.",
    ticket: "دعوة",
    guest: "الضيفة",
    when: "الموعد",
    with: "مع",
    dueNow: "المستحق اليوم",
    remaining: "المتبقي في الأتيليه",
    errors: {
      services: "يرجى اختيار علاج واحد على الأقل للمتابعة.",
      datetime: "يرجى اختيار اليوم والساعة.",
      name: "هل لنا باسمكِ الكامل؟",
      phone: "يرجى إدخال رقم قطري صحيح — ٨ أرقام.",
      card: "يرجى إكمال بيانات البطاقة.",
    },
    conf: {
      eyebrow: "تم تأكيد حجزكِ بنجاح!",
      title: "نتطلع",
      accent: "لاستقبالكِ.",
      sub: "سيصلكِ التأكيد عبر واتساب. نرجو الحضور قبل الموعد بعشر دقائق.",
      ref: "الرقم المرجعي",
      wa: "تأكيد عبر واتساب",
      ics: "أضيفي إلى التقويم",
      done: "العودة إلى الأتيليه",
    },
    empty: "لم يتم اختيار شيء بعد",
  },
};

const DICTS: Record<Lang, Dict> = { en, ar };

interface Ctx {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: Dict;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("within-lang") as Lang) || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem("within-lang", lang);
    } catch {
      /* noop */
    }
  }, [lang]);

  const value: Ctx = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: DICTS[lang],
    setLang,
    toggle: () => setLang(lang === "en" ? "ar" : "en"),
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LangProvider");
  return ctx;
}
