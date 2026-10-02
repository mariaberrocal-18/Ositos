import { PETS, TYPES, type PetData, type PetId, type Rec } from "./config";

export const pad = (n: number) => String(n).padStart(2, "0");
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const nowLocal = () => {
  const d = new Date();
  return `${todayStr()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const parseD = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function fmtDate(s?: string, withYear = true) {
  if (!s) return "";
  const d = parseD(s);
  let o = `${d.getDate()} ${MES[d.getMonth()]}`;
  if (withYear) o += ` ${d.getFullYear()}`;
  if (s.length > 10) o += ` · ${s.slice(11, 16)}`;
  return o;
}
export const daysBetween = (a: string, b: string) => Math.round((parseD(b).getTime() - parseD(a).getTime()) / 86400000);

function span(n: number) {
  if (n < 45) return `${n} días`;
  const m = Math.round(n / 30.44);
  if (m < 12) return `${m} mes${m > 1 ? "es" : ""}`;
  const y = Math.floor(m / 12),
    r = m % 12;
  return `${y} año${y > 1 ? "s" : ""}${r ? ` y ${r} mes${r > 1 ? "es" : ""}` : ""}`;
}
export function rel(s: string) {
  const n = daysBetween(todayStr(), s);
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  return n > 0 ? `en ${span(n)}` : `hace ${span(-n)}`;
}
export function age(born: string) {
  const b = parseD(born),
    t = new Date();
  let m = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) m--;
  const y = Math.floor(m / 12),
    r = m % 12;
  return {
    short: y ? `${y} año${y > 1 ? "s" : ""}` : `${r} meses`,
    long: y ? `${y} año${y > 1 ? "s" : ""}${r ? ` y ${r} mes${r > 1 ? "es" : ""}` : ""}` : `${r} meses`,
  };
}
export const kgf = (v: number) => (Math.round(v * 100) / 100).toString().replace(".", ",");

export function recTitle(r: Rec) {
  if (r.type === "sintoma") return (r.tags || []).map((x) => (x === "Otro" && r.other ? r.other : x)).join(", ") || "Síntoma";
  if (r.type === "peso") return `${kgf(Number(r.kg))} kg`;
  if (r.type === "desparasitacion") return `${r.title}${r.kind ? ` · ${r.kind}` : ""}`;
  return r.title || TYPES[r.type]?.one;
}
export function recSub(r: Rec) {
  const bits = [fmtDate(r.date)];
  if (r.type === "medicacion") {
    if (r.dose) bits.push(r.dose);
    if (r.freq) bits.push(r.freq);
  } else if (r.vet) bits.push(r.vet);
  return bits.filter(Boolean).join(" · ");
}
export const isActiveMed = (r: Rec) => r.type === "medicacion" && (!r.endDate || r.endDate >= todayStr());
export const conditions = (pd?: PetData) =>
  (pd?.condiciones || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Latest record per (pet, type, product) that has a next date, soonest first. */
export function upcoming(records: Rec[], petId?: PetId) {
  const latest: Record<string, Rec> = {};
  for (const r of records) {
    if (!["vacuna", "desparasitacion", "consulta"].includes(r.type)) continue;
    if (petId && r.petId !== petId) continue;
    const key = `${r.petId}|${r.type}|${r.type === "desparasitacion" ? r.kind || "" : r.type === "consulta" ? "c" : (r.title || "").toLowerCase()}`;
    if (!latest[key] || (r.date || "") > (latest[key].date || "")) latest[key] = r;
  }
  return Object.values(latest)
    .filter((r) => r.nextDate)
    .sort((a, b) => a.nextDate!.localeCompare(b.nextDate!));
}
export type Due = "bad" | "warn" | "ok";
export function dueStatus(next: string): [Due, string] {
  const n = daysBetween(todayStr(), next);
  if (n < 0) return ["bad", "Vencida"];
  if (n <= 30) return ["warn", rel(next)];
  return ["ok", fmtDate(next)];
}
export function vomitStats(records: Rec[], id: PetId) {
  const sym = records.filter((r) => r.petId === id && r.type === "sintoma");
  const vom = sym.filter((r) => (r.tags || []).some((t) => t.startsWith("Vómito") || t === "Bola de pelos"));
  const last = vom
    .map((r) => r.date.slice(0, 10))
    .sort()
    .pop();
  const since = last ? daysBetween(last, todayStr()) : null;
  const in30 = sym.filter((r) => daysBetween(r.date.slice(0, 10), todayStr()) <= 30).length;
  return { sym, since, in30 };
}
export const petName = (id: PetId) => PETS[id].name;
export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
}
