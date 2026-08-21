"use client";

import { FormEvent, useEffect, useState } from "react";

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
const ACTAS_PERIOD_DRIVE_URLS: Record<string, string> = {
  "2025-2": "https://drive.google.com/drive/folders/1XYQtnaKowmyQrRyvKoRTHyXp4tm7Fvxq",
};

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
            <span className="operation-info"><strong>Generación de actas</strong><small>Selecciona el período, procesa el consolidado completo y organiza las actas por carrera en Word y PDF.</small><i>Período → Excel → Word / PDF</i></span>
            <span className="operation-action">Abrir automatización <b aria-hidden="true">→</b></span>
          </button>
        </div>
        : <div className="person-empty-state"><span aria-hidden="true">＋</span><strong>No hay automatizaciones asignadas</strong><p>Este espacio está listo para incorporar las automatizaciones correctas de {person.name}.</p></div>}
    </section>
    <footer className="workspace-footer"><span>Automatizaciones del VRA</span><button onClick={onBack}>Cambiar de persona</button></footer>
  </main>;
}

function ActGenerationWorkspace({ person, onBack, onPeople, onLogout }: { person: Person; onBack: () => void; onPeople: () => void; onLogout: () => void }) {
  const [period, setPeriod] = useState("");
  const [consolidated, setConsolidated] = useState<File | null>(null);
  const [processState, setProcessState] = useState<"idle" | "error" | "processing" | "completed">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (processState !== "processing") return;

    let currentProgress = 0;
    const timer = window.setInterval(() => {
      currentProgress = Math.min(currentProgress + 4, 100);
      setProgress(currentProgress);
      if (currentProgress === 100) {
        window.clearInterval(timer);
        setProcessState("completed");
      }
    }, 180);

    return () => window.clearInterval(timer);
  }, [processState]);

  const startProcessing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validPeriod = /^\d{4}-[12]$/.test(period.trim());
    if (!validPeriod || !consolidated) {
      setProcessState("error");
      return;
    }
    setProgress(0);
    setProcessState("processing");
  };

  const resetProcess = () => {
    setPeriod("");
    setConsolidated(null);
    setProgress(0);
    setProcessState("idle");
  };

  const driveTarget = ACTAS_PERIOD_DRIVE_URLS[period.trim()] ?? ACTAS_DRIVE_URL;
  const processingMessage = progress < 20
    ? "Leyendo las hojas del consolidado"
    : progress < 45
      ? "Agrupando carreras, grupos e integrantes"
      : progress < 70
        ? "Preparando las actas en Word"
        : progress < 92
          ? "Preparando las versiones PDF"
          : "Verificando destinos y evitando duplicados";

  return <main className="person-workspace actas-workspace">
    <div className="workspace-top"><Brand /><div className="workspace-actions"><button className="back-home" onClick={onBack}>← Automatizaciones de Ingrid</button><button className="session-button" onClick={onLogout}>Cerrar sesión</button></div></div>

    <section className="actas-hero">
      <div className="actas-hero-copy"><button className="automation-back" onClick={onBack}>← Volver</button><p className="portal-eyebrow">CURSOS DE ACTUALIZACIÓN</p><h1>Generación de actas</h1><p>Indica el período, carga el consolidado actualizado y sigue el procesamiento hasta que los Word y PDF estén listos para revisar en Drive.</p></div>
      <div className="actas-status"><span><i />Flujo por período</span><small>Responsable</small><strong>{person.name}</strong></div>
    </section>

    <section className="actas-route" aria-label="Flujo de la automatización">
      <div><span>1</span><p><strong>Elegir período</strong><small>Ejemplo: 2025-2</small></p></div><b aria-hidden="true">→</b>
      <div><span>2</span><p><strong>Cargar el Excel</strong><small>Consolidado actualizado</small></p></div><b aria-hidden="true">→</b>
      <div><span>3</span><p><strong>Procesar y revisar</strong><small>Word, PDF y acceso a Drive</small></p></div>
    </section>

    <div className="actas-layout">
      <form className="actas-form" onSubmit={startProcessing}>
        <div className="actas-section-heading"><div><span>PASO 1</span><h2>Período académico</h2></div><small>El período determina la carpeta donde se organizarán todas las carreras.</small></div>

        <div className="actas-period-field">
          <label htmlFor="academic-period"><span>PERÍODO</span><input id="academic-period" list="academic-periods" value={period} onChange={(event) => { setPeriod(event.target.value); setProcessState("idle"); }} placeholder="Ej. 2025-2" disabled={processState === "processing"} /></label>
          <datalist id="academic-periods"><option value="2025-2" /></datalist>
          <div><small>RUTA DE SALIDA</small><strong>{period.trim() || "PERÍODO"} / CARRERA / WORDS · PDFS</strong></div>
        </div>

        <div className="actas-section-heading compact"><div><span>PASO 2</span><h2>Consolidado de temas y grupos</h2></div><small>Se procesarán todas las carreras y grupos incluidos en el archivo.</small></div>

        <label className={`actas-file ${consolidated ? "selected" : ""}`} htmlFor="consolidated-file">
          <input key={consolidated ? "selected" : "empty"} id="consolidated-file" type="file" accept=".xlsx,.xls" disabled={processState === "processing"} onChange={(event) => { setConsolidated(event.target.files?.[0] ?? null); setProcessState("idle"); }} />
          <span className="actas-file-icon">XLS</span>
          <span><strong>{consolidated ? consolidated.name : "Seleccionar consolidado Excel"}</strong><small>{consolidated ? `${(consolidated.size / 1024).toFixed(0)} KB · archivo preparado` : "Formatos admitidos: .xlsx y .xls"}</small></span>
          <b>{consolidated ? "Cambiar" : "Examinar"}</b>
        </label>

        <div className="actas-template"><span>DOC</span><div><small>PLANTILLA DE SALIDA</small><strong>Acta de sustentación grupal · modalidad presencial</strong><p>Estructura institucional de 2 páginas. La nota permanece vacía para que la complete el profesor.</p></div><i>Word + PDF</i></div>

        {processState === "error" && <p className="actas-message error"><span>!</span>Escribe el período con el formato 2025-2 y selecciona el archivo Excel.</p>}

        {processState === "processing" && <div className="actas-processing" aria-live="polite">
          <div className="actas-progress-meta"><div><small>PROCESANDO CONSOLIDADO</small><strong>{processingMessage}</strong></div><b>{progress}%</b></div>
          <div className="actas-progress-track" role="progressbar" aria-label="Progreso de generación de actas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
          <p>No cierres esta pantalla mientras se preparan los documentos.</p>
        </div>}

        {processState === "completed" && <div className="actas-completed">
          <span aria-hidden="true">✓</span><div><small>PROCESO FINALIZADO</small><strong>Word y PDF organizados para el período {period.trim()}</strong><p>Los resultados corresponden a las carreras y grupos del archivo <b>{consolidated?.name}</b>. El número de acta se utiliza para evitar duplicados.</p></div>
          <a href={driveTarget} target="_blank" rel="noreferrer">Abrir Drive de {period.trim()} <b aria-hidden="true">↗</b></a>
        </div>}

        <div className="actas-form-actions"><button type="button" onClick={resetProcess} disabled={processState === "processing"}>Limpiar</button><button type="submit" disabled={processState === "processing" || processState === "completed"}>{processState === "processing" ? "Procesando…" : processState === "completed" ? "Proceso finalizado" : "Procesar consolidado"} <span aria-hidden="true">→</span></button></div>
        <p className="actas-pilot-note">La barra muestra el flujo que seguirá la automatización. La creación y carga real de archivos se activará cuando Drive tenga habilitado el permiso institucional de escritura.</p>
      </form>

      <aside className="actas-summary">
        <p className="portal-eyebrow">PROCESAMIENTO AUTOMÁTICO</p><h2>Qué hará con el Excel</h2><p className="actas-summary-lead">El consolidado completo se separará por carrera y grupo dentro del período seleccionado.</p>
        <ul><li><span>01</span><p><strong>Acta y programa</strong><small>Número de acta, facultad, título y título profesional.</small></p></li><li><span>02</span><p><strong>Grupo e integrantes</strong><small>Nombres y todas las variables de la tabla de participantes.</small></p></li><li><span>03</span><p><strong>Sustentación presencial</strong><small>Fecha y hora convertidas al formato formal del documento.</small></p></li><li><span>04</span><p><strong>Jurados</strong><small>Orden, nombres y DNI de cada jurado.</small></p></li></ul>
        {processState === "completed"
          ? <a className="actas-output" href={driveTarget} target="_blank" rel="noreferrer"><span aria-hidden="true">↗</span><div><small>RESULTADOS DISPONIBLES</small><strong>Abrir período {period.trim()} en Drive</strong></div></a>
          : <div className="actas-output muted"><span aria-hidden="true">•••</span><div><small>ACCESO AL DRIVE</small><strong>Disponible al terminar el proceso</strong></div></div>}
      </aside>
    </div>

    <footer className="workspace-footer"><span>Automatizaciones del VRA · Generación de actas</span><button onClick={onPeople}>Cambiar de persona</button></footer>
  </main>;
}
