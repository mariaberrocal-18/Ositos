"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { PetId, Rec, TypeKey } from "@/lib/config";

export type SheetState =
  | { mode: "choose"; pet: PetId | null }
  | { mode: "form"; type: TypeKey; pet: PetId | null; rec?: Rec }
  | { mode: "detail"; rec: Rec }
  | { mode: "ficha"; pet: PetId };

type UI = {
  sheet: SheetState | null;
  open: (s: SheetState) => void;
  close: () => void;
  toast: (msg: string) => void;
  toastMsg: string;
};
const Ctx = createContext<UI | null>(null);
export const useUI = () => {
  const u = useContext(Ctx);
  if (!u) throw new Error("useUI fuera de UIProvider");
  return u;
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toastMsg, setToast] = useState("");
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((m: string) => {
    setToast(m);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setToast(""), 2200);
  }, []);
  return (
    <Ctx.Provider value={{ sheet, open: setSheet, close: () => setSheet(null), toast, toastMsg }}>
      {children}
    </Ctx.Provider>
  );
}
