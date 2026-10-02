"use client";

import { useEffect, useState } from "react";
import { PETS, TYPES, type FileRef, type PetId, type Rec, type TypeKey } from "@/lib/config";
import { DIAS, dueStatus, fmtDate, isActiveMed, MES, parseD, recSub, recTitle, rel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUI } from "./ui";
import { Icon } from "./Icon";

export function UpCard({ r, showPet }: { r: Rec; showPet: boolean }) {
  const { open } = useUI();
  const [st, txt] = dueStatus(r.nextDate!);
  const d = parseD(r.nextDate!);
  const label = r.type === "consulta" ? `Control: ${r.title}` : recTitle(r);
  const p = PETS[r.petId];
  return (
    <button className={`upc ${st}`} onClick={() => open({ mode: "detail", rec: r })}>
      <span className="uph">
        <span className="dt">
          <b className="num">{d.getDate()}</b>
          <span>
            {MES[d.getMonth()]} {d.getFullYear()}
          </span>
        </span>
        {showPet ? (
          <img className="upav" src={p.face} alt={p.name} />
        ) : (
          <span className={`upic t-${r.type}`}>
            <Icon n={r.type} />
          </span>
        )}
      </span>
      <span className="upt">{label}</span>
      <span className="ups2">
        {showPet ? `${p.name} · ` : ""}
        {TYPES[r.type].one}
      </span>
      <span className="upst">{st === "bad" ? `Venció ${rel(r.nextDate!)}` : st === "warn" ? `Vence ${txt}` : `Toca ${rel(r.nextDate!)}`}</span>
    </button>
  );
}

export function UpRow({ r }: { r: Rec }) {
  const { open } = useUI();
  const [st, txt] = dueStatus(r.nextDate!);
  const p = PETS[r.petId];
  const label = r.type === "consulta" ? `Control: ${r.title}` : recTitle(r);
  return (
    <button className="row" onClick={() => open({ mode: "detail", rec: r })}>
      <span className={`bub t-${r.type}`}>
        <Icon n={r.type} />
      </span>
      <span className="tx">
        <div className="t">{label}</div>
        <div className="s">
          <img className="av" src={p.face} alt="" />
          {p.name} · {TYPES[r.type].one} · {fmtDate(r.nextDate)}
        </div>
      </span>
      <span className="r">
        <span className={`pill p-${st}`}>{txt}</span>
      </span>
    </button>
  );
}

export function TlRow({ r, showPet }: { r: Rec; showPet: boolean }) {
  const { open } = useUI();
  const t = TYPES[r.type];
  if (!t) return null;
  const d = parseD(r.date);
  const n = (r.files || []).length;
  return (
    <button className="tlr" onClick={() => open({ mode: "detail", rec: r })}>
      <span className="tld">
        <b className="num">{d.getDate()}</b>
        <span>{MES[d.getMonth()]}</span>
        <small className="num">{d.getFullYear()}</small>
      </span>
      <span className="tlx">
        <span className="tlt">{recTitle(r)}</span>
        <span className="tls">
          <span className={`dot2 t-${r.type}`}>
            <Icon n={r.type} />
          </span>
          {showPet ? `${PETS[r.petId].name} · ` : ""}
          {t.one}
        </span>
      </span>
      <span className="tlm">
        {n ? (
          <>
            <Icon n="clip" />
            <span className="num">{n}</span>
          </>
        ) : null}
        {isActiveMed(r) ? <span className="pill p-ok">Activa</span> : null}
      </span>
    </button>
  );
}

export function RecRow({ r, showPet }: { r: Rec; showPet: boolean }) {
  const { open } = useUI();
  const t = TYPES[r.type];
  if (!t) return null;
  const n = (r.files || []).length;
  const p = PETS[r.petId];
  return (
    <button className="row" onClick={() => open({ mode: "detail", rec: r })}>
      <span className={`bub t-${r.type}`}>
        <Icon n={r.type} />
      </span>
      <span className="tx">
        <div className="t">{recTitle(r)}</div>
        <div className="s">
          {showPet ? (
            <>
              <img className="av" src={p.face} alt="" />
              {p.name} · {t.one} ·{" "}
            </>
          ) : null}
          {recSub(r)}
        </div>
      </span>
      {isActiveMed(r) ? (
        <span className="r">
          <span className="pill p-ok">Activa</span>
        </span>
      ) : null}
      {n ? (
        <span className="r muted">
          <Icon n="clip" />
          <span className="num">{n}</span>
        </span>
      ) : null}
    </button>
  );
}

export function Tile({ t, pet }: { t: TypeKey; pet?: PetId }) {
  const { open } = useUI();
  return (
    <button className="tile" onClick={() => open({ mode: "form", type: t, pet: pet || null })}>
      <span className={`ib t-${t}`}>
        <Icon n={t} />
      </span>
      <span className="l">{TYPES[t].short}</span>
    </button>
  );
}

/** A stored file. Opens through a short-lived signed link, since the bucket is private. */
export function FileChip({ f, onRemove }: { f: FileRef; onRemove?: () => void }) {
  const { fileUrl } = useStore();
  const isImg = (f.type || "").startsWith("image/");
  const [thumb, setThumb] = useState("");
  useEffect(() => {
    if (!isImg) return;
    let alive = true;
    fileUrl(f.path)
      .then((u) => alive && setThumb(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [f.path, isImg, fileUrl]);
  const openIt = async () => {
    const w = window.open("", "_blank");
    try {
      const u = await fileUrl(f.path);
      if (w) w.location.href = u;
      else window.location.href = u;
    } catch {
      w?.close();
    }
  };
  return (
    <span className="file" role="button" tabIndex={0} onClick={openIt} onKeyDown={(e) => e.key === "Enter" && openIt()}>
      {isImg && thumb ? (
        <img src={thumb} alt="" />
      ) : (
        <span className="fi">
          <Icon n="file" />
        </span>
      )}
      <span>{f.name}</span>
      {onRemove ? (
        <button
          type="button"
          className="x"
          aria-label={`Quitar ${f.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Icon n="x" />
        </button>
      ) : null}
    </span>
  );
}

/** A scheduled vet visit: big date, time and place, the cats going, and what to prepare. */
export function TurnoCard({ group, compact = false }: { group: Rec[]; compact?: boolean }) {
  const { open } = useUI();
  const r = group[0];
  const d = parseD(r.date);
  const when = rel(r.date.slice(0, 10));
  return (
    <button className={`turno${compact ? " compact" : ""}`} onClick={() => open({ mode: "detail", rec: r })}>
      <span className="tdate">
        <span className="tdow">{DIAS[d.getDay()]}</span>
        <b className="num">{d.getDate()}</b>
        <span className="tmon">{MES[d.getMonth()]}</span>
      </span>
      <span className="tbody">
        <span className="ttop">
          <span className="pill p-turno">{when === "hoy" ? "Hoy" : when === "mañana" ? "Mañana" : when.charAt(0).toUpperCase() + when.slice(1)}</span>
          <span className="tavs">
            {group.map((g) => (
              <img key={g.id} src={PETS[g.petId].face} alt={PETS[g.petId].name} />
            ))}
          </span>
        </span>
        <span className="ttitle">{r.title || "Visita al vet"}</span>
        <span className="tmeta">
          {[r.time ? `${r.time} h` : "", r.place || ""].filter(Boolean).join(" · ") || group.map((g) => PETS[g.petId].name).join(" y ")}
        </span>
        {r.files?.length ? (
          <span className="tmeta tfiles">
            <Icon n="clip" />
            {r.files.length === 1 ? "Receta u orden adjunta" : `${r.files.length} archivos adjuntos`}
          </span>
        ) : null}
        {r.prep && !compact ? (
          <span className="tprep">
            <Icon n="info" />
            <span>{String(r.prep)}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}
