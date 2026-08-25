import { headers } from "next/headers";
import appsScriptPreview from "../google-apps-script/Index.html?raw";

const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbzQONmvj7lrNt7ZLvWVg5yYXlS6pjEBUHFkJY-5UdJfsWfzuMM-6vN5zvulB0zv2tAoEg/exec";

export const dynamic = "force-dynamic";

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const isLocalPreview = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  if (isLocalPreview) {
    return (
      <main className="local-preview-shell">
        <div className="local-preview-banner">
          <strong>Vista local</strong>
          <span>Los cambios se muestran aquí sin publicarse ni modificar Google Drive.</span>
        </div>
        <iframe className="local-preview-frame" title="Vista local de Automatizaciones del VRA" srcDoc={appsScriptPreview} />
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />
      <section className="login-card">
        <div className="login-brand"><span>A</span><div><strong>Vicerrectorado Académico</strong><small>Universidad ESAN</small></div></div>
        <div className="login-heading"><p>ACCESO CON GOOGLE</p><h1>Automatizaciones del VRA</h1><span>Ingresa con la cuenta de Google que utilizará las carpetas de Drive.</span></div>
        <a className="google-login" href={GOOGLE_APP_URL}><span aria-hidden="true">G</span>Ingresar con Google</a>
        <p className="google-login-note">Acceso restringido a las cuentas autorizadas por el VRA. La cuenta también debe tener permiso de <b>Editor</b> en la carpeta “GENERACIÓN DE ACTAS FINAL”.</p>
        <footer><span><i />Acceso protegido por Google</span><small>No guardamos tu contraseña</small></footer>
      </section>
    </main>
  );
}
