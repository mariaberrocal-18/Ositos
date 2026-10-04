export type PetId = "amelia" | "simona";
export type TypeKey =
  | "sintoma"
  | "consulta"
  | "estudio"
  | "vacuna"
  | "desparasitacion"
  | "medicacion"
  | "peso"
  | "turno";

export type Pet = {
  id: PetId;
  name: string;
  nick: string;
  born: string;
  breed: string;
  breedShort: string;
  sex: string;
  photo: string;
  paws: string;
  /** Row (in px of the 1122×1402 illustration) where the white panel starts. */
  cut: number;
  face: string;
  bg: string;
  line: string;
  dot: string;
};

export const PETS: Record<PetId, Pet> = {
  amelia: {
    id: "amelia",
    name: "Amelia",
    nick: "Tabby linda",
    born: "2023-02-07",
    breed: "Tabby mestiza",
    breedShort: "Tabby",
    sex: "Hembra",
    photo: "/pets/amelia.jpg",
    paws: "/pets/amelia-paws.webp",
    cut: 1135,
    face: "/pets/amelia-face.jpg",
    bg: "var(--orange-2)",
    line: "var(--orange)",
    dot: "#F5A055",
  },
  simona: {
    id: "simona",
    name: "Simona",
    nick: "Monita bebé",
    born: "2020-06-21",
    breed: "Siberiana Neva Masquerade mestiza",
    breedShort: "Siberiana",
    sex: "Hembra",
    photo: "/pets/simona.jpg",
    paws: "/pets/simona-paws.webp",
    cut: 1235,
    face: "/pets/simona-face.jpg",
    bg: "var(--pink-2)",
    line: "#E58AAB",
    dot: "#EC8FB0",
  },
};
export const PET_IDS: PetId[] = ["amelia", "simona"];
export const NAV_PETS: PetId[] = ["simona", "amelia"];
export const isPetId = (s: string): s is PetId => s === "amelia" || s === "simona";

export type Field = {
  k: string;
  l: string;
  t: "text" | "textarea" | "date" | "datetime-local" | "time" | "number" | "chips" | "seg";
  req?: boolean;
  half?: boolean;
  ph?: string;
  opts?: string[];
  list?: string[];
  step?: string;
  when?: (v: Record<string, unknown>) => boolean;
};

export type TypeDef = {
  label: string;
  one: string;
  short: string;
  add: string;
  empty: string;
  fields: Field[];
  attach?: boolean;
  attachLabel?: string;
  attachHint?: string;
  attachCta?: string;
};

export const TYPES: Record<TypeKey, TypeDef> = {
  sintoma: {
    label: "Journal",
    one: "Síntoma",
    short: "Journal",
    add: "Journal",
    empty: "Anotá vómitos, cambios de apetito o cualquier cosa rara. Con el tiempo se ven los patrones.",
    fields: [
      { k: "date", l: "Fecha y hora", t: "datetime-local", req: true },
      {
        k: "tags",
        l: "Qué pasó",
        t: "chips",
        opts: ["Vómito de comida", "Vómito de espuma", "Vómito de bilis", "Bola de pelos", "Diarrea", "No quiso comer", "Otro"],
        req: true,
      },
      {
        k: "other",
        l: "Describí qué pasó",
        t: "text",
        req: true,
        ph: "Ej. estornudos, se rasca una oreja",
        when: (v) => Array.isArray(v.tags) && (v.tags as string[]).includes("Otro"),
      },
      { k: "food", l: "Qué había comido", t: "text", ph: "Ej. alimento seco, 30 min antes" },
      { k: "notes", l: "Notas", t: "textarea" },
    ],
    attach: true,
  },
  consulta: {
    label: "Visitas al vet",
    one: "Visita al vet",
    short: "Visitas al vet",
    add: "Agregar visita",
    empty: "Guardá cada visita al veterinario: motivo, diagnóstico e indicaciones.",
    fields: [
      { k: "title", l: "Motivo", t: "text", req: true, ph: "Ej. Control de gastritis" },
      { k: "date", l: "Fecha", t: "date", req: true, half: true },
      { k: "nextDate", l: "Próximo control", t: "date", half: true },
      { k: "vet", l: "Veterinario/a o clínica", t: "text" },
      { k: "diagnosis", l: "Diagnóstico", t: "textarea" },
      { k: "notes", l: "Indicaciones", t: "textarea" },
    ],
    attach: true,
  },
  estudio: {
    label: "Estudios",
    one: "Estudio",
    short: "Estudios",
    add: "Subir estudio",
    empty: "Subí los resultados en PDF o una foto del papel, y anotá un resumen.",
    fields: [
      {
        k: "title",
        l: "Estudio",
        t: "text",
        req: true,
        list: ["Análisis de sangre", "Ecografía abdominal", "Radiografía", "Análisis de orina", "Coproparasitológico", "Endoscopía"],
      },
      { k: "date", l: "Fecha", t: "date", req: true, half: true },
      { k: "vet", l: "Laboratorio / clínica", t: "text", half: true },
      { k: "result", l: "Resultado o resumen", t: "textarea" },
      { k: "notes", l: "Notas", t: "textarea" },
    ],
    attach: true,
  },
  vacuna: {
    label: "Vacunas",
    one: "Vacuna",
    short: "Vacunas",
    add: "Agregar vacuna",
    empty: "Cargá las vacunas de la libreta y la fecha de la próxima dosis para tener el aviso.",
    fields: [
      { k: "title", l: "Vacuna", t: "text", req: true, list: ["Triple felina", "Antirrábica", "Leucemia felina (FeLV)", "Quíntuple felina"] },
      { k: "date", l: "Aplicada el", t: "date", req: true, half: true },
      { k: "nextDate", l: "Próxima dosis", t: "date", half: true },
      { k: "vet", l: "Veterinaria", t: "text" },
      { k: "notes", l: "Notas", t: "textarea" },
    ],
    attach: true,
  },
  desparasitacion: {
    label: "Desparasitación",
    one: "Desparasitación",
    short: "Desparasitación",
    add: "Agregar desparasitación",
    empty: "Registrá cada pipeta o pastilla con la fecha de la próxima.",
    fields: [
      { k: "kind", l: "Tipo", t: "seg", opts: ["Interna", "Externa", "Ambas"], req: true },
      { k: "title", l: "Producto", t: "text", req: true, ph: "Ej. Bravecto, Milbemax" },
      { k: "date", l: "Fecha", t: "date", req: true, half: true },
      { k: "nextDate", l: "Próxima", t: "date", half: true },
      { k: "notes", l: "Notas", t: "textarea" },
    ],
  },
  medicacion: {
    label: "Medicación",
    one: "Medicación",
    short: "Remedios",
    add: "Agregar medicación",
    empty: "Anotá tratamientos con dosis y frecuencia. Los que no tienen fecha de fin quedan como activos.",
    fields: [
      { k: "title", l: "Medicamento", t: "text", req: true },
      { k: "dose", l: "Dosis", t: "text", half: true, ph: "Ej. 1/4 comprimido" },
      { k: "freq", l: "Frecuencia", t: "text", half: true, ph: "Ej. cada 12 h" },
      { k: "date", l: "Desde", t: "date", req: true, half: true },
      { k: "endDate", l: "Hasta", t: "date", half: true },
      { k: "notes", l: "Notas", t: "textarea" },
    ],
  },
  peso: {
    label: "Peso",
    one: "Peso",
    short: "Peso",
    add: "Registrar peso",
    empty: "Registrá el peso en cada visita o cuando la pesen en casa.",
    fields: [
      { k: "kg", l: "Peso (kg)", t: "number", req: true, half: true, step: "0.01" },
      { k: "date", l: "Fecha", t: "date", req: true, half: true },
      { k: "notes", l: "Notas", t: "textarea" },
    ],
  },
  turno: {
    label: "Turnos",
    one: "Turno con el vet",
    short: "Turnos",
    add: "Agendar visita al vet",
    empty: "Agendá la próxima visita al vet con día, hora, lugar y lo que hay que preparar antes.",
    fields: [
      { k: "title", l: "Motivo", t: "text", req: true, ph: "Ej. Control de gastritis, vacunas" },
      { k: "date", l: "Día", t: "date", req: true, half: true },
      { k: "time", l: "Hora", t: "time", half: true },
      { k: "place", l: "Dónde", t: "text", ph: "Ej. Puppis Olivos, Dra. Flores" },
      { k: "prep", l: "Antes de ir", t: "textarea", ph: "Ej. 8 horas de ayuno, llevar la libreta y muestra de materia fecal" },
      { k: "notes", l: "Notas", t: "textarea", ph: "Preguntas para hacerle al vet" },
    ],
    attach: true,
    attachLabel: "Receta u orden del vet",
    attachHint: "Sacale una foto a la receta o a la hoja con los estudios pedidos, así no se pierde.",
    attachCta: "Subir receta u orden",
  },
};
export const TYPE_KEYS = Object.keys(TYPES) as TypeKey[];
export const HOME_TILES: TypeKey[] = ["sintoma", "estudio", "desparasitacion", "medicacion"];
export const PET_TILES: TypeKey[] = ["sintoma", "consulta", "vacuna", "peso"];
export type TabKey = "resumen" | "documentos" | TypeKey;
export const TAB_ORDER: TabKey[] = ["resumen", "documentos", "turno", "sintoma", "consulta", "estudio", "vacuna", "desparasitacion", "medicacion", "peso"];

export type FileRef = { path: string; name: string; type: string; addedAt?: string };

/** A record as the UI sees it: fixed columns + the type-specific fields from `data`. */
export type Rec = {
  id: string;
  petId: PetId;
  type: TypeKey;
  date: string;
  files: FileRef[];
  createdAt?: string;
  createdBy?: string | null;
  source?: string | null;
  title?: string;
  nextDate?: string;
  endDate?: string;
  kind?: string;
  tags?: string[];
  other?: string;
  kg?: number;
  vet?: string;
  dose?: string;
  time?: string;
  place?: string;
  prep?: string;
  group?: string;
  freq?: string;
  [k: string]: unknown;
};

export type PetData = { castrada?: string; condiciones?: string; grupo_sanguineo?: string; docs?: FileRef[] };
