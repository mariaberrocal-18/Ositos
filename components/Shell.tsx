"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NAV_PETS, PETS } from "@/lib/config";
import { StoreProvider, useStore } from "@/lib/store";
import { UIProvider, useUI } from "./ui";
import { Sheet } from "./Sheet";
import { Go, Icon } from "./Icon";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <UIProvider>
        <Frame>{children}</Frame>
      </UIProvider>
    </StoreProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { status, error, user, signOut } = useStore();
  const { open, toastMsg } = useUI();
  const path = usePathname();
  const items: { href: string; label: string; img?: string; icon?: string }[] = [
    { href: "/", label: "Inicio", icon: "home" },
    ...NAV_PETS.map((id) => ({ href: `/gata/${id}`, label: PETS[id].name, img: PETS[id].face })),
    { href: "/calendario", label: "Calendario", icon: "cal" },
  ];
  const isCur = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  const petNow = NAV_PETS.find((id) => path.startsWith(`/gata/${id}`)) || null;

  let body: ReactNode = children;
  if (status === "loading") body = <div className="center-msg">Cargando…</div>;
  else if (status === "no-access")
    body = (
      <div className="center-msg">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", maxWidth: 360 }}>
          <b style={{ color: "var(--ink)", fontSize: 20 }}>Este email no tiene acceso</b>
          <span>
            Entraste como {user?.email}. Pedile a Beatriz que agregue tu email a la lista de miembros.
          </span>
          <button className="btn white" onClick={() => void signOut()}>
            Salir
          </button>
        </div>
      </div>
    );
  else if (status === "error")
    body = (
      <div className="center-msg">
        <div style={{ maxWidth: 380 }}>
          <b style={{ color: "var(--ink)" }}>No se pudieron cargar los datos.</b>
          <p>{error}</p>
        </div>
      </div>
    );
  const ready = status === "ready";

  return (
    <>
      <div className="app">
        <nav className="side" aria-label="Secciones">
          <div className="brand">
            <span className="mk">
              <Icon n="paw" />
            </span>
            Simona y Amelia
          </div>
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="navbtn" aria-current={isCur(n.href) ? "page" : undefined}>
              {n.img ? (
                <img src={n.img} alt="" />
              ) : (
                <span className="ic">
                  <Icon n={n.icon!} />
                </span>
              )}
              {n.label}
            </Link>
          ))}
          {ready && (
            <button className="btn" onClick={() => open({ mode: "choose", pet: petNow })}>
              Nuevo registro <Go />
            </button>
          )}
          <button className="navbtn" style={{ marginTop: 18 }} onClick={() => void signOut()}>
            <span className="ic">
              <Icon n="out" />
            </span>
            Salir
          </button>
        </nav>
        <main className="main">{body}</main>
      </div>
      <nav className="bnav" aria-label="Secciones">
        <div className="bar">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className={n.img ? "pet" : ""} aria-label={n.label} title={n.label} aria-current={isCur(n.href) ? "page" : undefined}>
              {n.img ? <img src={n.img} alt="" /> : <Icon n={n.icon!} />}
            </Link>
          ))}
          {ready && (
            <button className="plus" aria-label="Nuevo registro" onClick={() => open({ mode: "choose", pet: petNow })}>
              <Icon n="plus" />
            </button>
          )}
        </div>
      </nav>
      {ready && <Sheet />}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </>
  );
}
