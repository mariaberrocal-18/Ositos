"use client";

import { useRef, useState } from "react";
import { PETS, type PetId, type Rec } from "@/lib/config";
import { conditions, fmtDate, kgf, MES, parseD, todayStr, vomitStats } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUI } from "./ui";
import { Go, Icon } from "./Icon";

export function FollowCard({ id }: { id: PetId }) {
  const { records, pets } = useStore();
  const { open } = useUI();
  const { sym, since, in30 } = vomitStats(records, id);
  const goal = 30;
  const frac = since === null ? 0 : Math.min(since, goal) / goal;
  const R = 90,
    cx = 110,
    cy = 110,
    a0 = Math.PI * 0.8,
    a1 = Math.PI * 2.2,
    L = R * (a1 - a0);
  const pt = (a: number) => `${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}`;
  const arc = `M ${pt(a0)} A ${R} ${R} 0 1 1 ${pt(a1)}`;

  const now = parseD(todayStr());
  const dow = (now.getDay() + 6) % 7;
  const wk0 = new Date(now);
  wk0.setDate(now.getDate() - dow - 7 * 7);
  const weeks = [...Array(8)].map((_, i) => {
    const s = new Date(wk0);
    s.setDate(wk0.getDate() + i * 7);
    return { s, n: 0 };
  });
  for (const r of sym) {
    const i = Math.floor((parseD(r.date).getTime() - wk0.getTime()) / 86400000 / 7);
    if (i >= 0 && i < 8) weeks[i].n++;
  }
  const max = Math.max(3, ...weeks.map((w) => w.n)),
    W = 320,
    H = 110,
    b = 20,
    bw = (W - 8) / 8;
  const cond = conditions(pets[id])[0] || "";

  return (
    <div className="card" style={{ gridRow: "span 2" }}>
      <h3>Seguimiento de {cond.toLowerCase()}</h3>
      <div className="gauge">
        <svg viewBox="0 0 220 190" role="img" aria-label={since === null ? "Sin vómitos registrados" : `${since} días sin vómitos`}>
          <defs>
            <linearGradient id="gg" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#F9D77A" />
              <stop offset=".45" stopColor="#CDBEF4" />
              <stop offset="1" stopColor="#F2A3BE" />
            </linearGradient>
          </defs>
          <path d={arc} fill="none" stroke="var(--sunk)" strokeWidth="16" strokeLinecap="round" />
          <path
            d={arc}
            fill="none"
            stroke="url(#gg)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(L * frac).toFixed(1)} ${L.toFixed(1)}`}
            opacity={frac ? 1 : 0}
          />
        </svg>
        <div className="lbl">
          <b className="num">{since === null ? "–" : since}</b>
          <span>{since === null ? "sin vómitos anotados" : since === 1 ? "día sin vómitos" : "días sin vómitos"}</span>
          <span>meta: {goal} días</span>
        </div>
      </div>
      <div className="glance">
        <div className="gl" style={{ background: "var(--yellow)" }}>
          <span>Últimos 30 días</span>
          <b className="num">{in30}</b>
          <small>episodios</small>
        </div>
        <div className="gl" style={{ background: "var(--lilac)" }}>
          <span>Total anotados</span>
          <b className="num">{sym.length}</b>
          <small>síntomas</small>
        </div>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Episodios por semana, últimas 8 semanas">
        {weeks.map((w, i) => {
          const h = Math.round(((H - b - 16) * w.n) / max),
            x = 4 + i * bw + 6,
            y = H - b - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw - 12} height={Math.max(h, 3)} rx="7" fill={w.n ? "#F2A3BE" : "var(--sunk)"} />
              {w.n ? (
                <text x={x + (bw - 12) / 2} y={y - 5} textAnchor="middle">
                  {w.n}
                </text>
              ) : null}
              {i % 2 === 1 ? (
                <text x={x + (bw - 12) / 2} y={H - 5} textAnchor="middle">
                  {w.s.getDate()} {MES[w.s.getMonth()]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <span className="by">Episodios por semana, últimas 8 semanas</span>
      <button className="btn wide" onClick={() => open({ mode: "form", type: "sintoma", pet: id })}>
        Journal <Go />
      </button>
    </div>
  );
}

export function WeightCard({ id, ws }: { id: PetId; ws: Rec[] }) {
  const { open } = useUI();
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const last = ws[ws.length - 1];
  const col = PETS[id].line;

  let chart = null;
  if (ws.length >= 2) {
    const W = 320,
      H = 170,
      L = 36,
      R = 14,
      T = 14,
      B = 30;
    const ts = ws.map((r) => parseD(r.date).getTime()),
      t0 = ts[0],
      t1 = ts[ts.length - 1];
    const vals = ws.map((r) => Number(r.kg));
    const lo = Math.floor((Math.min(...vals) - 0.25) * 2) / 2,
      hi = Math.ceil((Math.max(...vals) + 0.25) * 2) / 2;
    const X = (tm: number) => L + (W - L - R) * (t1 === t0 ? 0.5 : (tm - t0) / (t1 - t0));
    const Y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const pts = ws.map((r, i) => ({ x: X(ts[i]), y: Y(Number(r.kg)), kg: Number(r.kg), date: r.date }));
    const step = hi - lo > 2 ? 1 : 0.5;
    const grid: number[] = [];
    for (let v = lo; v <= hi + 1e-9; v += step) grid.push(v);
    const labs: typeof pts = [];
    for (let i = pts.length - 1; i >= 0; i--) if (!labs.length || labs[labs.length - 1].x - pts[i].x >= 50) labs.push(pts[i]);
    const lab = (p: (typeof pts)[number]) => {
      const d = parseD(p.date);
      return `${MES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    };
    const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = `${path} L${pts[pts.length - 1].x.toFixed(1)} ${H - B} L${pts[0].x.toFixed(1)} ${H - B} Z`;

    const pick = (clientX: number) => {
      const rc = svgRef.current?.getBoundingClientRect();
      if (!rc) return;
      const sx = ((clientX - rc.left) * W) / rc.width;
      let k = 0;
      pts.forEach((p, i) => {
        if (Math.abs(p.x - sx) < Math.abs(pts[k].x - sx)) k = i;
      });
      setHover(k);
    };
    const hp = hover !== null ? pts[hover] : null;
    const prev = hover ? pts[hover - 1] : null;
    const dl = hp && prev ? hp.kg - prev.kg : null;

    chart = (
      <div className="wbox" onPointerMove={(e) => pick(e.clientX)} onPointerDown={(e) => pick(e.clientX)} onPointerLeave={() => setHover(null)}>
        <svg ref={svgRef} className="chart wchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolución del peso: ${ws.map((r) => `${fmtDate(r.date)} ${kgf(Number(r.kg))} kg`).join(", ")}`}>
          <defs>
            <linearGradient id={`wg-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={col} stopOpacity=".28" />
              <stop offset="1" stopColor={col} stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeDasharray={v === lo ? "0" : "3 4"} />
              <text x={L - 8} y={Y(v) + 4} textAnchor="end">
                {kgf(v)}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#wg-${id})`} />
          <path d={path} fill="none" stroke={col} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? col : "var(--surface)"} stroke={col} strokeWidth="2" />
          ))}
          {labs.map((p) => (
            <text key={p.date} x={p.x} y={H - 8} textAnchor={p.x > W - R - 20 ? "end" : p.x < L + 20 ? "start" : "middle"}>
              {lab(p)}
            </text>
          ))}
          {hp && (
            <>
              <line x1={hp.x} x2={hp.x} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" opacity=".35" />
              <circle r="6.5" cx={hp.x} cy={hp.y} fill={col} stroke="var(--surface)" strokeWidth="3" />
            </>
          )}
        </svg>
        {hp && (
          <div
            className="wtip"
            style={{
              left: `clamp(0px, calc(${(hp.x / W) * 100}% - 55px), calc(100% - 110px))`,
              top: `max(0px, calc(${(hp.y / H) * 100}% - 82px))`,
            }}
          >
            <b className="num">{kgf(hp.kg)} kg</b>
            <span>{fmtDate(hp.date)}</span>
            {dl !== null ? (
              <em className={dl > 0 ? "up" : dl < 0 ? "down" : ""}>
                {dl > 0 ? "+" : dl < 0 ? "−" : "±"}
                {kgf(Math.abs(dl))} kg
              </em>
            ) : (
              <em>Primer registro</em>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h3>
        Peso{" "}
        <button className="btn white sm" onClick={() => open({ mode: "form", type: "peso", pet: id })}>
          <Icon n="plus" />
          Registrar
        </button>
      </h3>
      {last ? (
        <>
          <div className="glance" style={{ gridTemplateColumns: "1fr" }}>
            <div className="gl" style={{ background: PETS[id].bg }}>
              <span>Último peso · {fmtDate(last.date)}</span>
              <b className="num">{kgf(Number(last.kg))} kg</b>
            </div>
          </div>
          {chart}
        </>
      ) : (
        <p className="muted" style={{ margin: 0, fontWeight: 500 }}>
          Sin pesos registrados.
        </p>
      )}
    </div>
  );
}
