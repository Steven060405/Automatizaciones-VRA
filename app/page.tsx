"use client";

import { useState } from "react";

type Person = {
  name: string;
  initials: string;
  role: string;
  description: string;
  tone: "aisha" | "ingrid" | "kety";
};

const people: Person[] = [
  {
    name: "Aisha Tizón",
    initials: "AT",
    role: "Gestión de información académica",
    description: "Consolidados, programación y organización de grupos.",
    tone: "aisha",
  },
  {
    name: "Ingrid Zarate",
    initials: "IZ",
    role: "Gestión de actas y sustentaciones",
    description: "Actas, validaciones, expedientes y evidencias finales.",
    tone: "ingrid",
  },
  {
    name: "Profesora Kety Jauregui",
    initials: "KJ",
    role: "Revisión y supervisión académica",
    description: "Revisión, conformidad y seguimiento de los procesos.",
    tone: "kety",
  },
];

export default function Home() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const selectPerson = (person: Person) => {
    setSelectedPerson(person);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setSelectedPerson(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return selectedPerson
    ? <PersonWorkspace person={selectedPerson} onBack={goHome} />
    : <PeoplePortal onSelect={selectPerson} />;
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

function PersonWorkspace({ person, onBack }: { person: Person; onBack: () => void }) {
  return <main className="person-workspace">
    <div className="workspace-top"><Brand /><button className="back-home" onClick={onBack}>← Volver a personas</button></div>
    <section className="person-hero">
      <Avatar person={person} compact />
      <div><p className="portal-eyebrow">ESPACIO PERSONAL</p><h1>Automatizaciones de {person.name}</h1><p>{person.description}</p></div>
    </section>
    <section className="person-operations">
      <div className="operations-heading"><div><p className="portal-eyebrow">ESPACIO DE TRABAJO</p><h2>Automatizaciones</h2></div></div>
      <div className="person-empty-state"><span aria-hidden="true">＋</span><strong>No hay automatizaciones asignadas</strong><p>Este espacio está listo para incorporar las automatizaciones correctas de {person.name}.</p></div>
    </section>
    <footer className="workspace-footer"><span>Automatizaciones del VRA</span><button onClick={onBack}>Cambiar de persona</button></footer>
  </main>;
}
