"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PET_IDS, PETS, TYPE_KEYS, TYPES, type Field, type FileRef, type PetData, type PetId, type Rec, type TypeKey } from "@/lib/config";
import { dueStatus, fmtDate, nowLocal, recTitle, rel, todayStr } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUI, type SheetState } from "./ui";
import { Go, Icon } from "./Icon";
import { FileChip } from "./rows";

export function Sheet() {
  const { sheet, close } = useUI();
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, close]);
  if (!sheet) return null;

  let title = "";
  if (sheet.mode === "choose") title = "Nuevo registro";
  else if (sheet.mode === "form") title = sheet.rec ? `Editar ${TYPES[sheet.type].one.toLowerCase()}` : TYPES[sheet.type].add;
  else if (sheet.mode === "detail") title = TYPES[sheet.rec.type].one;
  else title = `Ficha de ${PETS[sheet.pet].name}`;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" />
        <div className="sheet-h">
          <h2>{title}</h2>
          <button className="circ" onClick={close} aria-label="Cerrar">
            <Icon n="x" />
          </button>
        </div>
        {sheet.mode === "choose" && <Choose initial={sheet.pet} />}
        {sheet.mode === "form" && <RecForm key={`${sheet.type}-${sheet.rec?.id || "new"}`} s={sheet} />}
        {sheet.mode === "detail" && <Detail rec={sheet.rec} />}
        {sheet.mode === "ficha" && <Ficha pet={sheet.pet} />}
      </div>
    </div>
  );
}

function PetPicker({ value, onPick }: { value: PetId | null; onPick: (p: PetId) => void }) {
  return (
    <div className="picker">
      {PET_IDS.map((id) => (
        <button type="button" key={id} className={`pick c-${id}`} aria-pressed={value === id} onClick={() => onPick(id)}>
          <img src={PETS[id].face} alt="" />
          {PETS[id].name}
        </button>
      ))}
    </div>
  );
}

function Choose({ initial }: { initial: PetId | null }) {
  const { open } = useUI();
  const [pet, setPet] = useState<PetId | null>(initial);
  return (
    <>
      <div className="fld">
        <span className="lbl">¿De quién?</span>
        <PetPicker value={pet} onPick={setPet} />
      </div>
      <div className="fld" style={{ marginTop: 16 }}>
        <span className="lbl">¿Qué querés anotar?</span>
        <div className="types">
          {TYPE_KEYS.map((t) => (
            <button key={t} className={`type t-${t}`} disabled={!pet} onClick={() => open({ mode: "form", type: t, pet })}>
              <Icon n={t} />
              {TYPES[t].one}
            </button>
          ))}
        </div>
        {!pet && <span className="by">Elegí primero a Amelia o a Simona.</span>}
      </div>
    </>
  );
}

type Vals = Record<string, unknown>;

function initialVals(type: TypeKey, rec?: Rec, prefill?: Vals): Vals {
  if (rec) return { ...rec };
  if (prefill) return { ...prefill };
  const df = TYPES[type].fields.find((f) => f.k === "date");
  return df ? { date: df.t === "datetime-local" ? nowLocal() : todayStr() } : {};
}

function errMsg(e: unknown) {
  const m = String((e as { message?: string })?.message || e);
  if (/row-level security|permission|not allowed/i.test(m)) return "No tenés permiso para guardar. Revisá que tu email esté habilitado.";
  if (/payload too large|exceeded|size/i.test(m)) return "El archivo es demasiado grande.";
  return "No se pudo guardar. Revisá tu conexión y volvé a intentar.";
}

function RecForm({ s }: { s: Extract<SheetState, { mode: "form" }> }) {
  const { saveRecord, uploadFile } = useStore();
  const { close, toast } = useUI();
  const t = TYPES[s.type];
  const [pet, setPet] = useState<PetId | null>(s.pet);
  // A new vet appointment can be for both cats at once.
  const multi = s.type === "turno" && !s.rec;
  const [pets, setPets] = useState<PetId[]>(s.pet ? [s.pet] : []);
  const [vals, setVals] = useState<Vals>(() => initialVals(s.type, s.rec, s.prefill));
  const [files, setFiles] = useState<FileRef[]>(() => [...(s.rec?.files || [])]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const otherRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: unknown) => setVals((p) => ({ ...p, [k]: v }));

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return;
    const owner = multi ? pets[0] : pet;
    if (!owner) return setErr("Elegí primero a qué gatita corresponde.");
    setUploading(true);
    setErr("");
    for (const f of Array.from(list)) {
      try {
        const ref = await uploadFile(f, owner);
        setFiles((p) => [...p, ref]);
      } catch (e) {
        setErr(`No se pudo subir ${f.name}. ${errMsg(e)}`);
      }
    }
    setUploading(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (multi ? !pets.length : !pet) return setErr("Elegí a qué gatita corresponde.");
    const data: Vals = {};
    for (const f of t.fields) {
      if (f.when && !f.when(vals)) {
        data[f.k] = "";
        continue;
      }
      let v = vals[f.k];
      if (f.t === "number") v = v === "" || v == null ? "" : Number(String(v).replace(",", "."));
      const empty = v === "" || v == null || (Array.isArray(v) && !v.length) || (typeof v === "number" && Number.isNaN(v));
      if (f.req && empty) return setErr(`Falta completar: ${f.l}.`);
      data[f.k] = v ?? "";
    }
    setBusy(true);
    setErr("");
    try {
      const keep = s.rec ? Object.fromEntries(Object.entries(s.rec).filter(([k]) => !(k in data))) : {};
      if (multi) {
        const group = pets.length > 1 ? crypto.randomUUID() : undefined;
        for (const p of pets) await saveRecord({ ...data, ...(group ? { group } : {}), petId: p, type: s.type, date: String(data.date), files });
      } else {
        await saveRecord({ ...keep, ...data, petId: pet!, type: s.type, date: String(data.date), files }, s.rec?.id);
      }
      close();
      toast("Guardado");
    } catch (e2) {
      setBusy(false);
      setErr(errMsg(e2));
    }
  };

  const field = (f: Field) => {
    if (f.when && !f.when(vals)) return null;
    const v = vals[f.k];
    const id = `f_${f.k}`;
    if (f.t === "textarea")
      return (
        <div className="fld" key={f.k}>
          <label htmlFor={id}>{f.l}</label>
          <textarea id={id} value={String(v ?? "")} placeholder={f.ph} onChange={(e) => set(f.k, e.target.value)} />
        </div>
      );
    if (f.t === "chips") {
      const sel = new Set((v as string[]) || []);
      return (
        <div className="fld" key={f.k}>
          <span className="lbl">{f.l}</span>
          <div className="opts">
            {f.opts!.map((o) => (
              <button
                type="button"
                key={o}
                className="opt"
                aria-pressed={sel.has(o)}
                onClick={() => {
                  const n = new Set(sel);
                  if (n.has(o)) n.delete(o);
                  else n.add(o);
                  set(f.k, [...n]);
                  if (o === "Otro" && n.has(o)) setTimeout(() => otherRef.current?.focus(), 0);
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (f.t === "seg")
      return (
        <div className="fld" key={f.k}>
          <span className="lbl">{f.l}</span>
          <div className="opts">
            {f.opts!.map((o) => (
              <button type="button" key={o} className="opt" aria-pressed={v === o} onClick={() => set(f.k, v === o ? "" : o)}>
                {o}
              </button>
            ))}
          </div>
        </div>
      );
    return (
      <div className="fld" key={f.k}>
        <label htmlFor={id}>{f.l}</label>
        <input
          id={id}
          ref={f.k === "other" ? otherRef : undefined}
          type={f.t}
          step={f.step}
          inputMode={f.step ? "decimal" : undefined}
          value={String(v ?? "")}
          placeholder={f.ph}
          list={f.list ? `dl_${f.k}` : undefined}
          onChange={(e) => set(f.k, e.target.value)}
        />
        {f.list && (
          <datalist id={`dl_${f.k}`}>
            {f.list.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
      </div>
    );
  };

  const rows: React.ReactNode[] = [];
  for (let i = 0; i < t.fields.length; i++) {
    const f = t.fields[i];
    const nx = t.fields[i + 1];
    if (f.half && nx?.half) {
      rows.push(
        <div className="pair" key={f.k + nx.k}>
          {field(f)}
          {field(nx)}
        </div>,
      );
      i++;
    } else rows.push(field(f));
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        {multi ? (
          <>
            <div className="picker">
              {PET_IDS.map((id) => (
                <button
                  type="button"
                  key={id}
                  className={`pick c-${id}`}
                  aria-pressed={pets.includes(id)}
                  onClick={() => setPets((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
                >
                  <img src={PETS[id].face} alt="" />
                  {PETS[id].name}
                </button>
              ))}
            </div>
            <span className="by" style={{ display: "block", marginTop: 8 }}>
              Podés elegir a las dos si van juntas.
            </span>
          </>
        ) : (
          <PetPicker value={pet} onPick={setPet} />
        )}
      </div>
      <form onSubmit={submit} noValidate>
        {rows}
        {t.attach && (
          <div className="fld">
            <span className="lbl">Archivos</span>
            {files.length > 0 && (
              <div className="files">
                {files.map((f, i) => (
                  <FileChip key={f.path} f={f} onRemove={() => setFiles((p) => p.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
            <label className="addfile" htmlFor="fileIn">
              <Icon n="clip" />
              {uploading ? "Subiendo…" : "Adjuntar PDF o foto"}
            </label>
            <input id="fileIn" type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => void onUpload(e.target.files)} />
          </div>
        )}
        {err && <div className="err">{err}</div>}
        <div className="actions">
          <button type="button" className="btn white" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={busy || uploading}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </>
  );
}

function Detail({ rec }: { rec: Rec }) {
  const { records, deleteRecord, authorName } = useStore();
  const { open, close, toast } = useUI();
  const [confirm, setConfirm] = useState(false);
  const r = records.find((x) => x.id === rec.id) || rec;
  const t = TYPES[r.type];
  const together = r.group ? records.filter((x) => x.group === r.group).map((x) => PETS[x.petId].name) : [];
  const rows: [string, string][] = [[together.length > 1 ? "Gatitas" : "Gatita", together.length > 1 ? together.join(" y ") : PETS[r.petId].name]];
  for (const f of t.fields) {
    if (r.type === "turno" && f.k === "prep") continue;
    let v = r[f.k] as unknown;
    if (v === undefined || v === "" || v === null || (Array.isArray(v) && !v.length)) continue;
    if (f.t === "date" || f.t === "datetime-local") v = fmtDate(String(v));
    else if (Array.isArray(v)) v = v.join(", ");
    else if (f.k === "kg") v = String(v).replace(".", ",") + " kg";
    rows.push([f.l, String(v)]);
  }
  const by = authorName(r.createdBy);
  let due = null;
  if (r.nextDate) {
    const [c, x] = dueStatus(r.nextDate);
    due = (
      <div>
        <span className={`pill p-${c}`}>
          <Icon n="cal" /> {r.type === "consulta" ? "Control" : "Próxima"}: {fmtDate(r.nextDate)} · {c === "ok" ? rel(r.nextDate) : x}
        </span>
      </div>
    );
  }
  return (
    <div className="detail">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span className={`bub t-${r.type}`} style={{ width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", flex: "none" }}>
          <Icon n={r.type} />
        </span>
        <h3 style={{ fontSize: 20 }}>{recTitle(r)}</h3>
      </div>
      {due}
      {r.type === "turno" && r.prep ? (
        <div className="prep">
          <Icon n="info" />
          <span>
            <b>Antes de ir</b>
            {String(r.prep)}
          </span>
        </div>
      ) : null}
      <dl className="kv">
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt>{k}</dt>
            <dd style={{ whiteSpace: "pre-wrap" }}>{v}</dd>
          </div>
        ))}
      </dl>
      {r.files?.length > 0 && (
        <div className="files">
          {r.files.map((f) => (
            <FileChip key={f.path} f={f} />
          ))}
        </div>
      )}
      <span className="by">
        {r.source === "historia"
          ? "Importado de la historia clínica"
          : r.source === "libreta"
            ? "Importado de la libreta sanitaria"
            : `${by ? `Cargado por ${by}` : "Cargado"}${r.createdAt ? ` el ${fmtDate(r.createdAt.slice(0, 10))}` : ""}`}
      </span>
      <div className="actions">
        {confirm ? (
          <>
            <span className="grow err">¿Eliminar este registro?</span>
            <button className="btn white" onClick={() => setConfirm(false)}>
              No
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                try {
                  await deleteRecord(r.id);
                  close();
                  toast("Registro eliminado");
                } catch {
                  toast("No se pudo eliminar");
                }
              }}
            >
              Sí, eliminar
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost grow" onClick={() => setConfirm(true)}>
              Eliminar
            </button>
            {r.type === "turno" && (
              <button
                className="btn white"
                onClick={() =>
                  open({
                    mode: "form",
                    type: "consulta",
                    pet: r.petId,
                    prefill: { title: r.title || "", date: r.date.slice(0, 10), vet: r.place || "" },
                  })
                }
              >
                Cargar cómo fue
              </button>
            )}
            <button className="btn" onClick={() => open({ mode: "form", type: r.type, pet: r.petId, rec: r })}>
              Editar <Go />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Ficha({ pet }: { pet: PetId }) {
  const { pets, savePet } = useStore();
  const { close, toast } = useUI();
  const [vals, setVals] = useState<PetData>(() => ({ ...(pets[pet] || {}) }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await savePet(pet, vals);
          close();
          toast("Ficha actualizada");
        } catch (e2) {
          setBusy(false);
          setErr(errMsg(e2));
        }
      }}
    >
      <div className="fld">
        <span className="lbl">Castrada</span>
        <div className="opts">
          {["Sí", "No"].map((o) => (
            <button type="button" key={o} className="opt" aria-pressed={vals.castrada === o} onClick={() => setVals((p) => ({ ...p, castrada: p.castrada === o ? "" : o }))}>
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="fld">
        <label htmlFor="p_cond">Condiciones en seguimiento</label>
        <input id="p_cond" value={vals.condiciones || ""} placeholder="Separadas por coma" onChange={(e) => setVals((p) => ({ ...p, condiciones: e.target.value }))} />
      </div>
      {err && <div className="err">{err}</div>}
      <div className="actions">
        <button type="button" className="btn white" onClick={close}>
          Cancelar
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Guardando…" : "Guardar ficha"}
        </button>
      </div>
    </form>
  );
}
