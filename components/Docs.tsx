"use client";

import { useEffect, useRef, useState } from "react";
import { PETS, TYPES, type FileRef, type PetData, type PetId, type Rec } from "@/lib/config";
import { fmtDate, recTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUI } from "./ui";
import { Icon } from "./Icon";

type Doc = { f: FileRef; date?: string; from?: Rec };

/** Every file of one cat: general documents (ficha) plus files attached to any of her records. */
function collect(records: Rec[], pd: PetData | undefined, id: PetId): Doc[] {
  const seen = new Set<string>();
  const out: Doc[] = [];
  for (const f of pd?.docs || []) {
    if (seen.has(f.path)) continue;
    seen.add(f.path);
    out.push({ f, date: f.addedAt });
  }
  for (const r of records) {
    if (r.petId !== id) continue;
    for (const f of r.files || []) {
      if (seen.has(f.path)) continue;
      seen.add(f.path);
      out.push({ f, date: r.date.slice(0, 10), from: r });
    }
  }
  return out;
}
export const docCount = (records: Rec[], pd: PetData | undefined, id: PetId) => collect(records, pd, id).length;

function Thumb({ f }: { f: FileRef }) {
  const { fileUrl } = useStore();
  const isImg = (f.type || "").startsWith("image/");
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!isImg) return;
    let alive = true;
    fileUrl(f.path)
      .then((u) => alive && setSrc(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [f.path, isImg, fileUrl]);
  if (isImg && src) return <img className="dthumb" src={src} alt="" />;
  return (
    <span className={`dthumb ${isImg ? "img" : "pdf"}`}>
      <Icon n="file" />
      <small>{isImg ? "Foto" : "PDF"}</small>
    </span>
  );
}

export function DocsView({ id }: { id: PetId }) {
  const { records, pets, uploadFile, savePet, fileUrl } = useStore();
  const { open, toast } = useUI();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pd = pets[id];
  const docs = collect(records, pd, id);
  const general = docs.filter((d) => !d.from);
  const fromRecs = docs.filter((d) => d.from).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const openFile = async (f: FileRef) => {
    const w = window.open("", "_blank");
    try {
      const u = await fileUrl(f.path);
      if (w) w.location.href = u;
      else window.location.href = u;
    } catch {
      w?.close();
      toast("No se pudo abrir el archivo");
    }
  };

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setErr("");
    const added: FileRef[] = [];
    for (const file of Array.from(list)) {
      try {
        const ref = await uploadFile(file, id);
        added.push({ ...ref, name: file.name.replace(/\.[^.]+$/, ""), addedAt: new Date().toISOString().slice(0, 10) });
      } catch {
        setErr(`No se pudo subir ${file.name}.`);
      }
    }
    if (added.length) {
      try {
        await savePet(id, { ...(pd || {}), docs: [...(pd?.docs || []), ...added] });
        toast(added.length > 1 ? `${added.length} documentos subidos` : "Documento subido");
      } catch {
        setErr("Se subió el archivo pero no se pudo guardar en la lista. Probá de nuevo.");
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const remove = async (path: string) => {
    try {
      await savePet(id, { ...(pd || {}), docs: (pd?.docs || []).filter((f) => f.path !== path) });
      setConfirm(null);
      toast("Documento quitado");
    } catch {
      toast("No se pudo quitar");
    }
  };

  const row = (d: Doc, removable: boolean) => (
    <div className="drow" key={d.f.path}>
      <button className="dmain" onClick={() => openFile(d.f)}>
        <Thumb f={d.f} />
        <span className="dtx">
          <span className="dname">{d.f.name}</span>
          <span className="dsub">
            {d.from ? `${TYPES[d.from.type].one} · ${recTitle(d.from)}` : "Documento"}
            {d.date ? ` · ${fmtDate(d.date)}` : ""}
          </span>
        </span>
      </button>
      {d.from ? (
        <button className="dside" aria-label="Ver registro" onClick={() => open({ mode: "detail", rec: d.from! })}>
          <Icon n="arrow" />
        </button>
      ) : removable ? (
        confirm === d.f.path ? (
          <span className="dconfirm">
            <button className="btn ghost sm" onClick={() => setConfirm(null)}>
              No
            </button>
            <button className="btn danger sm" onClick={() => remove(d.f.path)}>
              Quitar
            </button>
          </span>
        ) : (
          <button className="dside" aria-label={`Quitar ${d.f.name}`} onClick={() => setConfirm(d.f.path)}>
            <Icon n="x" />
          </button>
        )
      ) : null}
    </div>
  );

  return (
    <section className="section">
      <div className="sec-h">
        <div>
          <h2>Documentos</h2>
          <p className="sec-sub">Historia clínica, libretas, estudios y todo lo de {PETS[id].name}.</p>
        </div>
      </div>
      <label className="addfile" htmlFor={`doc-${id}`} style={{ background: "var(--surface)" }}>
        <Icon n="clip" />
        {busy ? "Subiendo…" : "Subir documento o foto"}
      </label>
      <input ref={input} id={`doc-${id}`} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => void onUpload(e.target.files)} />
      {err && <div className="err">{err}</div>}

      {general.length > 0 && (
        <>
          <h3 className="dgroup">Generales</h3>
          <div className="dlist">{general.map((d) => row(d, true))}</div>
        </>
      )}
      {fromRecs.length > 0 && (
        <>
          <h3 className="dgroup">Adjuntos a sus registros</h3>
          <div className="dlist">{fromRecs.map((d) => row(d, false))}</div>
        </>
      )}
      {!docs.length && (
        <div className="empty">
          <span className="bub t-estudio">
            <Icon n="file" />
          </span>
          <p>Subí la historia clínica, fotos de la libreta de vacunas o cualquier papel del vet.</p>
        </div>
      )}
    </section>
  );
}
