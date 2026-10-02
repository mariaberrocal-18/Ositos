"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase/client";
import type { FileRef, PetData, PetId, Rec, TypeKey } from "./config";

type Member = { email: string; name: string | null };
type Row = {
  id: string;
  pet_id: PetId;
  type: TypeKey;
  date: string;
  data: Record<string, unknown> | null;
  files: FileRef[] | null;
  created_at: string;
  created_by_email: string | null;
  source: string | null;
};

const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";
const FIXED = new Set(["id", "petId", "type", "date", "files", "createdAt", "createdBy", "source"]);
const toRec = (r: Row): Rec => ({
  ...(r.data || {}),
  id: r.id,
  petId: r.pet_id,
  type: r.type,
  date: r.date,
  files: r.files || [],
  createdAt: r.created_at,
  createdBy: r.created_by_email,
  source: r.source,
});

export type Status = "loading" | "ready" | "no-access" | "error";

type Store = {
  status: Status;
  error: string;
  user: User | null;
  meName: string;
  records: Rec[];
  pets: Partial<Record<PetId, PetData>>;
  authorName: (email?: string | null) => string;
  saveRecord: (rec: Partial<Rec> & { petId: PetId; type: TypeKey; date: string }, id?: string) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  savePet: (id: PetId, vals: PetData) => Promise<void>;
  uploadFile: (file: File, petId: PetId) => Promise<FileRef>;
  fileUrl: (path: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fuera de StoreProvider");
  return s;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [pets, setPets] = useState<Partial<Record<PetId, PetData>>>({});

  const loadRecords = useCallback(async () => {
    const { data, error } = await supabase().from("records").select("*").order("date", { ascending: false });
    if (error) throw error;
    setRecords((data as Row[]).map(toRec));
  }, []);
  const loadPets = useCallback(async () => {
    const { data, error } = await supabase().from("pets").select("*");
    if (error) throw error;
    const m: Partial<Record<PetId, PetData>> = {};
    for (const p of data as (PetData & { id: PetId })[]) m[p.id] = p;
    setPets(m);
  }, []);

  useEffect(() => {
    if (DEMO) {
      // Local preview without Supabase: reads /demo.json (not committed).
      fetch("/demo.json")
        .then((r) => r.json())
        .then((d: { records: Rec[]; pets: Partial<Record<PetId, PetData>> }) => {
          setUser({ email: "demo@local", user_metadata: {} } as unknown as User);
          setMembers([{ email: "demo@local", name: "Beatriz" }]);
          setRecords(d.records);
          setPets(d.pets);
          setStatus("ready");
        })
        .catch((e) => {
          setError(String(e));
          setStatus("error");
        });
      return;
    }
    let alive = true;
    const sb = supabase();
    (async () => {
      try {
        const { data: u } = await sb.auth.getUser();
        if (!alive) return;
        setUser(u.user);
        const { data: mem, error: me } = await sb.from("members").select("email,name");
        if (me) throw me;
        const email = (u.user?.email || "").toLowerCase();
        if (!mem || !mem.some((m) => m.email.toLowerCase() === email)) {
          setStatus("no-access");
          return;
        }
        setMembers(mem);
        await Promise.all([loadRecords(), loadPets()]);
        if (alive) setStatus("ready");
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String((e as { message?: string })?.message || e));
        setStatus("error");
      }
    })();
    const ch = sb
      .channel("cambios")
      .on("postgres_changes", { event: "*", schema: "public", table: "records" }, () => void loadRecords().catch(() => {}))
      .on("postgres_changes", { event: "*", schema: "public", table: "pets" }, () => void loadPets().catch(() => {}))
      .subscribe();
    const onFocus = () => {
      void loadRecords().catch(() => {});
      void loadPets().catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      void sb.removeChannel(ch);
    };
  }, [loadRecords, loadPets]);

  const myEmail = (user?.email || "").toLowerCase();
  const meName = members.find((m) => m.email.toLowerCase() === myEmail)?.name || (user?.email || "").split("@")[0];

  const authorName = useCallback(
    (email?: string | null) => {
      if (!email) return "";
      if (email.toLowerCase() === myEmail) return "vos";
      return members.find((m) => m.email.toLowerCase() === email.toLowerCase())?.name || email.split("@")[0];
    },
    [members, myEmail],
  );

  const saveRecord: Store["saveRecord"] = useCallback(
    async (rec, id) => {
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rec)) if (!FIXED.has(k)) data[k] = v;
      const row = { pet_id: rec.petId, type: rec.type, date: rec.date, data, files: rec.files || [] };
      if (DEMO) {
        const full = { ...data, petId: rec.petId, type: rec.type, date: rec.date, files: rec.files || [] } as Rec;
        setRecords((rs) =>
          id ? rs.map((r) => (r.id === id ? { ...r, ...full } : r)) : [{ ...full, id: crypto.randomUUID(), createdAt: new Date().toISOString(), createdBy: user?.email }, ...rs],
        );
        return;
      }
      const sb = supabase();
      const { error } = id
        ? await sb.from("records").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id)
        : await sb.from("records").insert({ ...row, id: crypto.randomUUID(), created_by_email: user?.email || null });
      if (error) throw error;
      await loadRecords();
    },
    [user, loadRecords],
  );
  const deleteRecord = useCallback(
    async (id: string) => {
      if (DEMO) return setRecords((rs) => rs.filter((r) => r.id !== id));
      const { error } = await supabase().from("records").delete().eq("id", id);
      if (error) throw error;
      await loadRecords();
    },
    [loadRecords],
  );
  const savePet = useCallback(
    async (id: PetId, vals: PetData) => {
      const { error } = await supabase()
        .from("pets")
        .upsert({ id, castrada: vals.castrada || null, condiciones: vals.condiciones || null, docs: vals.docs || [], updated_at: new Date().toISOString() });
      if (error) throw error;
      await loadPets();
    },
    [loadPets],
  );
  const uploadFile = useCallback(async (file: File, petId: PetId): Promise<FileRef> => {
    const safe = file.name.normalize("NFD").replace(/[^\w.\-]+/g, "_");
    const path = `${petId}/${Date.now()}-${safe}`;
    const type = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
    const { error } = await supabase().storage.from("docs").upload(path, file, { contentType: type });
    if (error) throw error;
    return { path, name: file.name, type };
  }, []);
  const fileUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase().storage.from("docs").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  }, []);
  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
    window.location.href = "/login";
  }, []);

  const value = useMemo<Store>(
    () => ({ status, error, user, meName, records, pets, authorName, saveRecord, deleteRecord, savePet, uploadFile, fileUrl, signOut }),
    [status, error, user, meName, records, pets, authorName, saveRecord, deleteRecord, savePet, uploadFile, fileUrl, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
