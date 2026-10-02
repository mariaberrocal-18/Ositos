"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { Go } from "@/components/Icon";

/**
 * Login by email. Supabase sends a 6-digit code (and a link). Typing the code works inside the
 * installed app on iPhone, where tapping the email link would open Safari instead.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Escribí un email válido.");
    setBusy(true);
    const { error } = await supabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) return setErr(error.message.includes("rate") ? "Pediste muchos códigos seguidos. Esperá un minuto y volvé a intentar." : "No se pudo enviar el email. Probá de nuevo.");
    setStep("code");
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await supabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setErr("El código no es válido o ya venció. Pedí uno nuevo.");
    window.location.href = "/";
  };

  return (
    <main className="login">
      <div className="box">
        <div className="faces">
          <img src="/pets/simona-face.jpg" alt="" />
          <img src="/pets/amelia-face.jpg" alt="" />
        </div>
        <h1>Simona y Amelia</h1>
        {step === "email" ? (
          <form onSubmit={send}>
            <p>Entrá con tu email. Te mandamos un código para ingresar.</p>
            <div className="fld">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            {err && <div className="err">{err}</div>}
            <button className="btn wide" disabled={busy}>
              {busy ? "Enviando…" : "Enviarme el código"} <Go />
            </button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p>
              Te mandamos un código a <b>{email}</b>. Escribilo acá o tocá el link del email.
            </p>
            <div className="fld">
              <label htmlFor="code">Código</label>
              <input id="code" className="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
            </div>
            {err && <div className="err">{err}</div>}
            <button className="btn wide" disabled={busy || code.length < 6}>
              {busy ? "Entrando…" : "Entrar"} <Go />
            </button>
            <button type="button" className="btn ghost" onClick={() => { setStep("email"); setCode(""); setErr(""); }}>
              Usar otro email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
