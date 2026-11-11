import { useSyncExternalStore } from "react";
import { SERVICES, type Category, type Service } from "./data";

/* ───────── Types ───────── */
export type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "deposit" | "paid" | "refunded";

export interface BookingLine {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  duration: number;
}

export interface Booking {
  id: string;
  ref: string;
  createdAt: string; // ISO
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  total: number;
  deposit: "half" | "full";
  depositAmount: number;
  name: string;
  phone: string;
  notes: string;
  artisan: string;
  method: "apple" | "card";
  services: BookingLine[];
  status: BookingStatus;
  payment: PaymentStatus;
}

export interface Override {
  price?: number;
  duration?: number;
  unavailable?: boolean;
}

export interface Settings {
  whatsapp: string;
  whatsappDisplay: string;
  address: string;
  addressAr: string;
  /** Optional JSON endpoint shared by ALL visitors (PUT on save / GET on load). */
  syncUrl?: string;
  /** How many bookings may share one time slot before it closes automatically. */
  slotCapacity?: number;
  /** Manually blocked slots: "YYYY-MM-DD|HH:MM" */
  blockedSlots?: string[];
  /** Per-hour capacity rules: block a specific hour after N bookings. */
  slotRules?: { hour: number; capacity: number }[];
}

export interface HoursRow {
  label: string;
  labelAr: string;
  from: string;
  to: string;
  closed: boolean;
}

export interface SalonLocation {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  mapUrl: string;
  hours: HoursRow[];
}

export interface Media {
  heroImage: string;
  storefrontImage: string;
  shampooImage: string;
  basinImage: string;
  gallery: string[];
}

export const DEFAULT_MEDIA: Media = {
  heroImage: "images/hero-original.jpg",
  storefrontImage: "images/atelier.jpg",
  shampooImage: "images/color.jpg",
  basinImage: "images/pedicure.jpg",
  gallery: ["images/manicure.jpg", "images/blowdry.jpg", "images/color.jpg", "images/atelier.jpg"],
};

export interface State {
  overrides: Record<string, Override>;
  custom: Service[];
  removed: string[];
  bookings: Booking[];
  settings: Settings;
  locations: SalonLocation[];
  media: Media;
}

/* ───────── Storage ───────── */
const KEY = "within-admin-v1";

export const DEFAULT_SETTINGS: Settings = {
  whatsapp: "97431011007",
  whatsappDisplay: "+974 3101 1007",
  address: "Pearl Boulevard, The Pearl-Qatar, Doha",
  addressAr: "بوليفارد اللؤلؤة، اللؤلؤة-قطر، الدوحة",
};

/** Keeps the owner's device on the live number even if localStorage still holds the old placeholder. */
function reconcileSettings(raw: Partial<Settings> | undefined): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  if (!s.whatsapp || s.whatsapp === "97450000000") s.whatsapp = DEFAULT_SETTINGS.whatsapp;
  if (!s.whatsappDisplay || s.whatsappDisplay === "+974 5000 0000") s.whatsappDisplay = DEFAULT_SETTINGS.whatsappDisplay;
  if (!s.slotCapacity || s.slotCapacity < 1) s.slotCapacity = 3;
  if (!Array.isArray(s.blockedSlots)) s.blockedSlots = [];
  if (!Array.isArray(s.slotRules)) s.slotRules = [];
  return s;
}

/** Locations are temporarily disabled (no fixed branch yet). Kept in data only. */
export const DEFAULT_LOCATIONS: SalonLocation[] = [
  {
    id: "loc_pearl",
    name: "within — The Pearl",
    nameAr: "ويذين — اللؤلؤة",
    address: "Pearl Boulevard, The Pearl-Qatar, Doha",
    addressAr: "بوليفارد اللؤلؤة، اللؤلؤة-قطر، الدوحة",
    mapUrl: "https://maps.google.com/?q=The+Pearl+Qatar+Doha",
    hours: [
      { label: "Saturday — Thursday", labelAr: "السبت — الخميس", from: "10:00", to: "22:00", closed: false },
      { label: "Friday", labelAr: "الجمعة", from: "14:00", to: "22:00", closed: false },
    ],
  },
];

function iso(daysAhead: number, h = 11, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(h, m, 0, 0);
  return d;
}
function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lines(...names: string[]): BookingLine[] {
  return names.map((n, i) => {
    const s = SERVICES.find((x) => x.name === n) ?? SERVICES[(i * 7) % SERVICES.length];
    return { id: s.id, name: s.name, nameAr: s.nameAr, price: s.price, duration: s.duration };
  });
}

function seed(): Booking[] {
  const make = (
    n: number,
    guest: string,
    phone: string,
    svc: string[],
    when: Date,
    time: string,
    artisan: string,
    status: BookingStatus,
    payment: PaymentStatus,
    deposit: "half" | "full",
    method: "apple" | "card",
    notes = "",
  ): Booking => {
    const services = lines(...svc);
    const total = services.reduce((a, s) => a + s.price, 0);
    return {
      id: `b_${n}`,
      ref: `WTN-${when.getFullYear()}-${String(100123 + n).slice(-6)}`,
      createdAt: iso(-Math.max(1, n)).toISOString(),
      date: dateStr(when),
      time,
      duration: services.reduce((a, s) => a + s.duration, 0),
      total,
      deposit,
      depositAmount: deposit === "half" ? Math.round(total / 2) : total,
      name: guest,
      phone,
      notes,
      artisan,
      method,
      services,
      status,
      payment,
    };
  };

  return [
    make(1, "Amal Al-Thani", "3312 4478", ["Long-Wear Gel Polish Application", "The Essential Classic Pedicure"], iso(0, 17, 30), "17:30", "Maya", "confirmed", "deposit", "half", "apple", "Gel in soft nude."),
    make(2, "Layla Haddad", "5590 1123", ["Bespoke Balayage & Sun-Kissed Lights"], iso(1, 10, 0), "10:00", "Noor", "new", "deposit", "half", "card", "Wants warm caramel tones."),
    make(3, "Noora Al-Kuwari", "6674 9021", ["The Signature Atelier Blowout (Long)", "Classic Pure Polish Application"], iso(1, 19, 0), "19:00", "Sofia", "confirmed", "paid", "full", "apple"),
    make(4, "Fatma Al-Sulaiti", "3045 7788", ["Full Dimensional Color Alchemy"], iso(2, 14, 30), "14:30", "Noor", "new", "pending", "half", "card", "Colour consultation first."),
    make(5, "Maryam Zainal", "7712 3390", ["Couture Precision Cut & Styling", "Couture Deep Recovery Hair Ritual"], iso(-2, 16, 0), "16:00", "Sofia", "completed", "paid", "full", "apple"),
    make(6, "Hessa Al-Mannai", "5566 2210", ["Long-Wear Gel Polish Pedicure"], iso(-1, 12, 0), "12:00", "Maya", "cancelled", "refunded", "half", "card", "Rescheduled by guest."),
  ];
}

function initial(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as State;
      return {
        overrides: p.overrides ?? {},
        custom: p.custom ?? [],
        removed: p.removed ?? [],
        bookings: p.bookings ?? [],
        settings: reconcileSettings(p.settings),
        locations: p.locations && p.locations.length ? p.locations : DEFAULT_LOCATIONS,
        media: { ...DEFAULT_MEDIA, ...(p.media ?? {}), gallery: p.media?.gallery ?? DEFAULT_MEDIA.gallery },
      };
    }
  } catch {
    /* fresh start */
  }
  return {
    overrides: {},
    custom: [],
    removed: [],
    bookings: seed(),
    settings: DEFAULT_SETTINGS,
    locations: DEFAULT_LOCATIONS,
    media: DEFAULT_MEDIA,
  };
}

let state: State = initial();
const listeners = new Set<() => void>();

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
  listeners.forEach((l) => l());
}

/* Real-time sync: another tab (or the live page) saving prices updates this one instantly */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      const p = JSON.parse(e.newValue) as State;
      state = {
        overrides: p.overrides ?? {},
        custom: p.custom ?? [],
        removed: p.removed ?? [],
        bookings: p.bookings ?? [],
        settings: reconcileSettings(p.settings),
        locations: p.locations && p.locations.length ? p.locations : DEFAULT_LOCATIONS,
        media: { ...DEFAULT_MEDIA, ...(p.media ?? {}), gallery: p.media?.gallery ?? DEFAULT_MEDIA.gallery },
      };
      listeners.forEach((l) => l());
    } catch {
      /* ignore malformed payload */
    }
  });
}

export function getState() {
  return state;
}

/* ───────── Live sync (cross-device) ─────────
   localStorage is device-local. When the owner publishes a JSON endpoint
   (Settings › Sync URL), every save PUTs there and every visitor GETs it. */
function syncPayload(s: State) {
  return {
    overrides: s.overrides,
    custom: s.custom,
    removed: s.removed,
    media: s.media,
    locations: s.locations,
    settings: s.settings,
  };
}

export type SyncResult = "off" | "ok" | "fail";

export async function pushSync(): Promise<SyncResult> {
  const url = (state.settings.syncUrl || "").trim();
  if (!url) return "off";
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncPayload(state)),
      mode: "cors",
      cache: "no-store",
    });
    return res.ok ? "ok" : "fail";
  } catch {
    return "fail";
  }
}

export async function pullSync(): Promise<boolean> {
  const url = (state.settings.syncUrl || "").trim();
  if (!url) return false;
  try {
    const res = await fetch(url, { cache: "no-store", mode: "cors" });
    if (!res.ok) return false;
    const p = await res.json();
    if (!p || typeof p !== "object") return false;
    state = {
      ...state,
      overrides: p.overrides ?? state.overrides,
      custom: p.custom ?? state.custom,
      removed: p.removed ?? state.removed,
      media: { ...state.media, ...(p.media ?? {}) },
      locations: Array.isArray(p.locations) && p.locations.length ? p.locations : state.locations,
      settings: { ...state.settings, ...(p.settings ?? {}) },
    };
    emit();
    return true;
  } catch {
    return false;
  }
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ───────── Effective menu (base + custom − removed + overrides) ───────── */
export function resolveServices(s: State): Service[] {
  const all = [...SERVICES, ...s.custom].filter((x) => !s.removed.includes(x.id));
  return all.map((x) => {
    const o = s.overrides[x.id];
    return { ...x, price: o?.price ?? x.price, duration: o?.duration ?? x.duration };
  });
}

export function isUnavailable(s: State, id: string) {
  return !!s.overrides[id]?.unavailable;
}

export function useServices(): Service[] {
  const s = useStore();
  return resolveServices(s);
}

/* ───────── Actions ───────── */
export const admin = {
  setPrice(id: string, price: number) {
    setState((s) => ({ overrides: { ...s.overrides, [id]: { ...s.overrides[id], price } } }));
  },
  setDuration(id: string, duration: number) {
    setState((s) => ({ overrides: { ...s.overrides, [id]: { ...s.overrides[id], duration } } }));
  },
  toggleUnavailable(id: string, value?: boolean) {
    setState((s) => {
      const o = s.overrides[id] ?? {};
      const next = value ?? !o.unavailable;
      return { overrides: { ...s.overrides, [id]: { ...o, unavailable: next } } };
    });
  },
  hide(id: string, hide = true) {
    setState((s) => ({
      removed: hide ? [...new Set([...s.removed, id])] : s.removed.filter((x) => x !== id),
    }));
  },
  remove(id: string) {
    setState((s) => ({
      custom: s.custom.filter((c) => c.id !== id),
      removed: [...new Set([...s.removed.filter((x) => x !== id), id])],
      overrides: Object.fromEntries(Object.entries(s.overrides).filter(([k]) => k !== id)),
    }));
  },
  addService(input: { name: string; nameAr: string; price: number; duration: number; category: Category }) {
    const slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `service-${Date.now()}`;
    const svc: Service = {
      id: `${slug}-${Math.random().toString(36).slice(2, 5)}`,
      name: input.name.trim(),
      nameAr: input.nameAr.trim() || input.name.trim(),
      price: input.price,
      duration: input.duration,
      category: input.category,
      image: input.category === "nails" ? "images/manicure.jpg" : "images/blowdry.jpg",
    };
    setState((s) => ({
      custom: [svc, ...s.custom],
      overrides: { ...s.overrides, [svc.id]: { ...s.overrides[svc.id], unavailable: false } },
    }));
    return svc.id;
  },
  setStatus(id: string, status: BookingStatus) {
    setState((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }));
  },
  setPayment(id: string, payment: PaymentStatus, amount?: number) {
    setState((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, payment, ...(amount !== undefined ? { depositAmount: amount } : {}) } : b,
      ),
    }));
  },
  markPaid(id: string) {
    setState((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, payment: "paid", depositAmount: b.total } : b)),
    }));
  },
  addBooking(b: Booking) {
    setState((s) => ({ bookings: [b, ...s.bookings.filter((x) => x.ref !== b.ref)] }));
  },
  updateSettings(patch: Partial<Settings> | ((s: Settings) => Partial<Settings>)) {
    setState((s) => ({ settings: { ...s.settings, ...(typeof patch === "function" ? patch(s.settings) : patch) } }));
  },
  setLocations(list: SalonLocation[]) {
    setState({ locations: list.length ? list : DEFAULT_LOCATIONS });
  },
  addLocation() {
    const loc: SalonLocation = {
      id: `loc_${Date.now().toString(36)}`,
      name: "",
      nameAr: "",
      address: "",
      addressAr: "",
      mapUrl: "",
      hours: [
        { label: "Saturday — Thursday", labelAr: "السبت — الخميس", from: "10:00", to: "22:00", closed: false },
        { label: "Friday", labelAr: "الجمعة", from: "14:00", to: "22:00", closed: false },
      ],
    };
    setState((s) => ({ locations: [...s.locations, loc] }));
    return loc.id;
  },
  setSlotRules(rules: { hour: number; capacity: number }[]) {
    setState((s) => ({ settings: { ...s.settings, slotRules: rules } }));
  },
  setSlotCapacity(capacity: number) {
    setState((s) => ({ settings: { ...s.settings, slotCapacity: Math.max(1, capacity) } }));
  },
  setMedia(patch: Partial<Media>) {
    setState((s) => ({ media: { ...s.media, ...patch } }));
  },
  removeLocation(id: string) {
    setState((s) => ({ locations: s.locations.filter((l) => l.id !== id).length ? s.locations.filter((l) => l.id !== id) : DEFAULT_LOCATIONS }));
  },
  resetDemo() {
    setState({ bookings: seed(), overrides: {}, custom: [], removed: [] });
  },
};

/* ───────── Helpers ───────── */
export function receivedTotal(b: Booking) {
  if (b.payment === "pending" || b.payment === "refunded") return 0;
  return b.payment === "paid" ? b.total : b.depositAmount;
}
export function outstanding(b: Booking) {
  if (b.status === "cancelled") return 0;
  return b.total - receivedTotal(b);
}
export const STATUS_LABEL: Record<BookingStatus, string> = { new: "New", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };
export const PAYMENT_LABEL: Record<PaymentStatus, string> = { pending: "Pending", deposit: "Deposit", paid: "Paid", refunded: "Refunded" };
