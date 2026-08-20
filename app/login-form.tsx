"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    if (response.ok) {
      window.location.reload();
      return;
    }
    setSubmitting(false);
    setError("Usuario o contraseña incorrectos.");
  };

  return <main className="login-page">
    <div className="login-glow login-glow-one" aria-hidden="true" />
    <div className="login-glow login-glow-two" aria-hidden="true" />
    <section className="login-card">
      <div className="login-brand"><span>A</span><div><strong>Vicerrectorado Académico</strong><small>Universidad ESAN</small></div></div>
      <div className="login-heading"><p>ACCESO INSTITUCIONAL</p><h1>Automatizaciones del VRA</h1><span>Ingresa tus credenciales para continuar.</span></div>
      <form onSubmit={login}>
        <label>Usuario<input name="username" required autoFocus autoComplete="username" placeholder="Ingresa tu usuario" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" placeholder="Ingresa tu contraseña" /></label>
        {error && <p className="login-error" role="alert"><span>!</span>{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? "Ingresando…" : "Ingresar"}</button>
      </form>
      <footer><span><i />Sitio privado</span><small>Acceso exclusivo del VRA</small></footer>
    </section>
  </main>;
}
