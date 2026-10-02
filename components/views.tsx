"use client";

import Link from "next/link";
import { useState } from "react";
import { HOME_TILES, PET_IDS, PET_TILES, PETS, TAB_ORDER, TYPES, type PetId, type TabKey, type TypeKey } from "@/lib/config";
import { DocsView, docCount } from "./Docs";
import { age, conditions, dueStatus, fmtDate, greeting, isActiveMed, MESES, pad, todayStr, upcoming, upcomingTurnos } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useUI } from "./ui";
import { Go, Icon } from "./Icon";
import { FileChip, RecRow, Tile, TlRow, TurnoCard, UpCard, UpRow } from "./rows";
import { FollowCard, WeightCard } from "./cards";

/* ---------------- Inicio ---------------- */
export function HomeView() {
  const { records, meName, user } = useStore();
  const first = (meName || "").split(" ")[0];
  const up = upcoming(records);
  const overdue = up.filter((r) => dueStatus(r.nextDate!)[0] === "bad");
  const next = up.filter((r) => dueStatus(r.nextDate!)[0] !== "bad");
  const turnos = upcomingTurnos(records);
  const { open } = useUI();
  const recent = records
    .filter((r) => r.type !== "turno")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);
  const meds = records.filter(isActiveMed);
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  return (
    <>
      <header className="top">
        <div className="hello">
          <span className="av">{avatar ? <img src={avatar} alt="" /> : (first || "?").slice(0, 1).toUpperCase()}</span>
          <div>
            <small>{greeting()}</small>
            <b>{first ? `Hola, ${first}` : "Hola"}</b>
          </div>
        </div>
      </header>
      <section className="section">
        <div className="sec-h">
          <h2>Mis gatitas</h2>
        </div>
        <div className="cats">
          {PET_IDS.map((id) => {
            const p = PETS[id];
            return (
              <Link key={id} href={`/gata/${id}`} className="catcard">
                <div className={`ph c-${id}`}>
                  <img src={p.photo} alt={`Ilustración de ${p.name}`} />
                  <span className="heart">
                    <Icon n="heart" />
                  </span>
                </div>
                <div className="info">
                  <h3>{p.name}</h3>
                  <div className="meta">
                    <span>
                      {p.breedShort} • {age(p.born).short}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="section">
        <div className="sec-h">
          <h2>¿Qué querés anotar?</h2>
        </div>
        <div className="tiles">
          {HOME_TILES.map((t) => (
            <Tile key={t} t={t} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="sec-h">
          <h2>Próxima visita al vet</h2>
          <button className="link" onClick={() => open({ mode: "form", type: "turno", pet: null })}>
            + Agendar
          </button>
        </div>
        {turnos.length ? (
          <div className="turnos">
            {turnos.slice(0, 3).map((g, i) => (
              <TurnoCard key={g[0].id} group={g} compact={i > 0} />
            ))}
          </div>
        ) : (
          <button className="turno-empty" onClick={() => open({ mode: "form", type: "turno", pet: null })}>
            <span className="tdate">
              <Icon n="cal" />
            </span>
            <span>
              <b>No hay visitas agendadas</b>
              <small>Agendá la próxima con día, hora, lugar y lo que hay que preparar.</small>
            </span>
          </button>
        )}
      </section>
      {next.length > 0 && (
        <section className="section">
          <div className="sec-h">
            <h2>Próximas fechas</h2>
          </div>
          <div className="ups">
            {next.slice(0, 8).map((r) => (
              <UpCard key={r.id} r={r} showPet />
            ))}
          </div>
        </section>
      )}
      {overdue.length > 0 && (
        <section className="section">
          <div className="sec-h">
            <div>
              <h2>Para ponerse al día</h2>
              <p className="sec-sub">Vacunas y desparasitaciones que ya pasaron su fecha.</p>
            </div>
          </div>
          <div className="ups">
            {overdue.map((r) => (
              <UpCard key={r.id} r={r} showPet />
            ))}
          </div>
        </section>
      )}
      {meds.length > 0 && (
        <section className="section">
          <div className="sec-h">
            <h2>Medicación activa</h2>
          </div>
          <div className="list">
            {meds.map((r) => (
              <RecRow key={r.id} r={r} showPet />
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <div className="sec-h">
          <h2>Últimos registros</h2>
        </div>
        {recent.length ? (
          <div className="tl">
            {recent.map((r) => (
              <TlRow key={r.id} r={r} showPet />
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="bub t-sintoma">
              <Icon n="sintoma" />
            </span>
            <p>Todavía no hay registros. Empezá por lo que tengan a mano: la libreta de vacunas o el último estudio.</p>
          </div>
        )}
      </section>
    </>
  );
}

/* ---------------- Perfil ---------------- */
export function PetView({ id }: { id: PetId }) {
  const { records, pets } = useStore();
  const { open } = useUI();
  const [tab, setTab] = useState<TabKey>("resumen");
  const p = PETS[id];
  const c = conditions(pets[id]);
  const mine = records.filter((r) => r.petId === id);
  const count = (t: TypeKey) => mine.filter((r) => r.type === t).length;
  return (
    <>
      <section className={`phero c-${id}`}>
        <div className="art" style={{ aspectRatio: `1122/${p.cut}` }}>
          <img className="full" src={p.photo} alt={`Ilustración de ${p.name}`} />
          <img className="paws" src={p.paws} alt="" style={{ top: `${(((p.cut - 30) / p.cut) * 100).toFixed(3)}%` }} />
        </div>
        <Link className="circ back" href="/" aria-label="Volver al inicio">
          <Icon n="back" />
        </Link>
        <button className="circ edit" onClick={() => open({ mode: "ficha", pet: id })} aria-label={`Editar ficha de ${p.name}`}>
          <Icon n="edit" />
        </button>
      </section>
      <div className="psheet">
        <div className="pinfo">
          <div className="pcol">
            <div>
              <div className="pname">
                <h1>{p.name}</h1>
                <span className="pill p-neutral">{p.nick}</span>
              </div>
              <div className="sub">
                <Icon n="cal" />
                <span>Nació el {fmtDate(p.born)}</span>
              </div>
            </div>
            <div className="chips">
              <div className="chip c1">
                <b>{p.sex}</b>
                <span>Sexo</span>
              </div>
              <div className="chip c2">
                <b className="num">{age(p.born).short}</b>
                <span>Edad</span>
              </div>
              <div className="chip c3">
                <b>{p.breedShort}</b>
                <span>Raza</span>
              </div>
            </div>
          </div>
          <div className="pcol">
            <div className="about">
              <h3>{c.length ? "En seguimiento" : `Sobre ${p.name}`}</h3>
              <p>
                {c.length
                  ? `${c.join(", ")}. Anotá cada episodio en el Journal para ver la evolución.`
                  : `${p.breed}. Sin condiciones en seguimiento; podés agregarlas desde la ficha.`}
              </p>
            </div>
            <button className="btn wide" onClick={() => open({ mode: "form", type: c.length ? "sintoma" : "consulta", pet: id })}>
              {c.length ? "Journal" : "Agregar visita al vet"} <Go />
            </button>
          </div>
        </div>
      </div>
      <div className="pbody">
        <section className="section">
          <div className="sec-h">
            <h2>Agregar al historial</h2>
          </div>
          <div className="tiles three">
            {PET_TILES.map((t) => (
              <Tile key={t} t={t} pet={id} />
            ))}
          </div>
        </section>
        <div className="tabs" role="tablist">
          {TAB_ORDER.map((t) => (
            <button key={t} className="tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === "resumen" ? "Resumen" : t === "documentos" ? "Documentos" : TYPES[t].label}
              {t === "documentos" ? (
                <span className="n num">{docCount(records, pets[id], id) || ""}</span>
              ) : t !== "resumen" && count(t) ? (
                <span className="n num">{count(t)}</span>
              ) : null}
            </button>
          ))}
        </div>
        {tab === "resumen" ? <Summary id={id} onDocs={() => setTab("documentos")} /> : tab === "documentos" ? <DocsView id={id} /> : <TypeList id={id} type={tab} />}
      </div>
    </>
  );
}

function Summary({ id, onDocs }: { id: PetId; onDocs: () => void }) {
  const { records, pets } = useStore();
  const { open } = useUI();
  const p = PETS[id];
  const d = pets[id] || {};
  const c = conditions(d);
  const mine = records.filter((r) => r.petId === id);
  const up = upcoming(records, id);
  const overdue = up.filter((r) => dueStatus(r.nextDate!)[0] === "bad");
  const next = up.filter((r) => dueStatus(r.nextDate!)[0] !== "bad");
  const turnos = upcomingTurnos(records, id);
  const meds = mine.filter(isActiveMed);
  const weights = mine.filter((r) => r.type === "peso" && r.kg).sort((a, b) => a.date.localeCompare(b.date));
  const recent = mine.filter((r) => r.type !== "turno").slice(0, 5);
  const none = (t: string) => (
    <p className="muted" style={{ margin: 0, fontWeight: 500 }}>
      {t}
    </p>
  );
  return (
    <div className="grid2">
      <div className="card">
        <h3>
          Próxima visita al vet{" "}
          <button className="btn white sm" onClick={() => open({ mode: "form", type: "turno", pet: id })}>
            <Icon n="plus" />
            Agendar
          </button>
        </h3>
        {turnos.length ? (
          <div className="turnos">
            {turnos.slice(0, 2).map((g, i) => (
              <TurnoCard key={g[0].id} group={g} compact={i > 0} />
            ))}
          </div>
        ) : (
          none("No hay visitas agendadas.")
        )}
      </div>
      {c.length > 0 && <FollowCard id={id} />}
      <div className="card">
        <h3>
          Ficha{" "}
          <button className="btn white sm" onClick={() => open({ mode: "ficha", pet: id })}>
            <Icon n="edit" />
            Editar
          </button>
        </h3>
        <dl className="kv">
          <dt>Raza</dt>
          <dd>{p.breed}</dd>
          <dt>Edad</dt>
          <dd>{age(p.born).long}</dd>
          <dt>Castrada</dt>
          <dd>{d.castrada || "Sin dato"}</dd>
          <dt>Condiciones</dt>
          <dd>{c.length ? c.join(", ") : "Ninguna"}</dd>
        </dl>
        <button className="btn white sm" style={{ alignSelf: "flex-start" }} onClick={onDocs}>
          <Icon n="file" />
          Ver documentos{docCount(records, d, id) ? ` (${docCount(records, d, id)})` : ""}
        </button>
      </div>
      <WeightCard id={id} ws={weights} />
      {next.length > 0 || !overdue.length ? (
        <div className="card">
          <h3>Próximas fechas</h3>
          {next.length ? (
            <div className="ups">
              {next.map((r) => (
                <UpCard key={r.id} r={r} showPet={false} />
              ))}
            </div>
          ) : (
            none("Sin fechas próximas cargadas.")
          )}
        </div>
      ) : null}
      {overdue.length > 0 && (
        <div className="card">
          <h3>Para ponerse al día</h3>
          <p className="sec-sub" style={{ marginTop: -6 }}>
            Ya pasaron su fecha.
          </p>
          <div className="ups">
            {overdue.map((r) => (
              <UpCard key={r.id} r={r} showPet={false} />
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <h3>Medicación activa</h3>
        {meds.length ? (
          <div className="list">
            {meds.map((r) => (
              <RecRow key={r.id} r={r} showPet={false} />
            ))}
          </div>
        ) : (
          none("Ninguna por ahora.")
        )}
      </div>
      <div className="card">
        <h3>Últimos registros</h3>
        {recent.length ? (
          <div className="tl">
            {recent.map((r) => (
              <TlRow key={r.id} r={r} showPet={false} />
            ))}
          </div>
        ) : (
          none(`Todavía no hay registros de ${p.name}.`)
        )}
      </div>
    </div>
  );
}

function TypeList({ id, type }: { id: PetId; type: TypeKey }) {
  const { records } = useStore();
  const { open } = useUI();
  const t = TYPES[type];
  const rs = records.filter((r) => r.petId === id && r.type === type);
  return (
    <section className="section">
      <div className="sec-h">
        <h2>{t.label}</h2>
        <button className="btn sm" onClick={() => open({ mode: "form", type, pet: id })}>
          {t.add} <Go />
        </button>
      </div>
      {rs.length ? (
        <div className="list">
          {rs.map((r) => (
            <RecRow key={r.id} r={r} showPet={false} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <span className={`bub t-${type}`}>
            <Icon n={type} />
          </span>
          <p>{t.empty}</p>
        </div>
      )}
    </section>
  );
}

/* ---------------- Calendario ---------------- */
export function CalView() {
  const { records } = useStore();
  const { open } = useUI();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [sel, setSel] = useState<string | null>(null);
  const t = todayStr();
  const ym = `${y}-${pad(m + 1)}`;
  const ups = upcoming(records);
  type Ev = { date: string; kind: "rec" | "due" | "turno"; r: (typeof records)[number] };
  const turnos = upcomingTurnos(records);
  const ev: Ev[] = [
    ...records.filter((r) => r.date).map((r) => ({ date: r.date.slice(0, 10), kind: (r.type === "turno" ? "turno" : "rec") as Ev["kind"], r })),
    ...ups.map((r) => ({ date: r.nextDate!, kind: "due" as const, r })),
  ];
  const byDay: Record<string, Ev[]> = {};
  for (const e of ev) if (e.date.startsWith(ym)) (byDay[e.date] ||= []).push(e);
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const list = sel ? byDay[sel] || [] : Object.keys(byDay).sort().flatMap((k) => byDay[k]);
  const dues = list.filter((e) => e.kind === "due"),
    recs = list.filter((e) => e.kind === "rec");
  const dayTurnos: (typeof records)[] = [];
  // Without a selected day, upcoming visits already show in "Visitas agendadas".
  for (const e of list.filter((x) => x.kind === "turno" && (sel || x.date < t))) {
    const k = e.r.group || e.r.id;
    const g = dayTurnos.find((x) => (x[0].group || x[0].id) === k);
    if (g) g.push(e.r);
    else dayTurnos.push([e.r]);
  }
  const title = sel ? fmtDate(sel) : `${MESES[m][0].toUpperCase() + MESES[m].slice(1)} ${y}`;
  const later = ups.filter((r) => r.nextDate! >= t && !r.nextDate!.startsWith(ym)).slice(0, 5);
  const move = (d: number) => {
    let nm = m + d,
      ny = y;
    if (nm < 0) {
      nm = 11;
      ny--;
    }
    if (nm > 11) {
      nm = 0;
      ny++;
    }
    setM(nm);
    setY(ny);
    setSel(null);
  };
  return (
    <>
      <header className="top">
        <h1 className="title" style={{ fontSize: 32 }}>
          Calendario
        </h1>
        <div className="top-actions">
        <button className="btn sm" onClick={() => open({ mode: "form", type: "turno", pet: null, prefill: { date: sel && sel >= t ? sel : t } })}>
          <Icon n="plus" />
          Agendar
        </button>
        <button
          className="btn white sm"
          onClick={() => {
            setY(now.getFullYear());
            setM(now.getMonth());
            setSel(t);
          }}
        >
          Hoy
        </button>
        </div>
      </header>
      <div className="calwrap">
        <section className="cal">
          <div className="cal-h">
            <h2>
              {MESES[m]} {y}
            </h2>
            <div className="nav">
              <button className="circ" onClick={() => move(-1)} aria-label="Mes anterior">
                <Icon n="back" />
              </button>
              <button className="circ" onClick={() => move(1)} aria-label="Mes siguiente">
                <Icon n="arrow" />
              </button>
            </div>
          </div>
          <div className="cal-g">
            {["L", "M", "M", "J", "V", "S", "D"].map((w, i) => (
              <span key={i} className="wd">
                {w}
              </span>
            ))}
            {[...Array(lead)].map((_, i) => (
              <span key={`o${i}`} className="day out" />
            ))}
            {[...Array(dim)].map((_, i) => {
              const d = i + 1;
              const ds = `${ym}-${pad(d)}`;
              const es = byDay[ds] || [];
              const petsIn = [...new Set(es.map((e) => e.r.petId))];
              const hasDue = es.some((e) => e.kind === "due");
              return (
                <button
                  key={ds}
                  className={`day${ds === t ? " today" : ""}`}
                  aria-pressed={sel === ds}
                  aria-label={`${d} de ${MESES[m]}${es.length ? `, ${es.length} evento${es.length > 1 ? "s" : ""}` : ""}`}
                  onClick={() => setSel(sel === ds ? null : ds)}
                >
                  <span className="num">{d}</span>
                  <span className="dots">
                    {petsIn.map((pid) => (
                      <i key={pid} style={{ background: PETS[pid].dot }} />
                    ))}
                    {hasDue && <i style={{ background: "var(--ink)" }} />}
                    {es.some((e) => e.kind === "turno") && <i className="tdot" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span>
              <i style={{ background: PETS.simona.dot }} />
              Simona
            </span>
            <span>
              <i style={{ background: PETS.amelia.dot }} />
              Amelia
            </span>
            <span>
              <i style={{ background: "var(--ink)" }} />
              Fecha a cumplir
            </span>
            <span>
              <i className="tdot" />
              Visita al vet
            </span>
          </div>
        </section>
        <div className="main" style={{ gap: 22 }}>
          {!sel && turnos.length > 0 && (
            <section className="section">
              <div className="sec-h">
                <h2>Visitas agendadas</h2>
              </div>
              <div className="turnos">
                {turnos.slice(0, 4).map((g) => (
                  <TurnoCard key={g[0].id} group={g} />
                ))}
              </div>
            </section>
          )}
          <section className="section">
            <div className="sec-h">
              <h2>{title}</h2>
              {sel && (
                <button className="link" onClick={() => setSel(null)}>
                  Ver todo el mes
                </button>
              )}
            </div>
            {dayTurnos.length > 0 && (
              <div className="turnos">
                {dayTurnos.map((g) => (
                  <TurnoCard key={g[0].id} group={g} />
                ))}
              </div>
            )}
            {dues.length + recs.length > 0 ? (
              <div className="list">
                {dues.map((e) => (
                  <UpRow key={`d${e.r.id}`} r={e.r} />
                ))}
                {recs.map((e) => (
                  <RecRow key={e.r.id} r={e.r} showPet />
                ))}
              </div>
            ) : dayTurnos.length ? null : (
              <div className="empty">
                <span className="bub t-vacuna">
                  <Icon n="cal" />
                </span>
                <p>{sel ? "Nada anotado este día." : "Nada anotado este mes."}</p>
                {sel && (
                  <button className="btn sm" onClick={() => open({ mode: "choose", pet: null })}>
                    Agregar registro <Go />
                  </button>
                )}
              </div>
            )}
          </section>
          {!sel && later.length > 0 && (
            <section className="section">
              <div className="sec-h">
                <h2>Más adelante</h2>
              </div>
              <div className="ups">
                {later.map((r) => (
                  <UpCard key={r.id} r={r} showPet />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

