const ROOT_FOLDER_ID = "1LFwml0T6jwio2R0HVILBQ-GxSl1R-VqB";
const TEMPLATE_ID = "1pKUqz_VZ2avh5X-5FSFMUiEKfD87Y8DXCM19du0uIEQ";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const GOOGLE_SHEETS_MIME = "application/vnd.google-apps.spreadsheet";
const GOOGLE_DOCS_MIME = "application/vnd.google-apps.document";
const AISHA_SIGNATURE_BASE64_PROPERTY = "AISHA_SIGNATURE_BASE64";
const AISHA_SIGNATURE_FILE_ID_PROPERTY = "AISHA_SIGNATURE_FILE_ID";
const SIGNATURE_ANCHOR = "KETYJAUREGUIPHD";
const SIGNED_FOLDER_NAME = "FIRMADOS";
const SIGNATURE_WIDTH_PX = 182;
const SIGNATURE_HEIGHT_PX = 69;
const AUTHORIZED_EMAILS = [
  "sespinoza@esan.edu.pe",
  "gespinozar822@gmail.com",
  "izarate@esan.edu.pe",
  "cursos_actualizacion@ue.edu.pe",
  "atizon@esan.edu.pe",
  "kjauregui@esan.edu.pe",
  "srivadeneyra@esan.edu.pe",
];

const MONTHS = {
  ENERO: "enero", FEBRERO: "febrero", MARZO: "marzo", ABRIL: "abril",
  MAYO: "mayo", JUNIO: "junio", JULIO: "julio", AGOSTO: "agosto",
  SETIEMBRE: "setiembre", SEPTIEMBRE: "septiembre", OCTUBRE: "octubre",
  NOVIEMBRE: "noviembre", DICIEMBRE: "diciembre",
};

const FACULTIES = {
  DERECHO: "Facultad de Derecho y Ciencias Sociales",
  ING: "Facultad de Ingeniería",
};

const PROFESSIONAL_TITLES = {
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

const FEMALE_ADVISOR_FIRST_NAMES = [
  "ADRIANA", "AISHA", "ALEJANDRA", "ALEXANDRA", "ALICIA", "ANA", "ANDREA", "ANGELA",
  "BEATRIZ", "CARMEN", "CAROLINA", "CATALINA", "CECILIA", "CLAUDIA", "CRISTINA",
  "DANIELA", "DIANA", "DORIS", "ELENA", "ELIZABETH", "ERIKA", "EVELYN", "FABIOLA",
  "FERNANDA", "GABRIELA", "GIANNINA", "GLADYS", "GRACIELA", "INGRID", "IRIS", "ISABEL",
  "JACQUELINE", "JANET", "JESSICA", "JOHANNA", "JULIA", "JULIANA", "KAREN", "KARINA",
  "KATHERINE", "KATIA", "KELLY", "KETY", "LAURA", "LILIANA", "LOURDES", "LUCIA", "LUZ",
  "MARIA", "MARIANA", "MARIELA", "MARISOL", "MARTA", "MERCEDES", "MILAGROS", "MONICA",
  "NANCY", "NATALIA", "NICOLE", "NORMA", "OLGA", "PAMELA", "PAOLA", "PATRICIA", "PILAR",
  "RAQUEL", "ROCIO", "ROSA", "ROSARIO", "ROSSANA", "RUTH", "SANDRA", "SILVIA", "SOFIA",
  "SONIA", "SUSANA", "TERESA", "VALERIA", "VANESSA", "VERONICA", "VICTORIA", "VIOLETA",
  "XIOMARA", "YESENIA", "YOLANDA",
];

function doGet() {
  const email = activeUserEmail_();
  if (!isAuthorizedEmail_(email)) {
    return HtmlService.createHtmlOutput(unauthorizedHtml_(email))
      .setTitle("Acceso no autorizado | Automatizaciones del VRA")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const output = HtmlService.createHtmlOutputFromFile("Index");
  const html = output.getContent();
  if (!/^\s*<!doctype html>/i.test(html) || html.indexOf('data-person="Ingrid Zarate"') < 0) {
    throw new Error("La interfaz de Ingrid no contiene un documento HTML válido.");
  }
  return output
    .setTitle("Automatizaciones del VRA")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getUserEmail() {
  return requireAuthorizedUser_();
}

function analyzeWorkbook(base64Data, fileName) {
  requireAuthorizedUser_();
  if (!/\.xlsx$/i.test(String(fileName || ""))) {
    throw new Error("El consolidado debe estar en formato .xlsx.");
  }

  let temporarySheet;
  try {
    const bytes = Utilities.base64Decode(String(base64Data || ""));
    const blob = Utilities.newBlob(bytes, XLSX_MIME, fileName);
    temporarySheet = Drive.Files.create({
      name: "TEMP CONSOLIDADO " + new Date().getTime(),
      mimeType: GOOGLE_SHEETS_MIME,
    }, blob, { fields: "id" });

    const workbook = SpreadsheetApp.openById(temporarySheet.id);
    return parseWorkbook_(workbook);
  } finally {
    if (temporarySheet && temporarySheet.id) {
      DriveApp.getFileById(temporarySheet.id).setTrashed(true);
    }
  }
}

function preparePeriod(period) {
  requireAuthorizedUser_();
  validatePeriod_(period);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const periodFolder = getOrCreateFolder_(rootFolder, period);
    console.log("Carpeta del período confirmada: " + period);
    return { periodUrl: periodFolder.getUrl() };
  } finally {
    lock.releaseLock();
  }
}

function prepareGeneration(period, careerNames) {
  requireAuthorizedUser_();
  validatePeriod_(period);
  if (!Array.isArray(careerNames) || !careerNames.length) {
    throw new Error("No se recibieron carreras para preparar las carpetas.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const periodFolder = ensureGenerationStructure_(rootFolder, period, careerNames);
    console.log("Estructura preparada: " + period + " · " + careerNames.length + " carreras");
    return { periodUrl: periodFolder.getUrl(), careerCount: careerNames.length };
  } finally {
    lock.releaseLock();
  }
}

function generateBatch(period, groups) {
  requireAuthorizedUser_();
  validatePeriod_(period);
  if (!Array.isArray(groups) || !groups.length || groups.length > 3) {
    throw new Error("El lote de actas no tiene el formato esperado.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const periodFolder = getOrCreateFolder_(rootFolder, period);
    const results = groups.map(function(group) {
      return generateAct_(periodFolder, group);
    });
    console.log("Lote generado: " + period + " · " + results.length + " actas");
    return { periodUrl: periodFolder.getUrl(), results: results };
  } finally {
    lock.releaseLock();
  }
}

function verifyGeneration(period, expectedFiles) {
  requireAuthorizedUser_();
  validatePeriod_(period);
  if (!Array.isArray(expectedFiles) || !expectedFiles.length) {
    throw new Error("No se recibieron actas para verificar.");
  }

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const periodFolder = findFolder_(rootFolder, period);
  if (!periodFolder) throw new Error("Drive no confirmó la carpeta del período " + period + ".");

  const missing = [];
  expectedFiles.forEach(function(item) {
    const careerName = safeFolderName_(item.careerFolder);
    const careerFolder = findFolder_(periodFolder, careerName);
    const wordsFolder = careerFolder ? findFolder_(careerFolder, "WORDS") : null;
    const pdfsFolder = careerFolder ? findFolder_(careerFolder, "PDFS") : null;
    const safeActNumber = safeFilePart_(item.actNumber);
    const wordName = "ACTA N° " + safeActNumber + ".docx";
    const pdfName = "ACTA N° " + safeActNumber + ".pdf";
    if (!wordsFolder || !wordsFolder.getFilesByName(wordName).hasNext()) missing.push(careerName + "/WORDS/" + wordName);
    if (!pdfsFolder || !pdfsFolder.getFilesByName(pdfName).hasNext()) missing.push(careerName + "/PDFS/" + pdfName);
  });

  if (missing.length) {
    throw new Error("Drive no confirmó todos los archivos. Faltan: " + missing.slice(0, 4).join("; ") + (missing.length > 4 ? "; …" : ""));
  }
  console.log("Generación verificada: " + period + " · " + expectedFiles.length + " actas");
  return { periodUrl: periodFolder.getUrl(), verifiedCount: expectedFiles.length };
}

function prepareSignatureBatch(folderUrl) {
  requireAuthorizedUser_();
  const sourceFolder = driveFolderFromInput_(folderUrl);
  getAishaSignatureBlob_();
  const signedFolder = getOrCreateFolder_(sourceFolder, SIGNED_FOLDER_NAME);
  const files = listWordFiles_(sourceFolder);
  if (!files.length) {
    throw new Error("La carpeta compartida no contiene documentos Word (.docx) en su nivel principal.");
  }

  return {
    folderId: sourceFolder.getId(),
    folderName: sourceFolder.getName(),
    folderUrl: sourceFolder.getUrl(),
    outputUrl: signedFolder.getUrl(),
    files: files.map(function(file) {
      return { id: file.getId(), name: file.getName(), pdfName: signedPdfName_(file.getName()) };
    }),
  };
}

function signDocumentBatch(folderId, fileIds) {
  requireAuthorizedUser_();
  const cleanFolderId = cleanDriveId_(folderId);
  if (!Array.isArray(fileIds) || !fileIds.length || fileIds.length > 3) {
    throw new Error("El lote de documentos para firma no tiene el formato esperado.");
  }

  const sourceFolder = DriveApp.getFolderById(cleanFolderId);
  const signedFolder = getOrCreateFolder_(sourceFolder, SIGNED_FOLDER_NAME);
  const signatureBlob = getAishaSignatureBlob_();
  const results = fileIds.map(function(fileId) {
    const sourceFile = DriveApp.getFileById(cleanDriveId_(fileId));
    if (!fileBelongsToFolder_(sourceFile, cleanFolderId)) {
      throw new Error("El documento " + sourceFile.getName() + " no pertenece directamente a la carpeta seleccionada.");
    }
    if (sourceFile.getMimeType() !== DOCX_MIME) {
      throw new Error(sourceFile.getName() + " no es un documento Word .docx.");
    }
    return signWordDocument_(signedFolder, sourceFile, signatureBlob);
  });

  return { outputUrl: signedFolder.getUrl(), results: results };
}

function verifySignedDocuments(folderId, expectedPdfNames) {
  requireAuthorizedUser_();
  const sourceFolder = DriveApp.getFolderById(cleanDriveId_(folderId));
  const signedFolder = findFolder_(sourceFolder, SIGNED_FOLDER_NAME);
  if (!signedFolder) throw new Error("Drive no confirmó la carpeta " + SIGNED_FOLDER_NAME + ".");
  if (!Array.isArray(expectedPdfNames) || !expectedPdfNames.length) {
    throw new Error("No se recibieron archivos firmados para verificar.");
  }

  const missing = expectedPdfNames.filter(function(name) {
    return !signedFolder.getFilesByName(safeFilePart_(name)).hasNext();
  });
  if (missing.length) {
    throw new Error("Drive no confirmó todos los PDF firmados. Faltan: " + missing.slice(0, 4).join("; ") + (missing.length > 4 ? "; …" : ""));
  }
  return { outputUrl: signedFolder.getUrl(), verifiedCount: expectedPdfNames.length };
}

function driveFolderFromInput_(value) {
  const folderId = extractDriveFolderId_(value);
  try {
    return DriveApp.getFolderById(folderId);
  } catch (error) {
    throw new Error("No se pudo abrir la carpeta compartida. Verifica el enlace y el permiso de Editor.");
  }
}

function extractDriveFolderId_(value) {
  const input = clean_(value);
  const urlMatch = input.match(/\/folders\/([A-Za-z0-9_-]+)/);
  const rawId = /^[A-Za-z0-9_-]{10,}$/.test(input) ? input : "";
  const folderId = urlMatch ? urlMatch[1] : rawId;
  if (!folderId) {
    throw new Error("Pega un enlace válido de una carpeta de Google Drive.");
  }
  return folderId;
}

function cleanDriveId_(value) {
  const id = clean_(value);
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) throw new Error("El identificador de Drive no es válido.");
  return id;
}

function listWordFiles_(folder) {
  const iterator = folder.getFiles();
  const files = [];
  while (iterator.hasNext()) {
    const file = iterator.next();
    if (file.getMimeType() === DOCX_MIME && !/^\.?TEMP FIRMA /i.test(file.getName())) files.push(file);
  }
  files.sort(function(left, right) { return left.getName().localeCompare(right.getName()); });
  return files;
}

function signedPdfName_(wordName) {
  const cleanName = safeFilePart_(wordName);
  return /\.docx$/i.test(cleanName) ? cleanName.replace(/\.docx$/i, ".pdf") : cleanName + ".pdf";
}

function fileBelongsToFolder_(file, folderId) {
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) return true;
  }
  return false;
}

function getAishaSignatureBlob_() {
  const properties = PropertiesService.getScriptProperties();
  const internalBase64 = clean_(properties.getProperty(AISHA_SIGNATURE_BASE64_PROPERTY));
  if (internalBase64) {
    try {
      const bytes = Utilities.base64Decode(internalBase64);
      if (!bytes || !bytes.length) throw new Error("La firma interna está vacía.");
      return Utilities.newBlob(bytes, "image/png", "Firma_Aisha_Tizon.png");
    } catch (error) {
      throw new Error("No se pudo leer la firma interna protegida de Aisha. Solicita al administrador volver a configurarla.");
    }
  }

  const fileId = clean_(properties.getProperty(AISHA_SIGNATURE_FILE_ID_PROPERTY));
  if (!fileId) {
    throw new Error("La firma de Aisha todavía no está configurada. Solicita al administrador completar la configuración protegida.");
  }
  try {
    const file = DriveApp.getFileById(cleanDriveId_(fileId));
    const blob = file.getBlob();
    if (!/^image\/(png|jpeg)$/i.test(blob.getContentType())) {
      throw new Error("La firma configurada debe ser una imagen PNG o JPG.");
    }
    return blob;
  } catch (error) {
    if (/debe ser una imagen/.test(String(error && error.message))) throw error;
    throw new Error("No se pudo leer la firma protegida de Aisha. Revisa el archivo configurado en Drive.");
  }
}

function signWordDocument_(signedFolder, sourceFile, signatureBlob) {
  const pdfName = signedPdfName_(sourceFile.getName());
  let temporaryDoc;
  try {
    temporaryDoc = Drive.Files.create({
      name: ".TEMP FIRMA " + new Date().getTime() + " " + sourceFile.getName(),
      mimeType: GOOGLE_DOCS_MIME,
    }, sourceFile.getBlob(), { fields: "id", supportsAllDrives: true });

    const document = DocumentApp.openById(temporaryDoc.id);
    const inserted = insertSignatureAboveSigner_(document, signatureBlob);
    if (!inserted) {
      throw new Error(sourceFile.getName() + " no contiene la línea de firma de Kety Jáuregui, Ph.D.");
    }
    document.saveAndClose();
    const pdfFile = upsertFile_(signedFolder, pdfName, exportBlob_(temporaryDoc.id, MimeType.PDF, pdfName));
    return { sourceName: sourceFile.getName(), pdfName: pdfName, pdfUrl: pdfFile.getUrl(), signatures: inserted };
  } finally {
    if (temporaryDoc && temporaryDoc.id) DriveApp.getFileById(temporaryDoc.id).setTrashed(true);
  }
}

function insertSignatureAboveSigner_(document, signatureBlob) {
  const sections = [document.getBody(), document.getHeader(), document.getFooter()].filter(function(section) { return Boolean(section); });
  for (let index = 0; index < sections.length; index += 1) {
    const paragraph = findSignerParagraph_(sections[index]);
    if (!paragraph) continue;
    const parent = paragraph.getParent();
    if (!parent || typeof parent.insertParagraph !== "function") {
      throw new Error("No se pudo insertar la firma encima del nombre de Kety Jáuregui.");
    }

    const signerIndex = parent.getChildIndex(paragraph);
    const previous = signerIndex > 0 ? parent.getChild(signerIndex - 1) : null;
    const reusableBlank = previous &&
      (previous.getType() === DocumentApp.ElementType.PARAGRAPH || previous.getType() === DocumentApp.ElementType.LIST_ITEM) &&
      !clean_(previous.getText());
    const signatureParagraph = reusableBlank ? previous : parent.insertParagraph(signerIndex, "");
    signatureParagraph.clear();
    signatureParagraph.setAttributes(paragraph.getAttributes());
    signatureParagraph.setAlignment(paragraph.getAlignment() || DocumentApp.HorizontalAlignment.LEFT);
    signatureParagraph.setSpacingBefore(0).setSpacingAfter(2);
    signatureParagraph.setLeftIndent(0).setIndentStart(0).setIndentFirstLine(0);
    const image = signatureParagraph.appendInlineImage(signatureBlob.copyBlob());
    image.setWidth(SIGNATURE_WIDTH_PX).setHeight(SIGNATURE_HEIGHT_PX);
    return 1;
  }
  return 0;
}

function findSignerParagraph_(section) {
  let match = section.findText("Kety J");
  while (match) {
    let paragraph = match.getElement();
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH && paragraph.getType() !== DocumentApp.ElementType.LIST_ITEM) {
      paragraph = paragraph.getParent();
    }
    if (paragraph && normalize_(paragraph.getText()).indexOf(SIGNATURE_ANCHOR) >= 0) return paragraph;
    match = section.findText("Kety J", match);
  }
  return null;
}

function activeUserEmail_() {
  return clean_(Session.getActiveUser().getEmail()).toLowerCase();
}

function isAuthorizedEmail_(email) {
  return AUTHORIZED_EMAILS.indexOf(clean_(email).toLowerCase()) >= 0;
}

function requireAuthorizedUser_() {
  const email = activeUserEmail_();
  if (!isAuthorizedEmail_(email)) {
    throw new Error("Esta cuenta de Google no está autorizada para usar Automatizaciones del VRA.");
  }
  return email;
}

function unauthorizedHtml_(email) {
  const account = email
    ? "La cuenta <strong>" + escapeHtml_(email) + "</strong> no está incluida en la lista de acceso."
    : "Google no pudo identificar el correo de la cuenta activa.";
  return '<!doctype html><html lang="es"><head><base target="_top"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><style>' +
    ':root{--guindo:#7a1730;--tinta:#271a1f;--suave:#75686d;--borde:#e5dadd}' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;' +
    'background:radial-gradient(circle at 80% 10%,#f0dce2 0,transparent 30%),#f8f4f5;' +
    'font-family:Arial,Helvetica,sans-serif;color:var(--tinta)}main{width:min(520px,100%);padding:38px;' +
    'border:1px solid var(--borde);border-radius:24px;background:#fff;box-shadow:0 22px 70px rgba(78,20,37,.12);text-align:center}' +
    '.mark{width:54px;height:54px;margin:0 auto 20px;display:grid;place-items:center;border-radius:16px;' +
    'background:var(--guindo);color:#fff;font-weight:900;font-size:22px}h1{margin:0;font-size:30px;letter-spacing:-.04em}' +
    'p{margin:15px 0 0;color:var(--suave);font-size:14px;line-height:1.6}strong{color:var(--tinta)}' +
    '.note{margin-top:22px;padding:14px;border-radius:13px;background:#f8eef1;color:var(--guindo);font-size:12px}' +
    '</style></head><body><main><div class="mark">A</div><h1>Acceso no autorizado</h1><p>' + account + '</p>' +
    '<p class="note">Ingresa con una cuenta autorizada por el Vicerrectorado Académico.</p></main></body></html>';
}

function escapeHtml_(value) {
  return clean_(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseWorkbook_(workbook) {
  const groupsByKey = {};
  const groupOrder = [];

  workbook.getSheets().forEach(function(sheet) {
    const sheetName = sheet.getName();
    const rows = sheet.getDataRange().getValues();
    const headerRowIndex = rows.findIndex(function(row) {
      const headers = row.map(normalize_);
      return headers.indexOf("NGRUPO") >= 0 && headers.indexOf("NACTA") >= 0;
    });
    if (headerRowIndex < 0) return;

    const columns = buildColumnMap_(rows[headerRowIndex]);
    rows.slice(headerRowIndex + 1).forEach(function(row) {
      const groupLabel = text_(valueAt_(row, columns.group));
      if (!groupLabel) return;

      const key = sheetName + "::" + groupLabel;
      if (!groupsByKey[key]) {
        groupsByKey[key] = {
          group: groupLabel,
          careerFolder: sheetName,
          actNumber: "",
          faculty: facultyFor_(sheetName),
          title: "",
          hour: "",
          day: "",
          month: "",
          year: "",
          professionalTitle: "",
          members: [],
          advisor: { name: "", dni: "", gender: "" },
          jurors: [{ name: "", dni: "" }, { name: "", dni: "" }],
        };
        groupOrder.push(key);
      }

      const group = groupsByKey[key];
      group.actNumber = mergeFirst_(group.actNumber, valueAt_(row, columns.actNumber));
      group.title = mergeFirst_(group.title, valueAt_(row, columns.title));
      group.advisor.name = mergeFirst_(group.advisor.name, valueAt_(row, columns.advisorName));
      group.advisor.dni = mergeFirst_(group.advisor.dni, valueAt_(row, columns.advisorDni), function(value) { return identifier_(value, 8); });
      group.advisor.gender = mergeFirst_(group.advisor.gender, valueAt_(row, columns.advisorGender));
      group.jurors[0].name = mergeFirst_(group.jurors[0].name, valueAt_(row, columns.juror1Name));
      group.jurors[0].dni = mergeFirst_(group.jurors[0].dni, valueAt_(row, columns.juror1Dni), function(value) { return identifier_(value, 8); });
      group.jurors[1].name = mergeFirst_(group.jurors[1].name, valueAt_(row, columns.juror2Name));
      group.jurors[1].dni = mergeFirst_(group.jurors[1].dni, valueAt_(row, columns.juror2Dni), function(value) { return identifier_(value, 8); });

      const schedule = parseSchedule_(valueAt_(row, columns.schedule), group.actNumber);
      group.hour = group.hour || schedule.hour;
      group.day = group.day || schedule.day;
      group.month = group.month || schedule.month;
      group.year = group.year || schedule.year;

      const memberName = text_(valueAt_(row, columns.memberName));
      if (memberName) {
        group.members.push({
          name: memberName,
          career: text_(valueAt_(row, columns.careerCode)),
          careerName: text_(valueAt_(row, columns.careerName)),
          studentCode: identifier_(valueAt_(row, columns.studentCode), 8),
          dni: identifier_(valueAt_(row, columns.memberDni), 8),
          startDate: text_(valueAt_(row, columns.startDate)),
        });
      }
    });
  });

  const result = groupOrder.map(function(key) { return groupsByKey[key]; });
  if (!result.length) {
    throw new Error("No se encontraron hojas de carrera con las columnas N° GRUPO y N° ACTA.");
  }

  const errors = [];
  result.forEach(function(group) {
    group.professionalTitle = professionalTitleFor_(group.members);
    const missing = [];
    if (!group.actNumber) missing.push("N° de acta");
    if (!group.title) missing.push("título");
    if (!group.hour || !group.day || !group.month || !group.year) missing.push("día/horario");
    if (!group.members.length) missing.push("integrantes");
    if (group.members.length > 4) missing.push("máximo 4 integrantes");
    if (group.members.some(function(member) { return !member.career || !member.studentCode || !member.dni || !member.startDate; })) {
      missing.push("datos completos de integrantes");
    }
    if (!group.advisor.name || !group.advisor.dni) missing.push("asesor y DNI");
    if (group.jurors.some(function(juror) { return !juror.name || !juror.dni; })) missing.push("jurados y DNI");
    if (missing.length) errors.push(group.careerFolder + " · " + group.group + ": " + missing.join(", "));
  });
  if (errors.length) {
    throw new Error("Hay grupos incompletos en el Excel: " + errors.slice(0, 4).join("; ") + (errors.length > 4 ? "; …" : ""));
  }
  return result;
}

function generateAct_(periodFolder, group) {
  const careerFolder = getOrCreateFolder_(periodFolder, safeFolderName_(group.careerFolder));
  const wordsFolder = getOrCreateFolder_(careerFolder, "WORDS");
  const pdfsFolder = getOrCreateFolder_(careerFolder, "PDFS");
  const safeActNumber = safeFilePart_(group.actNumber);
  const wordName = "ACTA N° " + safeActNumber + ".docx";
  const pdfName = "ACTA N° " + safeActNumber + ".pdf";
  let temporaryDoc;

  try {
    temporaryDoc = DriveApp.getFileById(TEMPLATE_ID).makeCopy("TEMP ACTA " + safeActNumber, wordsFolder);
    const document = DocumentApp.openById(temporaryDoc.getId());
    const body = document.getBody();
    const replacements = replacementsFor_(group);
    Object.keys(replacements).forEach(function(marker) {
      body.replaceText(escapeRegex_(marker), replacements[marker]);
    });
    fillAdvisor_(body, group.advisor || {});
    const memberCount = (group.members || []).length;
    trimMemberTable_(body, memberCount);
    placeObservationsOnSecondPage_(body, memberCount);
    const header = document.getHeader();
    if (header) header.replaceText(escapeRegex_("@@ACTA@@"), clean_(group.actNumber));
    document.saveAndClose();

    const wordFile = upsertFile_(wordsFolder, wordName, exportBlob_(temporaryDoc.getId(), DOCX_MIME, wordName));
    const pdfFile = upsertFile_(pdfsFolder, pdfName, exportBlob_(temporaryDoc.getId(), MimeType.PDF, pdfName));
    return {
      actNumber: clean_(group.actNumber),
      careerFolder: clean_(group.careerFolder),
      wordUrl: wordFile.getUrl(),
      pdfUrl: pdfFile.getUrl(),
    };
  } finally {
    if (temporaryDoc) temporaryDoc.setTrashed(true);
  }
}

function replacementsFor_(group) {
  const jurors = group.jurors || [];
  const advisor = group.advisor || {};
  const values = {
    "@@FAC@@": clean_(group.faculty),
    "@@TITULO@@": clean_(group.title),
    "@@HORA@@": clean_(group.hour),
    "@@DIA@@": clean_(group.day),
    "@@MES@@": clean_(group.month),
    "@@ANIO@@": clean_(group.year),
    "@@PROF@@": clean_(group.professionalTitle),
    "@@AN@@": clean_(advisor.name).toUpperCase(),
    "@@AD@@": clean_(advisor.dni),
    "@@J1N@@": clean_((jurors[0] || {}).name),
    "@@J1D@@": clean_((jurors[0] || {}).dni),
    "@@J2N@@": clean_((jurors[1] || {}).name),
    "@@J2D@@": clean_((jurors[1] || {}).dni),
  };
  for (let index = 0; index < 4; index += 1) {
    const member = (group.members || [])[index] || {};
    const number = index + 1;
    values["@@M" + number + "N@@"] = clean_(member.name);
    values["@@M" + number + "C@@"] = clean_(member.career);
    values["@@M" + number + "COD@@"] = clean_(member.studentCode);
    values["@@M" + number + "DNI@@"] = clean_(member.dni);
    values["@@M" + number + "F@@"] = clean_(member.startDate);
  }
  return values;
}

function fillAdvisor_(body, advisor) {
  const match = body.findText("Asesorados por el profesor:") || body.findText("Asesorados por la profesora:");
  if (!match) throw new Error("La plantilla no contiene la línea del asesor.");

  let element = match.getElement();
  while (element && element.getType() !== DocumentApp.ElementType.PARAGRAPH) {
    element = element.getParent();
  }
  if (!element) throw new Error("No se pudo ubicar el párrafo del asesor en la plantilla.");

  const advisorName = clean_(advisor.name).toUpperCase();
  const title = advisorIsFemale_(advisor) ? "la profesora" : "el profesor";
  const prefix = "Asesorados por " + title + ": ";
  const paragraph = element.asParagraph();
  paragraph.setText(prefix + advisorName + "\t\tDNI: " + clean_(advisor.dni));
  if (advisorName) {
    paragraph.editAsText().setBold(prefix.length, prefix.length + advisorName.length - 1, true);
  }
}

function advisorIsFemale_(advisor) {
  const explicitGender = normalize_((advisor || {}).gender);
  if (["F", "FEMENINO", "MUJER", "PROFESORA", "ASESORA", "DRA", "DOCTORA"].indexOf(explicitGender) >= 0) return true;
  if (["M", "MASCULINO", "HOMBRE", "PROFESOR", "ASESOR", "DR", "DOCTOR"].indexOf(explicitGender) >= 0) return false;

  const normalizedName = removeDiacritics_(clean_((advisor || {}).name)).toUpperCase();
  if (/\b(PROFESORA|ASESORA|DRA|DOCTORA|SRA|SENORA)\b/.test(normalizedName)) return true;
  if (/\b(PROFESOR|ASESOR|DR|DOCTOR|SR|SENOR)\b/.test(normalizedName)) return false;

  const givenNamePart = normalizedName.indexOf(",") >= 0
    ? normalizedName.split(",").slice(1).join(" ")
    : normalizedName;
  const firstName = givenNamePart
    .replace(/[^A-Z ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(function(part) { return ["DRA", "DOCTORA", "PROFESORA", "SRA", "SENORA"].indexOf(part) < 0; })[0] || "";
  return FEMALE_ADVISOR_FIRST_NAMES.indexOf(firstName) >= 0;
}

function trimMemberTable_(body, memberCount) {
  const tables = body.getTables();
  let memberTable = null;
  for (let index = 0; index < tables.length; index += 1) {
    const table = tables[index];
    if (!table.getNumRows()) continue;
    const header = normalize_(table.getCell(0, 0).getText());
    if (header.indexOf("APELLIDOSYNOMBRES") >= 0) {
      memberTable = table;
      break;
    }
  }
  if (!memberTable) throw new Error("La plantilla no contiene la tabla de integrantes.");

  const requiredRows = Number(memberCount || 0) + 1;
  while (memberTable.getNumRows() > requiredRows) {
    memberTable.removeRow(memberTable.getNumRows() - 1);
  }
}

function placeObservationsOnSecondPage_(body, memberCount) {
  if (!shouldForceObservationsPageBreak_(memberCount)) return;

  const match = body.findText("SIN OBSERVACIONES / RECOMENDACIONES");
  if (!match) throw new Error("La plantilla no contiene la sección de observaciones.");

  let element = match.getElement();
  while (element && element.getType() !== DocumentApp.ElementType.PARAGRAPH) {
    element = element.getParent();
  }
  if (!element) throw new Error("No se pudo ubicar el inicio de la sección de observaciones.");

  const paragraph = element.asParagraph();
  const paragraphIndex = body.getChildIndex(paragraph);
  const previous = paragraphIndex > 0 ? body.getChild(paragraphIndex - 1) : null;
  const sectionStart = previous &&
    previous.getType() === DocumentApp.ElementType.PARAGRAPH &&
    !clean_(previous.asParagraph().getText())
      ? previous.asParagraph()
      : paragraph;
  const sectionStartIndex = body.getChildIndex(sectionStart);
  const beforeSection = sectionStartIndex > 0 ? body.getChild(sectionStartIndex - 1) : null;
  const alreadySeparated = paragraphHasPageBreak_(sectionStart) || (
    beforeSection &&
    beforeSection.getType() === DocumentApp.ElementType.PARAGRAPH &&
    paragraphHasPageBreak_(beforeSection.asParagraph())
  );
  if (!alreadySeparated) body.insertPageBreak(sectionStartIndex);
}

function shouldForceObservationsPageBreak_(memberCount) {
  return Number(memberCount || 0) < 4;
}

function paragraphHasPageBreak_(paragraph) {
  for (let index = 0; index < paragraph.getNumChildren(); index += 1) {
    if (paragraph.getChild(index).getType() === DocumentApp.ElementType.PAGE_BREAK) return true;
  }
  return false;
}

function upsertFile_(folder, name, blob) {
  const files = folder.getFilesByName(name);
  if (!files.hasNext()) return folder.createFile(blob.setName(name));

  const primary = files.next();
  const response = UrlFetchApp.fetch(
    "https://www.googleapis.com/upload/drive/v3/files/" + encodeURIComponent(primary.getId()) + "?uploadType=media",
    {
      method: "patch",
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      contentType: blob.getContentType(),
      payload: blob.getBytes(),
      muteHttpExceptions: true,
    }
  );
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("No se pudo actualizar " + name + ": " + response.getContentText());
  }
  while (files.hasNext()) files.next().setTrashed(true);
  return primary;
}

function exportBlob_(fileId, mimeType, name) {
  const response = UrlFetchApp.fetch(
    "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(fileId) + "/export?mimeType=" + encodeURIComponent(mimeType),
    {
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    }
  );
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("No se pudo exportar " + name + ": " + response.getContentText());
  }
  return response.getBlob().setName(name);
}

function buildColumnMap_(row) {
  const headers = row.map(normalize_);
  return {
    group: headerIndex_(headers, function(header) { return header === "NGRUPO"; }),
    studentCode: headerIndex_(headers, function(header) { return header === "CODIGODEALUMNO" || header === "CODIGO"; }),
    memberDni: headerIndex_(headers, function(header) { return header === "DNI"; }),
    memberName: headerIndex_(headers, function(header) { return header.indexOf("APELLIDOSYNOMBRESCOMPLETOSDECADAINTEGRANTE") >= 0 || header === "APELLIDOSYNOMBRES"; }),
    careerName: headerIndex_(headers, function(header) { return header === "CARRERA"; }),
    actNumber: headerIndex_(headers, function(header) { return header === "NACTA"; }),
    careerCode: headerIndex_(headers, function(header) { return header === "CARRERASIGLADEACTA"; }),
    startDate: headerIndex_(headers, function(header) { return header === "FECHADEINICIODETRAMITE" || header === "FECHAINICIOTRAMITE"; }),
    title: headerIndex_(headers, function(header) { return header.indexOf("TITULOTENTATIVO") >= 0 || header.indexOf("TEMADELTRABAJO") >= 0; }),
    advisorDni: headerIndex_(headers, function(header) { return header === "DNIASESOR" || header === "DNIDELASESOR"; }),
    advisorName: headerIndex_(headers, function(header) { return header === "ASESOR" || header === "ASESORA" || header.indexOf("NOMBREDELASESOR") >= 0; }),
    advisorGender: headerIndex_(headers, function(header) {
      return header === "GENEROASESOR" || header === "GENERODELASESOR" ||
        header === "SEXOASESOR" || header === "SEXODELASESOR" ||
        header === "TRATAMIENTOASESOR" || header === "TRATAMIENTODELASESOR";
    }),
    juror1Dni: headerIndex_(headers, function(header) { return header === "DNIJURADO1"; }),
    juror1Name: headerIndex_(headers, function(header) { return header === "JURADO1"; }),
    juror2Dni: headerIndex_(headers, function(header) { return header === "DNIJURADO2"; }),
    juror2Name: headerIndex_(headers, function(header) { return header === "JURADO2"; }),
    schedule: headerIndex_(headers, function(header) { return header.indexOf("DIAHORARIO") === 0 || header.indexOf("HORARIOOFICIAL") >= 0; }),
  };
}

function parseSchedule_(scheduleValue, actNumber) {
  if (scheduleValue instanceof Date && !isNaN(scheduleValue.getTime())) {
    return {
      hour: Utilities.formatDate(scheduleValue, "America/Lima", "HH:mm"),
      day: Utilities.formatDate(scheduleValue, "America/Lima", "d"),
      month: Object.keys(MONTHS).map(function(key) { return MONTHS[key]; })[scheduleValue.getMonth()],
      year: Utilities.formatDate(scheduleValue, "America/Lima", "yyyy"),
    };
  }
  const schedule = text_(scheduleValue);
  const normalized = removeDiacritics_(schedule).toUpperCase();
  const timeMatch = normalized.match(/\b(\d{1,2})[:.](\d{2})\b/);
  const dateMatch = normalized.match(/\b(\d{1,2})(?:\s+DE)?\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SETIEMBRE|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/);
  const yearMatch = normalized.match(/\b(20\d{2})\b/) || String(actNumber || "").match(/-(20\d{2})-/);
  return {
    hour: timeMatch ? ("0" + timeMatch[1]).slice(-2) + ":" + timeMatch[2] : "",
    day: dateMatch ? dateMatch[1] : "",
    month: dateMatch ? MONTHS[dateMatch[2]] : "",
    year: yearMatch ? yearMatch[1] : "",
  };
}

function professionalTitleFor_(members) {
  const titles = [];
  members.forEach(function(member) {
    const normalized = removeDiacritics_(member.careerName).toUpperCase();
    const value = PROFESSIONAL_TITLES[normalized] || "TÍTULO PROFESIONAL DE " + member.careerName.toUpperCase();
    if (titles.indexOf(value) < 0) titles.push(value);
  });
  return titles.join(" / ");
}

function facultyFor_(sheetName) {
  return FACULTIES[normalize_(sheetName)] || "Facultad de Ciencias Económicas y Administrativas";
}

function validatePeriod_(period) {
  if (!/^\d{4}-[12]$/.test(String(period || ""))) {
    throw new Error("El período debe usar el formato 2025-2.");
  }
}

function ensureGenerationStructure_(rootFolder, period, careerNames) {
  const periodFolder = getOrCreateFolder_(rootFolder, period);
  const created = {};
  careerNames.forEach(function(careerName) {
    const safeName = safeFolderName_(careerName);
    if (created[safeName]) return;
    const careerFolder = getOrCreateFolder_(periodFolder, safeName);
    getOrCreateFolder_(careerFolder, "WORDS");
    getOrCreateFolder_(careerFolder, "PDFS");
    created[safeName] = true;
  });
  return periodFolder;
}

function findFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : null;
}

function getOrCreateFolder_(parent, name) {
  return findFolder_(parent, name) || parent.createFolder(name);
}

function normalize_(value) {
  return removeDiacritics_(String(value === null || value === undefined ? "" : value))
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

function removeDiacritics_(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function text_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, "America/Lima", "dd/MM/yyyy");
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, "");
  return String(value === null || value === undefined ? "" : value).trim();
}

function identifier_(value, length) {
  const raw = text_(value).replace(/\.0+$/, "").replace(/\s+/g, "");
  return length && /^\d+$/.test(raw) ? (new Array(length + 1).join("0") + raw).slice(-length) : raw;
}

function headerIndex_(headers, predicate) { return headers.findIndex(predicate); }
function valueAt_(row, index) { return index >= 0 ? row[index] : null; }
function mergeFirst_(current, candidate, formatter) { return current || (formatter || text_)(candidate); }
function clean_(value) { return value === null || value === undefined ? "" : String(value).trim(); }
function safeFolderName_(value) { return clean_(value).replace(/[\\/:*?"<>|]/g, "-") || "SIN CARRERA"; }
function safeFilePart_(value) { return clean_(value).replace(/[\\/:*?"<>|]/g, "-") || "SIN-NUMERO"; }
function escapeRegex_(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
