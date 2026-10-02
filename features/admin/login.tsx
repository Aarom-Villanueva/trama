"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
export function AdminLogin({ configured, denied }: { configured: boolean; denied: boolean }) {
  const [error, setError] = useState(denied ? "Esta cuenta no tiene acceso administrativo." : "");
  const [pending, setPending] = useState(false);
  return <main id="main" className="wrap admin-login"><p className="eyebrow">TRAMA / ADMINISTRACIÓN</p><h1>Tu colección,<br /><em>en tus manos.</em></h1><p>Acceso exclusivo para la cuenta administradora autorizada.</p>{!configured && <p role="status" className="admin-notice">El acceso con Google todavía no está configurado. Consulta la guía local de administración del proyecto.</p>}<Button className="action" disabled={!configured || pending} onClick={async () => {
    setPending(true); setError("");
    try { const result = await authClient.signIn.social({ provider: "google", callbackURL: "/admin", errorCallbackURL: "/admin/login?denied=1" }); if (result.error) { setError("No se pudo iniciar sesión con Google."); setPending(false); } } catch { setError("No se pudo conectar. Inténtalo de nuevo."); setPending(false); }
  }}>{pending ? "Conectando con Google…" : "Continuar con Google"}</Button>{error && <p role="alert" className="admin-error">{error}</p>}</main>;
}
export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState("");
  return <><Button variant="outline" onClick={async () => { try { const result = await authClient.signOut(); if (result.error) setError("No se pudo cerrar la sesión."); else { router.replace("/admin/login"); router.refresh(); } } catch { setError("No se pudo cerrar la sesión."); } }}>Cerrar sesión</Button>{error && <p role="alert">{error}</p>}</>;
}
