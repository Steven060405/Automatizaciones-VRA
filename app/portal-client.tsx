"use client";

import { FormEvent, useState } from "react";

type Person = {
  name: string;
  initials: string;
  role: string;
  description: string;
  tone: "aisha" | "ingrid" | "kety";
};

const people: Person[] = [
  { name: "Aisha Tizón", initials: "AT", role: "Multitareas", description: "Consolidados, programación y organización de grupos.", tone: "aisha" },
  { name: "Ingrid Zarate", initials: "IZ", role: "Cursos de actualización", description: "Actas, validaciones, expedientes y evidencias finales.", tone: "ingrid" },
  { name: "Profesora Kety Jauregui", initials: "KJ", role: "Vicerrectora Académica", description: "Revisión, conformidad y seguimiento de los procesos.", tone: "kety" },
];

const ACTAS_DRIVE_URL = "https://drive.google.com/drive/folders/1LFwml0T6jwio2R0HVILBQ-GxSl1R-VqB?usp=sharing";

export default function PortalClient() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [activeAutomation, setActiveAutomation] = useState<"actas" | null>(null);

  const selectPerson = (person: Person) => {
    setSelectedPerson(person);
    setActiveAutomation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setSelectedPerson(null);
    setActiveAutomation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.reload();
  };

  return selectedPerson
    ? <PersonWorkspace person={selectedPerson} activeAutomation={activeAutomation} onOpenAutomation={() => setActiveAutomation("actas")} onCloseAutomation={() => setActiveAutomation(null)} onBack={goHome} onLogout={logout} />
    : <PeoplePortal onSelect={selectPerson} onLogout={logout} />;
}

function Brand() {
  return <div className="portal-brand"><span className="portal-brand-mark">A</span><div><strong>Vicerrectorado Académico</strong><small>Universidad ESAN</small></div></div>;
}

function Avatar({ person, compact = false }: { person: Person; compact?: boolean }) {
  return <span className={`person-avatar ${person.tone} ${compact ? "compact" : ""}`} aria-hidden="true"><i>{person.initials}</i></span>;
}

function PeoplePortal({ onSelect, onLogout }: { onSelect: (person: Person) => void; onLogout: () => void }) {
  return <main className="people-portal">
    <div className="portal-glow portal-glow-one" aria-hidden="true" />
    <div className="portal-glow portal-glow-two" aria-hidden="true" />
    <div className="portal-top"><Brand /><button className="session-button" onClick={onLogout}>Cerrar sesión</button></div>
    <section className="portal-content">
      <p className="portal-eyebrow">PLATAFORMA INSTITUCIONAL</p>
      <h1>Automatizaciones del VRA</h1>
      <p className="portal-lead">Selecciona a la persona responsable para ingresar a su espacio de automatizaciones.</p>
      <div className="people-grid">{people.map((person) => <button className="person-card" key={person.name} onClick={() => onSelect(person)} aria-label={`Ingresar a las automatizaciones de ${person.name}`}>
        <Avatar person={person} />
        <span className="person-copy"><strong>{person.name}</strong><small>{person.role}</small><p>{person.description}</p></span>
        <span className="person-enter">Ingresar <b aria-hidden="true">→</b></span>
      </button>)}</div>
    </section>
    <footer className="portal-footer"><span><i />Servicios disponibles</span><small>Automatizaciones para el Vicerrectorado Académico</small></footer>
  </main>;
}

function PersonWorkspace({ person, activeAutomation, onOpenAutomation, onCloseAutomation, onBack, onLogout }: { person: Person; activeAutomation: "actas" | null; onOpenAutomation: () => void; onCloseAutomation: () => void; onBack: () => void; onLogout: () => void }) {
  if (activeAutomation === "actas") {
    return <ActGenerationWorkspace person={person} onBack={onCloseAutomation} onPeople={onBack} onLogout={onLogout} />;
  }

  const hasActGeneration = person.tone === "ingrid";

  return <main className="person-workspace">
    <div className="workspace-top"><Brand /><div className="workspace-actions"><button className="back-home" onClick={onBack}>← Volver a personas</button><button className="session-button" onClick={onLogout}>Cerrar sesión</button></div></div>
    <section className="person-hero">
      <Avatar person={person} compact />
      <div><p className="portal-eyebrow">ESPACIO PERSONAL</p><h1>Automatizaciones de {person.name}</h1><p>{person.description}</p></div>
    </section>
    <section className="person-operations">
      <div className="operations-heading"><div><p className="portal-eyebrow">ESPACIO DE TRABAJO</p><h2>Automatizaciones</h2></div>{hasActGeneration && <span><i />1 automatización disponible</span>}</div>
      {hasActGeneration
        ? <div className="person-operation-grid">
          <button className="person-operation" onClick={onOpenAutomation}>
            <span className="operation-index">ACT</span>
            <span className="operation-info"><strong>Generación de actas</strong><small>Reúne la información del consolidado por grupo y prepara el acta institucional con integrantes, jurados, fecha y horario.</small><i>Excel en Drive → Word / PDF</i></span>
            <span className="operation-action">Abrir automatización <b aria-hidden="true">→</b></span>
          </button>
        </div>
        : <div className="person-empty-state"><span aria-hidden="true">＋</span><strong>No hay automatizaciones asignadas</strong><p>Este espacio está listo para incorporar las automatizaciones correctas de {person.name}.</p></div>}
    </section>
    <footer className="workspace-footer"><span>Automatizaciones del VRA</span><button onClick={onBack}>Cambiar de persona</button></footer>
  </main>;
}

function ActGenerationWorkspace({ person, onBack, onPeople, onLogout }: { person: Person; onBack: () => void; onPeople: () => void; onLogout: () => void }) {
  const [career, setCareer] = useState("ADM Y MKT");
  const [group, setGroup] = useState("");
  const [validation, setValidation] = useState<"idle" | "error" | "ready">("idle");

  const validateConfiguration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidation(group.trim() ? "ready" : "error");
  };

  return <main className="person-workspace actas-workspace">
    <div className="workspace-top"><Brand /><div className="workspace-actions"><button className="back-home" onClick={onBack}>← Automatizaciones de Ingrid</button><button className="session-button" onClick={onLogout}>Cerrar sesión</button></div></div>

    <section className="actas-hero">
      <div className="actas-hero-copy"><button className="automation-back" onClick={onBack}>← Volver</button><p className="portal-eyebrow">CURSOS DE ACTUALIZACIÓN</p><h1>Generación de actas</h1><p>Usa el consolidado maestro de Drive, agrupa la información por carrera y grupo, y prepara la salida institucional en Word y PDF.</p></div>
      <div className="actas-status"><span><i />Carpeta configurada</span><small>Responsable</small><strong>{person.name}</strong></div>
    </section>

    <section className="actas-route" aria-label="Flujo de la automatización">
      <div><span>1</span><p><strong>Leer el consolidado</strong><small>Archivo maestro en Drive</small></p></div><b aria-hidden="true">→</b>
      <div><span>2</span><p><strong>Validar el grupo</strong><small>Integrantes, jurados y horario</small></p></div><b aria-hidden="true">→</b>
      <div><span>3</span><p><strong>Guardar y enlazar</strong><small>Word y PDF sin duplicados</small></p></div>
    </section>

    <div className="actas-layout">
      <form className="actas-form" onSubmit={validateConfiguration}>
        <div className="actas-section-heading"><div><span>PASO 1</span><h2>Fuente única de información</h2></div><small>La plataforma apunta al Drive institucional y no conserva copias del archivo.</small></div>

        <div className="actas-drive-source">
          <span className="actas-drive-icon">DRV</span>
          <span><small>CARPETA MAESTRA</small><strong>GENERACIÓN DE ACTAS FINAL</strong><p>Contiene las carpetas de las cinco carreras, cada una con sus salidas WORDS y PDFS.</p></span>
          <a href={ACTAS_DRIVE_URL} target="_blank" rel="noreferrer">Abrir Drive <b aria-hidden="true">↗</b></a>
        </div>

        <div className="actas-section-heading compact"><div><span>PASO 2</span><h2>Grupo a procesar</h2></div></div>
        <div className="actas-fields">
          <label><span>Carrera / hoja</span><select value={career} onChange={(event) => { setCareer(event.target.value); setValidation("idle"); }}><option>DERECHO</option><option>ADM Y FIN-DPA</option><option>ADM Y MKT</option><option>ECO Y NEG</option><option>ING</option></select></label>
          <label><span>Número de grupo</span><input value={group} onChange={(event) => { setGroup(event.target.value); setValidation("idle"); }} placeholder="Ej. GRUPO 1" /></label>
          <label><span>Modalidad fija</span><input value="Presencial" readOnly aria-readonly="true" /></label>
        </div>

        <div className="actas-template"><span>DOC</span><div><small>PLANTILLA DE SALIDA</small><strong>Acta de sustentación grupal</strong><p>Estructura institucional de 2 páginas: datos del grupo, título profesional, jurados y observaciones. La nota queda vacía para los profesores.</p></div><i>Word + PDF</i></div>

        {validation === "error" && <p className="actas-message error"><span>!</span>Indica el número de grupo para continuar.</p>}
        {validation === "ready" && <div className="actas-message ready"><span>✓</span><div><strong>Destino identificado sin duplicados</strong><p>Se procesará {group.trim().toUpperCase()} de {career} en modalidad presencial. El Word se actualizará en <b>{career}/WORDS</b> y el PDF en <b>{career}/PDFS</b>, usando el número de acta como identificador único.</p><a href={ACTAS_DRIVE_URL} target="_blank" rel="noreferrer">Ver carpeta en Drive ↗</a></div></div>}

        <div className="actas-form-actions"><button type="button" onClick={() => { setGroup(""); setValidation("idle"); }}>Limpiar</button><button type="submit">Validar destino <span aria-hidden="true">→</span></button></div>
      </form>

      <aside className="actas-summary">
        <p className="portal-eyebrow">DATOS IDENTIFICADOS</p><h2>Contenido del acta</h2><p className="actas-summary-lead">La automatización toma únicamente los campos acordados del consolidado y deja la calificación para el profesor.</p>
        <ul><li><span>01</span><p><strong>Acta y programa</strong><small>Número de acta, facultad, título y título profesional.</small></p></li><li><span>02</span><p><strong>Grupo e integrantes</strong><small>Nombres y todas las variables de la tabla de participantes.</small></p></li><li><span>03</span><p><strong>Sustentación presencial</strong><small>Fecha y hora convertidas al formato formal del documento.</small></p></li><li><span>04</span><p><strong>Jurados</strong><small>Orden, nombres y DNI de cada jurado.</small></p></li></ul>
        <a className="actas-output" href={ACTAS_DRIVE_URL} target="_blank" rel="noreferrer"><span aria-hidden="true">↗</span><div><small>FUENTE Y RESULTADOS</small><strong>Abrir carpeta maestra en Drive</strong></div></a>
      </aside>
    </div>

    <footer className="workspace-footer"><span>Automatizaciones del VRA · Generación de actas</span><button onClick={onPeople}>Cambiar de persona</button></footer>
  </main>;
}
