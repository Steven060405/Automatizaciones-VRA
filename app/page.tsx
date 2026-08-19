"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Automation = {
  id: number;
  name: string;
  ecosystem: string;
  owner: string;
  trigger: string;
  status: "Activa" | "Pausada" | "Borrador";
  success: string;
  lastRun: string;
};

type Ecosystem = {
  name: string;
  short: string;
  description: string;
  automations: number;
  success: string;
  owner: string;
  updated: string;
  tone: string;
  icon: string;
};

type Operation = {
  name: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  connector: string;
};

const menu = [
  ["▦", "Centro de control"],
  ["◫", "Ecosistemas"],
  ["↯", "Automatizaciones"],
  ["◌", "Ejecuciones"],
  ["◇", "Plantillas"],
  ["⌁", "Conectores"],
];

const ecosystems: Ecosystem[] = [
  { name: "Titulación y grados", short: "Titulación", description: "Actas, jurados, horarios, calificaciones y evidencias de sustentación.", automations: 8, success: "98.8%", owner: "Ingrid Zárate", updated: "Hace 4 min", tone: "crimson", icon: "TG" },
  { name: "Programación académica", short: "Programación", description: "Carga lectiva, horarios, cruces, reservas y publicación académica.", automations: 7, success: "95.1%", owner: "Diego Vásquez", updated: "Hace 21 min", tone: "blue", icon: "PA" },
  { name: "Gestión docente", short: "Docentes", description: "Contratos, disponibilidad, evaluaciones y comunicaciones docentes.", automations: 12, success: "91.7%", owner: "Mariela Castro", updated: "Hace 1 h", tone: "emerald", icon: "GD" },
  { name: "Asesores y jurados", short: "Asesores", description: "Asignaciones, validación de datos, conformidades y pagos.", automations: 6, success: "96.4%", owner: "Ingrid Zárate", updated: "Hace 2 h", tone: "amber", icon: "AJ" },
  { name: "Infraestructura académica", short: "Infraestructura", description: "Aulas, aforos, modalidad, equipos y atención de incidencias.", automations: 5, success: "89.3%", owner: "Carlos Medina", updated: "Ayer", tone: "violet", icon: "IA" },
  { name: "Comunicaciones y encuestas", short: "Comunicaciones", description: "Correos, recordatorios, encuestas y seguimiento de respuestas.", automations: 9, success: "93.6%", owner: "Valeria León", updated: "Ayer", tone: "slate", icon: "CE" },
];

const ecosystemOperations: Record<string, Operation[]> = {
  "Titulación y grados": [
    { name: "Generar acta de sustentación", description: "Crea el acta desde el consolidado validado y prepara el folio para firma.", inputLabel: "Código de grupo o expediente", inputPlaceholder: "Ej. AM-01 o 1373-2026-T", connector: "Excel + Word/PDF" },
    { name: "Validar consolidado de grupos", description: "Comprueba alumnos, jurados, horario y modalidad antes de continuar.", inputLabel: "Archivo o lote a validar", inputPlaceholder: "Ej. Consolidado agosto 2026", connector: "Excel + Sistema académico" },
    { name: "Asignar jurados", description: "Cruza especialidad, disponibilidad y carga para proponer una terna.", inputLabel: "Programa o grupo", inputPlaceholder: "Ej. MBA G-04", connector: "Sistema académico + Correo" },
    { name: "Verificar horario de sustentación", description: "Detecta cruces entre el acta, el horario general y la reserva de aula.", inputLabel: "Grupo de sustentación", inputPlaceholder: "Ej. ADM-MKT G-01", connector: "Excel + Calendario" },
    { name: "Cerrar expediente", description: "Reúne acta, firmas y evidencias, y archiva el expediente completo.", inputLabel: "Número de expediente", inputPlaceholder: "Ej. 1373-2026-T", connector: "Word/PDF + Repositorio" },
  ],
  "Programación académica": [
    { name: "Detectar cruces de horario", description: "Compara secciones, docentes y ambientes para identificar conflictos.", inputLabel: "Periodo académico", inputPlaceholder: "Ej. 2026-2", connector: "Excel + Sistema académico" },
    { name: "Construir propuesta de horario", description: "Genera una primera distribución según disponibilidad y reglas académicas.", inputLabel: "Programa y periodo", inputPlaceholder: "Ej. MBA 2026-2", connector: "Sistema académico" },
    { name: "Reservar aulas", description: "Asigna ambientes según capacidad, modalidad y equipamiento requerido.", inputLabel: "Bloque o sección", inputPlaceholder: "Ej. Bloque nocturno", connector: "Infraestructura + Calendario" },
    { name: "Publicar programación", description: "Distribuye la versión aprobada y conserva la evidencia de publicación.", inputLabel: "Versión aprobada", inputPlaceholder: "Ej. Programación v4", connector: "Correo + Repositorio" },
  ],
  "Gestión docente": [
    { name: "Validar disponibilidad docente", description: "Consolida disponibilidad y alerta incompatibilidades con la carga asignada.", inputLabel: "Docente o periodo", inputPlaceholder: "Ej. 2026-2", connector: "Formularios + Excel" },
    { name: "Preparar contrato docente", description: "Completa el documento contractual con los datos y la carga aprobada.", inputLabel: "Código de docente", inputPlaceholder: "Ej. DOC-0241", connector: "Sistema académico + Word/PDF" },
    { name: "Enviar evaluación", description: "Programa y distribuye la evaluación docente a los grupos correspondientes.", inputLabel: "Curso o bloque", inputPlaceholder: "Ej. Finanzas corporativas", connector: "Formularios + Correo" },
    { name: "Actualizar carga académica", description: "Sincroniza cambios aprobados y genera un registro de diferencias.", inputLabel: "Periodo académico", inputPlaceholder: "Ej. 2026-2", connector: "Excel + Sistema académico" },
  ],
  "Asesores y jurados": [
    { name: "Asignar asesor", description: "Propone asignaciones según línea de investigación y disponibilidad.", inputLabel: "Lote de alumnos", inputPlaceholder: "Ej. MBA agosto 2026", connector: "Excel + Sistema académico" },
    { name: "Validar datos de asignación", description: "Detecta duplicados, omisiones y conflictos antes de publicar.", inputLabel: "Archivo de asignaciones", inputPlaceholder: "Ej. Asesores v3", connector: "Excel" },
    { name: "Generar conformidad", description: "Crea la constancia de conformidad con los datos del proceso.", inputLabel: "Código de asesoría", inputPlaceholder: "Ej. ASE-2026-018", connector: "Word/PDF + Repositorio" },
    { name: "Preparar planilla de pagos", description: "Consolida hitos aprobados y calcula el lote para revisión administrativa.", inputLabel: "Periodo de pago", inputPlaceholder: "Ej. Agosto 2026", connector: "Excel + Repositorio" },
  ],
  "Infraestructura académica": [
    { name: "Buscar aula disponible", description: "Filtra ambientes por fecha, aforo, sede y equipamiento.", inputLabel: "Fecha y bloque", inputPlaceholder: "Ej. 25/08/2026 · 19:00", connector: "Calendario + Infraestructura" },
    { name: "Validar modalidad y aforo", description: "Comprueba que el ambiente cumpla la modalidad y capacidad del grupo.", inputLabel: "Sección o evento", inputPlaceholder: "Ej. MBA G-04", connector: "Sistema académico" },
    { name: "Reservar equipo", description: "Solicita y registra los recursos audiovisuales requeridos.", inputLabel: "Aula o evento", inputPlaceholder: "Ej. Aula H-302", connector: "Infraestructura + Correo" },
    { name: "Registrar incidencia", description: "Crea el caso, notifica al responsable y conserva el seguimiento.", inputLabel: "Ambiente afectado", inputPlaceholder: "Ej. Aula H-302", connector: "Formularios + Correo" },
  ],
  "Comunicaciones y encuestas": [
    { name: "Enviar convocatoria", description: "Prepara destinatarios, personaliza el mensaje y registra los envíos.", inputLabel: "Campaña o audiencia", inputPlaceholder: "Ej. Jurados agosto 2026", connector: "Correo + Sistema académico" },
    { name: "Programar recordatorio", description: "Agenda seguimientos automáticos según fecha y estado de respuesta.", inputLabel: "Proceso o fecha límite", inputPlaceholder: "Ej. Firma de actas · 28/08", connector: "Correo + Calendario" },
    { name: "Lanzar encuesta", description: "Publica el formulario y distribuye un enlace trazable a la audiencia.", inputLabel: "Nombre de encuesta", inputPlaceholder: "Ej. Experiencia de sustentación", connector: "Formularios + Correo" },
    { name: "Consolidar respuestas", description: "Agrupa resultados, identifica pendientes y produce un resumen operativo.", inputLabel: "Encuesta a consolidar", inputPlaceholder: "Ej. Encuesta posterior agosto", connector: "Formularios + Excel" },
  ],
};

const seedAutomations: Automation[] = [
  { id: 1, name: "Generar acta de sustentación", ecosystem: "Titulación y grados", owner: "Ingrid Zárate", trigger: "Nuevo grupo validado", status: "Activa", success: "99.2%", lastRun: "Hace 4 min" },
  { id: 2, name: "Validar consolidado de grupos", ecosystem: "Titulación y grados", owner: "Ingrid Zárate", trigger: "Archivo actualizado", status: "Activa", success: "97.8%", lastRun: "Hace 12 min" },
  { id: 3, name: "Detectar cruces de horario", ecosystem: "Programación académica", owner: "Diego Vásquez", trigger: "Cada 30 minutos", status: "Activa", success: "95.4%", lastRun: "Hace 21 min" },
  { id: 4, name: "Consolidar asignación de asesores", ecosystem: "Asesores y jurados", owner: "Mariela Castro", trigger: "Bajo demanda", status: "Activa", success: "96.1%", lastRun: "En ejecución" },
  { id: 5, name: "Enviar encuesta posterior", ecosystem: "Comunicaciones y encuestas", owner: "Valeria León", trigger: "Acta cerrada", status: "Activa", success: "92.8%", lastRun: "Hace 1 h" },
  { id: 6, name: "Reservar aula híbrida", ecosystem: "Infraestructura académica", owner: "Carlos Medina", trigger: "Horario aprobado", status: "Pausada", success: "89.6%", lastRun: "Ayer" },
];

const executions = [
  { name: "Consolidado de asesores", ecosystem: "Asesores y jurados", status: "Procesando", progress: 68, detail: "30 de 44 asignaciones verificadas", time: "Inició 12:07" },
  { name: "Generación masiva de actas", ecosystem: "Titulación y grados", status: "En cola", progress: 0, detail: "44 documentos por generar", time: "Programada 14:30" },
  { name: "Sincronización de horarios", ecosystem: "Programación académica", status: "Completada", progress: 100, detail: "1 inconsistencia detectada", time: "Finalizó 11:52" },
];

const templates = [
  ["ACT", "Acta de sustentación grupal", "Documento", "v3.2", "Titulación"],
  ["COR", "Correo a jurados", "Comunicación", "v2.1", "Titulación"],
  ["HOR", "Matriz de horarios y aulas", "Hoja de cálculo", "v4.0", "Programación"],
  ["CNF", "Conformidad de asesor", "Documento", "v1.8", "Asesores"],
  ["ENC", "Encuesta posterior", "Formulario", "v2.4", "Comunicaciones"],
  ["RPT", "Reporte operativo semanal", "Reporte", "v1.3", "Gobierno"],
];

const connectors = [
  ["XL", "Excel / Hojas de cálculo", "Lectura y escritura de consolidados", "Conectado", "Hace 4 min"],
  ["WD", "Word y PDF", "Generación documental y evidencias", "Conectado", "Hace 4 min"],
  ["EM", "Correo institucional", "Notificaciones y recordatorios", "Conectado", "Hace 1 h"],
  ["DR", "Repositorio documental", "Archivo y trazabilidad", "Conectado", "Hace 12 min"],
  ["FR", "Formularios", "Encuestas y captura de respuestas", "Atención", "Hace 2 h"],
  ["SI", "Sistema académico", "Datos maestros de alumnos y docentes", "Planificado", "Sin sincronizar"],
];

const sectionCopy: Record<string, [string, string]> = {
  "Centro de control": ["Centro de control", "Todo el ecosistema de automatizaciones del VRA, en un solo lugar."],
  Ecosistemas: ["Ecosistemas", "Agrupa procesos, responsables, datos y automatizaciones por ámbito de trabajo."],
  Automatizaciones: ["Automatizaciones", "Diseña, activa y supervisa los flujos que hacen avanzar la operación."],
  Ejecuciones: ["Ejecuciones", "Sigue cada proceso en tiempo real y conserva su evidencia de principio a fin."],
  Plantillas: ["Plantillas", "Gobierna los documentos y estructuras reutilizables de cada automatización."],
  Conectores: ["Conectores", "Controla las fuentes y servicios que intercambian información con el VRA."],
};

export default function Home() {
  const [active, setActive] = useState("Centro de control");
  const [automations, setAutomations] = useState(seedAutomations);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("vra-automations-v1");
    if (stored) {
      try { setAutomations(JSON.parse(stored)); } catch { /* keep seed data */ }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("vra-automations-v1", JSON.stringify(automations));
  }, [automations]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setModalOpen(false); setSelectedOperation(null); setNotificationsOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredAutomations = useMemo(() => automations.filter((item) => {
    const matchesQuery = `${item.name} ${item.ecosystem} ${item.owner}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "Todos" || item.status === filter);
  }), [automations, query, filter]);

  const showToast = (message: string) => setToast(message);

  const navigate = (label: string) => {
    setActive(label);
    setSelectedEcosystem(null);
    setSelectedOperation(null);
    setQuery("");
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEcosystem = (item: Ecosystem) => {
    setActive("Ecosistemas");
    setSelectedEcosystem(item);
    setSelectedOperation(null);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const executeOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOperation) return;
    const form = new FormData(event.currentTarget);
    const context = String(form.get("context") || "lote seleccionado");
    showToast(`Ejecución iniciada: ${selectedOperation.name} · ${context}`);
    setSelectedOperation(null);
  };

  const toggleAutomation = (id: number) => {
    setAutomations((items) => items.map((item) => item.id === id
      ? { ...item, status: item.status === "Activa" ? "Pausada" : "Activa" }
      : item));
    const current = automations.find((item) => item.id === id);
    showToast(current?.status === "Activa" ? "Automatización pausada" : "Automatización activada");
  };

  const runAutomation = (name: string) => showToast(`Ejecución iniciada: ${name}`);

  const createAutomation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newItem: Automation = {
      id: Date.now(),
      name: String(form.get("name")),
      ecosystem: String(form.get("ecosystem")),
      owner: String(form.get("owner")),
      trigger: String(form.get("trigger")),
      status: "Borrador",
      success: "—",
      lastRun: "Sin ejecutar",
    };
    setAutomations((items) => [newItem, ...items]);
    setModalOpen(false);
    setActive("Automatizaciones");
    showToast("Automatización creada como borrador");
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span><strong>Automatizaciones</strong><small>Vicerrectorado Académico</small></span>
        </div>
        <nav aria-label="Navegación principal">
          <p className="nav-label">OPERACIÓN</p>
          {menu.map(([icon, label]) => (
            <button className={`nav-item ${active === label ? "active" : ""}`} key={label} onClick={() => navigate(label)}>
              <span aria-hidden="true">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="pulse-dot" /><div><strong>Sistemas operativos</strong><small>5 de 6 servicios en línea</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">ENTORNO PILOTO · MIÉRCOLES, 19 DE AGOSTO</p>
            <h1>{selectedEcosystem && active === "Ecosistemas" ? selectedEcosystem.name : sectionCopy[active][0]}</h1>
            <p>{selectedEcosystem && active === "Ecosistemas" ? "Selecciona una automatización, completa su contexto y ejecútala desde este ecosistema." : sectionCopy[active][1]}</p>
          </div>
          <div className="top-actions">
            <div className="notification-wrap">
              <button className="icon-button" aria-label="Ver notificaciones" onClick={() => setNotificationsOpen((open) => !open)}>●<i /></button>
              {notificationsOpen && <div className="notification-popover"><strong>Centro de alertas</strong><p><span>!</span> Horario y acta del grupo AM-01 no coinciden.</p><p><span>✓</span> Acta 1373-2026-T archivada correctamente.</p><button onClick={() => navigate("Ejecuciones")}>Ver actividad</button></div>}
            </div>
            <button className="primary-button" onClick={() => setModalOpen(true)}><span>＋</span>Nueva automatización</button>
            <span className="avatar" title="Ingrid Zárate">IZ</span>
          </div>
        </header>

        {active === "Centro de control" && <Dashboard
          onNavigate={navigate}
          onOpenEcosystem={openEcosystem}
          onReview={() => showToast("Caso AM-01 enviado a revisión")}
        />}
        {active === "Ecosistemas" && (selectedEcosystem
          ? <EcosystemWorkspace item={selectedEcosystem} onBack={() => setSelectedEcosystem(null)} onRun={setSelectedOperation} />
          : <EcosystemsView onSelect={openEcosystem} />)}
        {active === "Automatizaciones" && <AutomationsView
          items={filteredAutomations} query={query} filter={filter}
          onQuery={setQuery} onFilter={setFilter} onToggle={toggleAutomation}
          onRun={runAutomation} onCreate={() => setModalOpen(true)}
        />}
        {active === "Ejecuciones" && <ExecutionsView onRun={runAutomation} />}
        {active === "Plantillas" && <TemplatesView onUse={(name) => showToast(`Plantilla lista: ${name}`)} />}
        {active === "Conectores" && <ConnectorsView onCheck={(name) => showToast(`Verificación iniciada: ${name}`)} />}
      </section>

      {selectedOperation && selectedEcosystem && <OperationRunner operation={selectedOperation} ecosystem={selectedEcosystem} onClose={() => setSelectedOperation(null)} onSubmit={executeOperation} />}
      {modalOpen && <NewAutomationModal onClose={() => setModalOpen(false)} onSubmit={createAutomation} />}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}

function Dashboard({ onNavigate, onOpenEcosystem, onReview }: {
  onNavigate: (label: string) => void;
  onOpenEcosystem: (item: Ecosystem) => void;
  onReview: () => void;
}) {
  const metrics = [["12", "Ecosistemas activos", "+2 este mes", "◫"], ["47", "Automatizaciones", "41 operativas", "↯"], ["92.4%", "Tasa de éxito", "+3.1% vs. julio", "✓"], ["136 h", "Tiempo recuperado", "Últimos 30 días", "◷"]];
  return <>
    <section className="metrics" aria-label="Indicadores principales">
      {metrics.map(([value, label, detail, icon], index) => <article className="metric-card" key={label}><span className={`metric-symbol symbol-${index}`}>{icon}</span><div><strong>{value}</strong><p>{label}</p><small>{detail}</small></div></article>)}
    </section>

    <section className="review-alert">
      <span className="review-icon">!</span>
      <div><strong>Una inconsistencia requiere revisión</strong><p>Adm. y Marketing G-01: el horario general indica 19/06, pero el acta final registra 22/06 a las 07:30.</p></div>
      <button onClick={onReview}>Revisar caso</button>
    </section>

    <div className="dashboard-grid">
      <section className="panel ecosystem-panel">
        <div className="panel-heading"><div><p className="eyebrow">ECOSISTEMA PRIORITARIO</p><h2>Titulación y grados</h2></div><span className="status live"><i />Operativo</span></div>
        <p className="panel-description">Desde el consolidado de grupos hasta el acta firmada y su evidencia final.</p>
        <div className="workflow" aria-label="Flujo de automatización del acta">
          <div className="flow-step"><span>01</span><strong>Consolidar</strong><small>Excel maestro</small></div><b>→</b>
          <div className="flow-step"><span>02</span><strong>Validar</strong><small>Datos y horario</small></div><b>→</b>
          <div className="flow-step featured"><span>03</span><strong>Generar acta</strong><small>Documento y folio</small></div><b>→</b>
          <div className="flow-step"><span>04</span><strong>Cerrar</strong><small>Firma y archivo</small></div>
        </div>
        <div className="ecosystem-footer"><div className="stacked-avatars"><i>IZ</i><i>DV</i><i>MC</i><span>+5</span></div><p><strong>8 automatizaciones</strong><br />Última ejecución hace 4 min</p><button className="text-button" onClick={() => onOpenEcosystem(ecosystems[0])}>Abrir ecosistema →</button></div>
      </section>
      <aside className="panel activity-panel">
        <div className="panel-heading"><div><p className="eyebrow">EN VIVO</p><h2>Actividad reciente</h2></div><button className="more-button" aria-label="Más opciones">•••</button></div>
        <div className="activity-list">
          <div className="activity-item success"><span>✓</span><div><strong>Acta 1373-2026-T</strong><p>Generación y validación completadas</p><small>Hace 4 min · Titulación</small></div></div>
          <div className="activity-item running"><span>↻</span><div><strong>Consolidado de asesores</strong><p>Procesando 44 asignaciones</p><small>En curso · 68%</small></div></div>
          <div className="activity-item queued"><span>→</span><div><strong>Reserva de aulas</strong><p>Programada para las 14:30</p><small>En cola · Infraestructura</small></div></div>
        </div>
        <button className="full-link" onClick={() => onNavigate("Ejecuciones")}>Ver todas las ejecuciones</button>
      </aside>
    </div>

    <section className="section-block compact-ecosystems">
      <div className="section-heading"><div><p className="eyebrow">PANORAMA</p><h2>Ecosistemas con mayor actividad</h2></div><button className="text-button" onClick={() => onNavigate("Ecosistemas")}>Ver los 12 ecosistemas →</button></div>
      <div className="mini-ecosystem-grid">{ecosystems.slice(0, 3).map((item) => <button key={item.name} onClick={() => onOpenEcosystem(item)}><span className={`ecosystem-icon ${item.tone}`}>{item.icon}</span><div><strong>{item.name}</strong><small>{item.automations} automatizaciones · {item.success} éxito</small></div><b>→</b></button>)}</div>
    </section>
  </>;
}

function EcosystemsView({ onSelect }: { onSelect: (item: Ecosystem) => void }) {
  return <section className="section-block flush">
    <div className="ecosystem-intro"><div><p className="eyebrow">PUERTAS DE ENTRADA</p><h2>Elige el tema que deseas automatizar</h2><p>Cada nombre te lleva a su espacio de trabajo con las acciones, datos y conectores correspondientes.</p></div><span className="status live"><i />6 ecosistemas disponibles</span></div>
    <div className="ecosystem-card-grid">{ecosystems.map((item) => <article className="ecosystem-card" key={item.name}>
      <div className="card-top"><span className={`ecosystem-icon ${item.tone}`}>{item.icon}</span><span className="status live"><i />Operativo</span></div>
      <button className="ecosystem-name-button" onClick={() => onSelect(item)}><span>{item.name}</span><b aria-hidden="true">→</b></button><p>{item.description}</p>
      <div className="card-stats"><span><strong>{item.automations}</strong><small>automatizaciones</small></span><span><strong>{item.success}</strong><small>tasa de éxito</small></span></div>
      <div className="card-owner"><span>{item.owner.split(" ").map((part) => part[0]).slice(0,2).join("")}</span><p><strong>{item.owner}</strong><small>Actualizado {item.updated.toLowerCase()}</small></p><button onClick={() => onSelect(item)} aria-label={`Entrar a ${item.name}`}>Entrar</button></div>
    </article>)}</div>
  </section>;
}

function EcosystemWorkspace({ item, onBack, onRun }: { item: Ecosystem; onBack: () => void; onRun: (operation: Operation) => void }) {
  const operations = ecosystemOperations[item.name] ?? [];
  const recent = executions.filter((execution) => execution.ecosystem === item.name);
  return <section className="ecosystem-workspace">
    <button className="breadcrumb-button" onClick={onBack}>← Todos los ecosistemas</button>
    <div className="workspace-hero">
      <div className="workspace-identity"><span className={`ecosystem-icon large ${item.tone}`}>{item.icon}</span><div><p className="eyebrow">ESPACIO OPERATIVO</p><h2>{item.name}</h2><p>{item.description}</p></div></div>
      <div className="workspace-kpis"><span><strong>{operations.length}</strong><small>acciones disponibles</small></span><span><strong>{item.success}</strong><small>tasa de éxito</small></span><span><strong>{item.owner}</strong><small>responsable</small></span></div>
    </div>

    <div className="workspace-heading"><div><p className="eyebrow">AUTOMATIZACIONES DEL ECOSISTEMA</p><h2>¿Qué necesitas hacer?</h2></div><span>Selecciona una acción para configurar su ejecución.</span></div>
    <div className="operation-grid">{operations.map((operation, index) => <button className="operation-button" onClick={() => onRun(operation)} key={operation.name}>
      <span className="operation-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="operation-copy"><strong>{operation.name}</strong><small>{operation.description}</small><i>{operation.connector}</i></span>
      <b aria-hidden="true">Configurar y ejecutar →</b>
    </button>)}</div>

    <div className="workspace-lower-grid">
      <section className="workspace-panel"><div className="workspace-panel-title"><div><p className="eyebrow">CONTROL</p><h3>Cómo se ejecuta</h3></div><span className="status live"><i />Trazable</span></div><ol className="workspace-steps"><li><span>1</span><div><strong>Indica el contexto</strong><p>Grupo, expediente, periodo o archivo sobre el que trabajarás.</p></div></li><li><span>2</span><div><strong>Valida antes de procesar</strong><p>El flujo comprueba datos y muestra alertas antes de producir resultados.</p></div></li><li><span>3</span><div><strong>Conserva la evidencia</strong><p>Cada resultado registra responsable, fecha, estado y documentos asociados.</p></div></li></ol></section>
      <section className="workspace-panel"><div className="workspace-panel-title"><div><p className="eyebrow">ACTIVIDAD</p><h3>Ejecuciones recientes</h3></div></div>{recent.length > 0 ? recent.map((execution) => <div className="workspace-activity" key={execution.name}><span className={execution.status === "Completada" ? "ok" : "running"}>{execution.status === "Completada" ? "✓" : "↻"}</span><div><strong>{execution.name}</strong><p>{execution.detail}</p><small>{execution.time}</small></div></div>) : <div className="workspace-empty"><span>◌</span><strong>Sin ejecuciones abiertas</strong><p>La próxima automatización aparecerá aquí.</p></div>}</section>
    </div>
  </section>;
}

function AutomationsView({ items, query, filter, onQuery, onFilter, onToggle, onRun, onCreate }: {
  items: Automation[]; query: string; filter: string;
  onQuery: (value: string) => void; onFilter: (value: string) => void;
  onToggle: (id: number) => void; onRun: (name: string) => void; onCreate: () => void;
}) {
  return <section className="section-block flush">
    <div className="automation-toolbar"><label className="search-field"><span>⌕</span><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Buscar por nombre, ecosistema o responsable" aria-label="Buscar automatizaciones" /></label><label className="select-field"><span>Estado</span><select value={filter} onChange={(e) => onFilter(e.target.value)}><option>Todos</option><option>Activa</option><option>Pausada</option><option>Borrador</option></select></label></div>
    <div className="table-card">
      <div className="table-title"><div><strong>Catálogo de automatizaciones</strong><small>{items.length} resultados visibles</small></div><button className="secondary-button" onClick={onCreate}>＋ Crear</button></div>
      <div className="automation-table" role="table">
        <div className="automation-row table-head" role="row"><span>Automatización</span><span>Ecosistema</span><span>Disparador</span><span>Estado</span><span>Éxito</span><span>Acciones</span></div>
        {items.map((item) => <div className="automation-row" role="row" key={item.id}>
          <span className="automation-name"><i>↯</i><span><strong>{item.name}</strong><small>{item.owner} · {item.lastRun}</small></span></span><span>{item.ecosystem}</span><span>{item.trigger}</span><span><b className={`state-pill ${item.status.toLowerCase()}`}>{item.status}</b></span><span className="success-rate">{item.success}</span><span className="row-actions"><button onClick={() => onRun(item.name)} title="Ejecutar">▷</button><button onClick={() => onToggle(item.id)} title={item.status === "Activa" ? "Pausar" : "Activar"}>{item.status === "Activa" ? "Ⅱ" : "▶"}</button><button title="Más opciones">•••</button></span>
        </div>)}
        {items.length === 0 && <div className="empty-state"><span>⌕</span><strong>No encontramos automatizaciones</strong><p>Prueba otra búsqueda o crea un flujo nuevo.</p></div>}
      </div>
    </div>
  </section>;
}

function ExecutionsView({ onRun }: { onRun: (name: string) => void }) {
  return <section className="section-block flush">
    <div className="execution-summary"><article><span>↻</span><div><strong>1</strong><small>En proceso</small></div></article><article><span>→</span><div><strong>1</strong><small>En cola</small></div></article><article><span>✓</span><div><strong>128</strong><small>Completadas hoy</small></div></article><article><span>!</span><div><strong>3</strong><small>Requieren atención</small></div></article></div>
    <div className="execution-grid">{executions.map((item) => <article className="execution-card" key={item.name}><div className="execution-top"><span className={`execution-state ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span><small>{item.time}</small></div><h2>{item.name}</h2><p>{item.ecosystem}</p><div className="progress-track"><i style={{ width: `${item.progress}%` }} /></div><div className="progress-copy"><span>{item.detail}</span><strong>{item.progress}%</strong></div><div className="execution-actions"><button>Ver detalle</button><button onClick={() => onRun(item.name)}>Ejecutar de nuevo</button></div></article>)}</div>
    <div className="history-card"><div className="table-title"><div><strong>Historial reciente</strong><small>Últimas ejecuciones cerradas</small></div><button className="secondary-button">Exportar registro</button></div>{["Acta 1373-2026-T · Completada · 12:03","Validación de consolidado · Completada con advertencias · 11:58","Correo a jurados · Completada · 11:42","Encuesta posterior · Completada · 10:15"].map((line, index) => { const [name,status,time] = line.split(" · "); return <div className="history-row" key={line}><span className={index === 1 ? "warn" : "ok"}>{index === 1 ? "!" : "✓"}</span><strong>{name}</strong><p>{status}</p><small>{time}</small><button>Ver evidencia →</button></div>; })}</div>
  </section>;
}

function TemplatesView({ onUse }: { onUse: (name: string) => void }) {
  return <section className="section-block flush"><div className="template-toolbar"><div><span className="status neutral">18 publicadas</span><span className="status draft">3 borradores</span></div><button className="secondary-button">＋ Nueva plantilla</button></div><div className="template-grid">{templates.map(([icon,name,type,version,ecosystem]) => <article className="template-card" key={name}><div className="template-preview"><span>{icon}</span><i /><i /><i /></div><div className="template-body"><span className="template-type">{type}</span><h2>{name}</h2><p>{ecosystem} · {version}</p><div><button onClick={() => onUse(name)}>Usar plantilla</button><button aria-label={`Más opciones de ${name}`}>•••</button></div></div></article>)}</div></section>;
}

function ConnectorsView({ onCheck }: { onCheck: (name: string) => void }) {
  return <section className="section-block flush"><div className="connector-banner"><div><span>⌁</span><div><strong>Arquitectura conectada</strong><p>Cada intercambio conserva responsable, fecha, resultado y evidencia.</p></div></div><span className="status live"><i />5 servicios operativos</span></div><div className="connector-list">{connectors.map(([icon,name,description,status,lastSync]) => <article key={name}><span className="connector-icon">{icon}</span><div className="connector-copy"><strong>{name}</strong><p>{description}</p></div><div className="connector-health"><span className={`state-pill ${status === "Conectado" ? "activa" : status === "Atención" ? "pausada" : "borrador"}`}>{status}</span><small>{lastSync}</small></div><button onClick={() => onCheck(name)}>{status === "Planificado" ? "Configurar" : "Verificar"}</button></article>)}</div></section>;
}

function OperationRunner({ operation, ecosystem, onClose, onSubmit }: { operation: Operation; ecosystem: Ecosystem; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="overlay modal-overlay" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}><section className="modal runner-modal" role="dialog" aria-modal="true" aria-labelledby="runner-title"><button className="close-button" onClick={onClose} aria-label="Cerrar">×</button><div className="runner-heading"><span className={`ecosystem-icon ${ecosystem.tone}`}>{ecosystem.icon}</span><div><p className="eyebrow">{ecosystem.name}</p><h2 id="runner-title">{operation.name}</h2></div></div><p>{operation.description}</p><form onSubmit={onSubmit}><label>{operation.inputLabel}<input name="context" required placeholder={operation.inputPlaceholder} autoFocus /></label><div className="runner-route"><div><span>01</span><strong>Recibir datos</strong><small>Contexto indicado</small></div><b>→</b><div><span>02</span><strong>Validar</strong><small>Reglas del VRA</small></div><b>→</b><div><span>03</span><strong>Generar</strong><small>Resultado y evidencia</small></div></div><div className="runner-connector"><span>⌁</span><div><small>Conectores previstos</small><strong>{operation.connector}</strong></div><i className="status live"><i />Disponibles</i></div><div className="modal-note"><span>i</span><p>Esta ejecución piloto simula el inicio del flujo. La integración productiva utilizará los permisos y fuentes institucionales configurados.</p></div><div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button">▷ Ejecutar automatización</button></div></form></section></div>;
}

function NewAutomationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="overlay modal-overlay" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="close-button" onClick={onClose} aria-label="Cerrar">×</button><p className="eyebrow">NUEVO FLUJO</p><h2 id="modal-title">Crear automatización</h2><p>Define el propósito y su contexto. Se guardará como borrador para completar sus pasos.</p><form onSubmit={onSubmit}><label>Nombre de la automatización<input name="name" required placeholder="Ej. Validar expedientes de titulación" autoFocus /></label><div className="form-grid"><label>Ecosistema<select name="ecosystem" required>{ecosystems.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>Responsable<input name="owner" required defaultValue="Ingrid Zárate" /></label></div><label>Disparador<select name="trigger"><option>Bajo demanda</option><option>Archivo actualizado</option><option>Horario programado</option><option>Registro aprobado</option><option>Documento firmado</option></select></label><div className="modal-note"><span>i</span><p>Después podrás configurar fuentes, validaciones, acciones y evidencia.</p></div><div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button">Crear borrador</button></div></form></section></div>;
}
