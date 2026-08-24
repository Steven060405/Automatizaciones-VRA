import readExcelFile, { type Row } from "read-excel-file/universal";
import type { ActGroup, ActMember } from "./actas-types";

type Cell = Row[number];

const MONTHS: Record<string, string> = {
  ENERO: "enero",
  FEBRERO: "febrero",
  MARZO: "marzo",
  ABRIL: "abril",
  MAYO: "mayo",
  JUNIO: "junio",
  JULIO: "julio",
  AGOSTO: "agosto",
  SETIEMBRE: "setiembre",
  SEPTIEMBRE: "septiembre",
  OCTUBRE: "octubre",
  NOVIEMBRE: "noviembre",
  DICIEMBRE: "diciembre",
};

const FACULTIES: Record<string, string> = {
  DERECHO: "Facultad de Derecho y Ciencias Sociales",
  ING: "Facultad de Ingeniería",
};

const PROFESSIONAL_TITLES: Record<string, string> = {
  "DERECHO CORPORATIVO": "ABOGADO (A)",
  "ADMINISTRACION Y FINANZAS": "LICENCIADO (A) EN ADMINISTRACIÓN Y FINANZAS",
  "ADMINISTRACION CON MENCION EN DIRECCION DE EMPRESAS": "LICENCIADO (A) EN ADMINISTRACIÓN CON MENCIÓN EN DIRECCIÓN DE EMPRESAS",
  "ADMINISTRACION Y MARKETING": "LICENCIADO (A) EN ADMINISTRACIÓN Y MARKETING",
  "ECONOMIA Y NEGOCIOS INTERNACIONALES": "LICENCIADO (A) EN ECONOMÍA Y NEGOCIOS INTERNACIONALES",
  "INGENIERIA INDUSTRIAL Y COMERCIAL": "INGENIERO (A) INDUSTRIAL Y COMERCIAL",
  "INGENIERIA EN GESTION AMBIENTAL": "INGENIERO (A) EN GESTIÓN AMBIENTAL",
  "INGENIERIA DE TECNOLOGIAS DE INFORMACION Y SISTEMAS": "INGENIERO (A) DE TECNOLOGÍAS DE INFORMACIÓN Y SISTEMAS",
  "INGENIERIA DE SISTEMAS": "INGENIERO (A) DE SISTEMAS",
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

function text(value: Cell) {
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, "");
  return String(value ?? "").trim();
}

function formatDate(value: Date) {
  return `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}`;
}

function identifier(value: Cell, length?: number) {
  const raw = text(value).replace(/\.0+$/, "").replace(/\s+/g, "");
  return length && /^\d+$/.test(raw) ? raw.padStart(length, "0") : raw;
}

function headerIndex(headers: string[], predicate: (header: string) => boolean) {
  return headers.findIndex(predicate);
}

function parseSchedule(scheduleValue: Cell, actNumber: string) {
  if (scheduleValue instanceof Date) {
    return {
      hour: `${String(scheduleValue.getHours()).padStart(2, "0")}:${String(scheduleValue.getMinutes()).padStart(2, "0")}`,
      day: String(scheduleValue.getDate()),
      month: Object.values(MONTHS)[scheduleValue.getMonth()],
      year: String(scheduleValue.getFullYear()),
    };
  }

  const schedule = text(scheduleValue);
  const normalizedSchedule = schedule.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const timeMatch = normalizedSchedule.match(/\b(\d{1,2})[:.](\d{2})\b/);
  const dateMatch = normalizedSchedule.match(/\b(\d{1,2})(?:\s+DE)?\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SETIEMBRE|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/);
  const yearMatch = normalizedSchedule.match(/\b(20\d{2})\b/) ?? actNumber.match(/-(20\d{2})-/);

  return {
    hour: timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}` : "",
    day: dateMatch?.[1] ?? "",
    month: dateMatch ? MONTHS[dateMatch[2]] : "",
    year: yearMatch?.[1] ?? "",
  };
}

function facultyFor(sheetName: string) {
  return FACULTIES[normalize(sheetName)] ?? "Facultad de Ciencias Económicas y Administrativas";
}

function professionalTitleFor(members: ActMember[]) {
  const titles = Array.from(new Set(members.map((member) => {
    const normalizedCareer = member.careerName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return PROFESSIONAL_TITLES[normalizedCareer] ?? `TÍTULO PROFESIONAL DE ${member.careerName.toUpperCase()}`;
  })));
  return titles.join(" / ");
}

function buildColumnMap(row: Row) {
  const headers = row.map(normalize);
  return {
    group: headerIndex(headers, (header) => header === "NGRUPO"),
    studentCode: headerIndex(headers, (header) => header === "CODIGODEALUMNO" || header === "CODIGO"),
    memberDni: headerIndex(headers, (header) => header === "DNI"),
    memberName: headerIndex(headers, (header) => header.includes("APELLIDOSYNOMBRESCOMPLETOSDECADAINTEGRANTE") || header === "APELLIDOSYNOMBRES"),
    careerName: headerIndex(headers, (header) => header === "CARRERA"),
    actNumber: headerIndex(headers, (header) => header === "NACTA"),
    careerCode: headerIndex(headers, (header) => header === "CARRERASIGLADEACTA"),
    startDate: headerIndex(headers, (header) => header === "FECHADEINICIODETRAMITE" || header === "FECHAINICIOTRAMITE"),
    title: headerIndex(headers, (header) => header.includes("TITULOTENTATIVO") || header.includes("TEMADELTRABAJO")),
    advisorDni: headerIndex(headers, (header) => header === "DNIASESOR" || header === "DNIDELASESOR"),
    advisorName: headerIndex(headers, (header) => header === "ASESOR" || header === "ASESORA" || header.includes("NOMBREDELASESOR")),
    advisorGender: headerIndex(headers, (header) =>
      header === "GENEROASESOR" || header === "GENERODELASESOR" ||
      header === "SEXOASESOR" || header === "SEXODELASESOR" ||
      header === "TRATAMIENTOASESOR" || header === "TRATAMIENTODELASESOR"),
    juror1Dni: headerIndex(headers, (header) => header === "DNIJURADO1"),
    juror1Name: headerIndex(headers, (header) => header === "JURADO1"),
    juror2Dni: headerIndex(headers, (header) => header === "DNIJURADO2"),
    juror2Name: headerIndex(headers, (header) => header === "JURADO2"),
    schedule: headerIndex(headers, (header) => header.startsWith("DIAHORARIO") || header.includes("HORARIOOFICIAL")),
  };
}

function valueAt(row: Row, index: number) {
  return index >= 0 ? row[index] : null;
}

function mergeFirst(current: string, candidate: Cell, formatter: (value: Cell) => string = text) {
  return current || formatter(candidate);
}

export async function parseActasWorkbook(file: File): Promise<ActGroup[]> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("El consolidado debe estar en formato .xlsx.");
  }

  const sheets = await readExcelFile(file);
  const groups = new Map<string, ActGroup>();

  for (const { sheet: sheetName, data: rows } of sheets) {
    const headerRowIndex = rows.findIndex((row) => {
      const headers = row.map(normalize);
      return headers.includes("NGRUPO") && headers.includes("NACTA");
    });
    if (headerRowIndex < 0) continue;

    const columns = buildColumnMap(rows[headerRowIndex]);
    for (const row of rows.slice(headerRowIndex + 1)) {
      const groupLabel = text(valueAt(row, columns.group));
      if (!groupLabel) continue;

      const key = `${sheetName}::${groupLabel}`;
      const existing = groups.get(key) ?? {
        group: groupLabel,
        careerFolder: sheetName,
        actNumber: "",
        faculty: facultyFor(sheetName),
        title: "",
        hour: "",
        day: "",
        month: "",
        year: "",
        professionalTitle: "",
        members: [],
        advisor: { name: "", dni: "", gender: "" },
        jurors: [{ name: "", dni: "" }, { name: "", dni: "" }],
      } satisfies ActGroup;

      existing.actNumber = mergeFirst(existing.actNumber, valueAt(row, columns.actNumber));
      existing.title = mergeFirst(existing.title, valueAt(row, columns.title));
      existing.advisor.name = mergeFirst(existing.advisor.name, valueAt(row, columns.advisorName));
      existing.advisor.dni = mergeFirst(existing.advisor.dni, valueAt(row, columns.advisorDni), (value) => identifier(value, 8));
      existing.advisor.gender = mergeFirst(existing.advisor.gender, valueAt(row, columns.advisorGender));
      existing.jurors[0].name = mergeFirst(existing.jurors[0].name, valueAt(row, columns.juror1Name));
      existing.jurors[0].dni = mergeFirst(existing.jurors[0].dni, valueAt(row, columns.juror1Dni), (value) => identifier(value, 8));
      existing.jurors[1].name = mergeFirst(existing.jurors[1].name, valueAt(row, columns.juror2Name));
      existing.jurors[1].dni = mergeFirst(existing.jurors[1].dni, valueAt(row, columns.juror2Dni), (value) => identifier(value, 8));

      const schedule = parseSchedule(valueAt(row, columns.schedule), existing.actNumber);
      existing.hour ||= schedule.hour;
      existing.day ||= schedule.day;
      existing.month ||= schedule.month;
      existing.year ||= schedule.year;

      const memberName = text(valueAt(row, columns.memberName));
      if (memberName) {
        existing.members.push({
          name: memberName,
          career: text(valueAt(row, columns.careerCode)),
          careerName: text(valueAt(row, columns.careerName)),
          studentCode: identifier(valueAt(row, columns.studentCode), 8),
          dni: identifier(valueAt(row, columns.memberDni), 8),
          startDate: text(valueAt(row, columns.startDate)),
        });
      }
      groups.set(key, existing);
    }
  }

  const result = Array.from(groups.values());
  if (!result.length) throw new Error("No se encontraron hojas de carrera con las columnas N°GRUPO y N° ACTA.");

  const errors: string[] = [];
  for (const group of result) {
    group.professionalTitle = professionalTitleFor(group.members);
    const missing: string[] = [];
    if (!group.actNumber) missing.push("N° de acta");
    if (!group.title) missing.push("título");
    if (!group.hour || !group.day || !group.month || !group.year) missing.push("día/horario");
    if (!group.members.length) missing.push("integrantes");
    if (group.members.length > 4) missing.push("máximo 4 integrantes");
    if (group.members.some((member) => !member.career || !member.studentCode || !member.dni || !member.startDate)) missing.push("datos completos de integrantes");
    if (!group.advisor.name || !group.advisor.dni) missing.push("asesor y DNI");
    if (group.jurors.some((juror) => !juror.name || !juror.dni)) missing.push("jurados y DNI");
    if (missing.length) errors.push(`${group.careerFolder} · ${group.group}: ${missing.join(", ")}`);
  }

  if (errors.length) {
    throw new Error(`Hay grupos incompletos en el Excel: ${errors.slice(0, 4).join("; ")}${errors.length > 4 ? "; …" : ""}`);
  }
  return result;
}
