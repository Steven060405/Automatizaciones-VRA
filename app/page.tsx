"use client";

import { FormEvent, useEffect, useState } from "react";

type Operation = {
  name: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  connector: string;
};

type Person = {
  name: string;
  initials: string;
  role: string;
  description: string;
  tone: "aisha" | "ingrid" | "kety";
  operations: Operation[];
};

const people: Person[] = [
  {
    name: "Aisha Tizón",
    initials: "AT",
    role: "Gestión de información académica",
    description: "Consolidados, programación y organización de grupos.",
    tone: "aisha",
    operations: [
      { name: "Consolidar temas por grupo", description: "Ordena los temas, integrantes y programas registrados en el consolidado maestro.", inputLabel: "Periodo o nombre del consolidado", inputPlaceholder: "Ej. Agosto 2026", connector: "Excel / Hojas de cálculo" },
      { name: "Validar información de grupos", description: "Detecta datos incompletos, duplicados y diferencias antes de programar.", inputLabel: "Grupo o lote que deseas validar", inputPlaceholder: "Ej. Grupo AM-01", connector: "Excel + Sistema académico" },
      { name: "Preparar programación", description: "Genera una propuesta organizada de fechas y horarios para los grupos validados.", inputLabel: "Periodo de programación", inputPlaceholder: "Ej. Sustentaciones 2026-2", connector: "Excel + Calendario" },
    ],
  },
  {
    name: "Ingrid Zarate",
    initials: "IZ",
    role: "Gestión de actas y sustentaciones",
    description: "Actas, validaciones, expedientes y evidencias finales.",
    tone: "ingrid",
    operations: [
      { name: "Generar acta de sustentación", description: "Completa el acta con la información validada del grupo y prepara el documento final.", inputLabel: "Número de acta o código de grupo", inputPlaceholder: "Ej. 1373-2026-T", connector: "Excel + Word/PDF" },
      { name: "Validar datos del acta", description: "Compara integrantes, jurados, fecha, horario y calificaciones antes de emitir el acta.", inputLabel: "Acta que deseas validar", inputPlaceholder: "Ej. Acta 1373-2026-T", connector: "Excel + Sistema académico" },
      { name: "Archivar acta y evidencias", description: "Reúne el acta final y sus sustentos en un expediente trazable.", inputLabel: "Número de expediente", inputPlaceholder: "Ej. Expediente 1373-2026-T", connector: "Word/PDF + Repositorio" },
    ],
  },
  {
    name: "Profesora Kety Jauregui",
    initials: "KJ",
    role: "Revisión y supervisión académica",
    description: "Revisión, conformidad y seguimiento de los procesos.",
    tone: "kety",
    operations: [
      { name: "Revisar acta para aprobación", description: "Presenta los datos críticos del acta y sus alertas antes de otorgar conformidad.", inputLabel: "Número de acta", inputPlaceholder: "Ej. 1373-2026-T", connector: "Word/PDF + Repositorio" },
      { name: "Revisar observaciones", description: "Consolida incidencias pendientes y registra la decisión tomada en cada caso.", inputLabel: "Grupo, acta o periodo", inputPlaceholder: "Ej. Sustentaciones agosto", connector: "Excel + Correo institucional" },
      { name: "Consultar seguimiento académico", description: "Muestra el avance de grupos, actas y expedientes que requieren supervisión.", inputLabel: "Programa o periodo", inputPlaceholder: "Ej. MBA 2026-2", connector: "Sistema académico" },
    ],
  },
];

export default function Home() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const closeModal = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedOperation(null);
    };
    window.addEventListener("keydown", closeModal);
    return () => window.removeEventListener("keydown", closeModal);
  }, []);

  const selectPerson = (person: Person) => {
    setSelectedPerson(person);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setSelectedPerson(null);
    setSelectedOperation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const executeOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOperation) return;
    const form = new FormData(event.currentTarget);
    const context = String(form.get("context"));
    setToast(`Ejecución iniciada: ${selectedOperation.name} · ${context}`);
    setSelectedOperation(null);
  };

  return <>
    {selectedPerson
      ? <PersonWorkspace person={selectedPerson} onBack={goHome} onRun={setSelectedOperation} />
      : <PeoplePortal onSelect={selectPerson} />}
    {selectedOperation && selectedPerson && <OperationModal person={selectedPerson} operation={selectedOperation} onClose={() => setSelectedOperation(null)} onSubmit={executeOperation} />}
    {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
  </>;
}

function Brand() {
  return <div className="portal-brand"><span className="portal-brand-mark">A</span><div><strong>Vicerrectorado Académico</strong><small>Universidad ESAN</small></div></div>;
}

function Avatar({ person, compact = false }: { person: Person; compact?: boolean }) {
  return <span className={`person-avatar ${person.tone} ${compact ? "compact" : ""}`} aria-hidden="true"><i>{person.initials}</i></span>;
}

function PeoplePortal({ onSelect }: { onSelect: (person: Person) => void }) {
  return <main className="people-portal">
    <div className="portal-glow portal-glow-one" aria-hidden="true" />
    <div className="portal-glow portal-glow-two" aria-hidden="true" />
    <Brand />
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

function PersonWorkspace({ person, onBack, onRun }: { person: Person; onBack: () => void; onRun: (operation: Operation) => void }) {
  return <main className="person-workspace">
    <div className="workspace-top"><Brand /><button className="back-home" onClick={onBack}>← Volver a personas</button></div>
    <section className="person-hero">
      <Avatar person={person} compact />
      <div><p className="portal-eyebrow">ESPACIO PERSONAL</p><h1>Automatizaciones de {person.name}</h1><p>{person.description}</p></div>
    </section>
    <section className="person-operations">
      <div className="operations-heading"><div><p className="portal-eyebrow">AUTOMATIZACIONES DISPONIBLES</p><h2>¿Qué deseas hacer?</h2></div><span><i />{person.operations.length} procesos listos</span></div>
      <div className="person-operation-grid">{person.operations.map((operation, index) => <button className="person-operation" key={operation.name} onClick={() => onRun(operation)}>
        <span className="operation-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="operation-info"><strong>{operation.name}</strong><small>{operation.description}</small><i>{operation.connector}</i></span>
        <span className="operation-action">Abrir automatización <b>→</b></span>
      </button>)}</div>
    </section>
    <footer className="workspace-footer"><span>Automatizaciones del VRA</span><button onClick={onBack}>Cambiar de persona</button></footer>
  </main>;
}

function OperationModal({ person, operation, onClose, onSubmit }: { person: Person; operation: Operation; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="operation-modal" role="dialog" aria-modal="true" aria-labelledby="operation-title">
      <button className="close-modal" onClick={onClose} aria-label="Cerrar">×</button>
      <div className="modal-person"><Avatar person={person} compact /><div><p className="portal-eyebrow">{person.name}</p><h2 id="operation-title">{operation.name}</h2></div></div>
      <p className="modal-description">{operation.description}</p>
      <form onSubmit={onSubmit}>
        <label>{operation.inputLabel}<input name="context" required autoFocus placeholder={operation.inputPlaceholder} /></label>
        <div className="automation-path"><span><b>1</b><strong>Recibir datos</strong></span><i>→</i><span><b>2</b><strong>Validar</strong></span><i>→</i><span><b>3</b><strong>Generar resultado</strong></span></div>
        <div className="connector-note"><span>⌁</span><div><small>Conector previsto</small><strong>{operation.connector}</strong></div></div>
        <p className="pilot-note">Entorno piloto: esta acción simula el inicio del proceso hasta conectar las fuentes institucionales.</p>
        <div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit">Ejecutar automatización</button></div>
      </form>
    </section>
  </div>;
}
