const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbzQONmvj7lrNt7ZLvWVg5yYXlS6pjEBUHFkJY-5UdJfsWfzuMM-6vN5zvulB0zv2tAoEg/exec";

export const dynamic = "force-dynamic";

export default function Home() {
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
