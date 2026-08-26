import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../google-apps-script/Index.html", import.meta.url), "utf8");
const context = vm.createContext({
  console,
  DocumentApp: { ElementType: { PAGE_BREAK: "PAGE_BREAK", PARAGRAPH: "PARAGRAPH" } },
});
vm.runInContext(source, context);

test("reduce la tabla al encabezado más los alumnos reales", () => {
  let rows = 5;
  const table = {
    getNumRows: () => rows,
    getCell: () => ({ getText: () => "APELLIDOS Y NOMBRES" }),
    removeRow: (index) => {
      assert.equal(index, rows - 1);
      rows -= 1;
    },
  };
  const body = { getTables: () => [table] };

  context.trimMemberTable_(body, 2);

  assert.equal(rows, 3);
});

function createAdvisorParagraphHarness() {
  let output = "";
  const boldRanges = [];
  const paragraphValue = {
    setText(value) {
      output = value;
      return this;
    },
    editAsText: () => ({
      setBold: (start, end, value) => boldRanges.push({ start, end, value }),
    }),
  };
  const paragraphElement = {
    getType: () => "PARAGRAPH",
    asParagraph: () => paragraphValue,
  };
  const textElement = {
    getType: () => "TEXT",
    getParent: () => paragraphElement,
  };
  const body = { findText: () => ({ getElement: () => textElement }) };
  return { body, output: () => output, boldRanges };
}

test("completa el asesor varón con nombre en mayúsculas y negrita", () => {
  const harness = createAdvisorParagraphHarness();

  context.fillAdvisor_(harness.body, { name: "Estuardo Victor Lu Chang Say", dni: "09303769", gender: "M" });

  assert.equal(
    harness.output(),
    "Asesorados por el profesor: ESTUARDO VICTOR LU CHANG SAY\t\tDNI: 09303769",
  );
  assert.deepEqual(harness.boldRanges, [{ start: 28, end: 55, value: true }]);
});

test("usa profesora para una asesora y pone todo su nombre en mayúsculas y negrita", () => {
  const harness = createAdvisorParagraphHarness();

  context.fillAdvisor_(harness.body, { name: "María Elena Torres Ruiz", dni: "12345678", gender: "F" });

  assert.equal(
    harness.output(),
    "Asesorados por la profesora: MARÍA ELENA TORRES RUIZ\t\tDNI: 12345678",
  );
  assert.deepEqual(harness.boldRanges, [{ start: 29, end: 51, value: true }]);
});

test("reconoce automáticamente nombres femeninos si no hay columna de género", () => {
  assert.equal(context.advisorIsFemale_({ name: "Ingrid Zárate" }), true);
  assert.equal(context.advisorIsFemale_({ name: "Diego San Martin Villaverde" }), false);
});

test("mantiene el recuadro y las observaciones juntos en la segunda hoja", () => {
  const before = {
    getType: () => "PARAGRAPH",
    asParagraph() { return this; },
    getNumChildren: () => 0,
    getText: () => "DNI: 42405616",
  };
  const checkboxAnchor = {
    getType: () => "PARAGRAPH",
    asParagraph() { return this; },
    getNumChildren: () => 1,
    getChild: () => ({ getType: () => "POSITIONED_IMAGE" }),
    getText: () => "",
  };
  const observation = {
    getType: () => "PARAGRAPH",
    asParagraph() { return this; },
    getNumChildren: () => 1,
    getChild: () => ({ getType: () => "TEXT" }),
    getText: () => "SIN OBSERVACIONES / RECOMENDACIONES",
  };
  const textElement = {
    getType: () => "TEXT",
    getParent: () => observation,
  };
  const children = [before, checkboxAnchor, observation];
  let insertions = 0;
  const insertionIndexes = [];
  const body = {
    findText: () => ({ getElement: () => textElement }),
    getChildIndex: (child) => children.indexOf(child),
    getChild: (index) => children[index],
    insertPageBreak: (index) => {
      insertions += 1;
      insertionIndexes.push(index);
      children.splice(index, 0, {
        getType: () => "PARAGRAPH",
        asParagraph() { return this; },
        getNumChildren: () => 1,
        getChild: () => ({ getType: () => "PAGE_BREAK" }),
        getText: () => "",
      });
    },
  };

  context.placeObservationsOnSecondPage_(body);
  context.placeObservationsOnSecondPage_(body);

  assert.equal(insertions, 1);
  assert.deepEqual(insertionIndexes, [1]);
});

test("no agrega una hoja vacía cuando el grupo tiene cuatro alumnos", () => {
  let searches = 0;
  const body = {
    findText: () => {
      searches += 1;
      return null;
    },
  };

  context.placeObservationsOnSecondPage_(body, 4);

  assert.equal(context.shouldForceObservationsPageBreak_(2), true);
  assert.equal(context.shouldForceObservationsPageBreak_(3), true);
  assert.equal(context.shouldForceObservationsPageBreak_(4), false);
  assert.equal(searches, 0);
});

test("crea primero el período y las carpetas de cada carrera", () => {
  function folder(name) {
    const children = new Map();
    return {
      name,
      children,
      getFoldersByName(childName) {
        const child = children.get(childName);
        let available = Boolean(child);
        return {
          hasNext: () => available,
          next: () => {
            available = false;
            return child;
          },
        };
      },
      createFolder(childName) {
        const child = folder(childName);
        children.set(childName, child);
        return child;
      },
    };
  }

  const root = folder("root");
  const period = context.ensureGenerationStructure_(root, "2026-1", ["DERECHO", "ING", "DERECHO"]);

  assert.equal(period.name, "2026-1");
  assert.deepEqual(Array.from(period.children.keys()), ["DERECHO", "ING"]);
  for (const career of period.children.values()) {
    assert.deepEqual(Array.from(career.children.keys()), ["WORDS", "PDFS"]);
  }
});

test("prepara las carpetas antes de generar y verifica los archivos al final", () => {
  const periodPosition = indexSource.indexOf(".preparePeriod(period)");
  const analyzePosition = indexSource.indexOf(".analyzeWorkbook(base64, file.name)");
  const preparePosition = indexSource.indexOf(".prepareGeneration(period, careers)");
  const batchPosition = indexSource.indexOf(".generateBatch(period, batch)");
  const verifyPosition = indexSource.indexOf(".verifyGeneration(period, expected)");

  assert.ok(periodPosition > 0);
  assert.ok(periodPosition < analyzePosition);
  assert.ok(preparePosition > 0);
  assert.ok(batchPosition > 0);
  assert.ok(verifyPosition > batchPosition);
});

test("muestra las tres responsables y separa las automatizaciones de Aisha e Ingrid", () => {
  assert.match(indexSource, /data-person="Aisha Tizón" data-has-automations="true"/);
  assert.match(indexSource, /data-person="Ingrid Zarate" data-has-automations="true"/);
  assert.match(indexSource, /data-person="Profesora Kety Jauregui" data-has-automations="false"/);
  assert.match(indexSource, /Multitareas/);
  assert.match(indexSource, /Cursos de actualización/);
  assert.match(indexSource, /Vicerrectora Académica/);
  assert.match(indexSource, /Firma de capacitaciones/);
  assert.match(indexSource, /id="aishaAutomations"/);
  assert.match(indexSource, /id="ingridAutomations"/);
  assert.match(indexSource, /button\.dataset\.hasAutomations === 'true'/);
  assert.match(indexSource, /Aún no hay automatizaciones disponibles/);
  assert.match(indexSource, /selectedPerson !== 'Ingrid Zarate'/);
  assert.match(indexSource, /selectedPerson !== 'Aisha Tizón'/);
});

test("ubica la firma sobre Kety Jáuregui sin modificar los Word originales", () => {
  assert.equal(context.extractDriveFolderId_("https://drive.google.com/drive/folders/1LFwml0T6jwio2R0HVILBQ-GxSl1R-VqB?usp=sharing"), "1LFwml0T6jwio2R0HVILBQ-GxSl1R-VqB");
  assert.equal(context.extractDriveFolderId_("https://drive.google.com/drive/folders/1bo3ZG5V_UVSCSq_dMXAQrt27lRsKVVqj?usp=drive_link"), "1bo3ZG5V_UVSCSq_dMXAQrt27lRsKVVqj");
  assert.equal(context.signedPdfName_("Resolución final.docx"), "Resolución final.pdf");
  assert.equal(context.signedPdfName_("DOCUMENTO.DOCX"), "DOCUMENTO.pdf");
  assert.match(source, /const SIGNATURE_ANCHOR = "KETYJAUREGUIPHD"/);
  assert.match(source, /const SIGNED_FOLDER_NAME = "FIRMADOS"/);
  assert.match(source, /signatureParagraph\.appendInlineImage\(signatureBlob\.copyBlob\(\)\)/);
  assert.match(source, /signatureParagraph\.setKeepWithNext\(true\)/);
  assert.match(source, /signatureParagraph\.setSpacingBefore\(0\)\.setSpacingAfter\(0\)/);
  assert.match(source, /signatureParagraph\.setAlignment\(paragraph\.getAlignment\(\) \|\| DocumentApp\.HorizontalAlignment\.LEFT\)/);
  assert.doesNotMatch(source, /signatureParagraph\.setAlignment\(DocumentApp\.HorizontalAlignment\.CENTER\)/);
  assert.match(source, /AISHA_SIGNATURE_FILE_ID_PROPERTY/);
  assert.match(source, /AISHA_SIGNATURE_BASE64_PROPERTY/);
  assert.match(source, /insertSignatureAboveSigner_/);
  assert.match(source, /temporaryDoc\.id\)\.setTrashed\(true\)/);
  assert.doesNotMatch(source, /parents: \[sourceFolder\.getId\(\)\]/);
  assert.match(indexSource, /Los Word originales se conservan/);
  assert.match(indexSource, /Los PDF tienen el mismo nombre/);
  assert.match(indexSource, /No es necesario editar ni marcar los Word/);
  assert.match(indexSource, /function isDriveFolderUrl\(value\)/);
  assert.match(indexSource, /url\.pathname/);
  assert.doesNotMatch(indexSource, /@@FIRMA@@/);
});

test("mantiene la firma disponible para todos los correos autorizados sin compartir el archivo", () => {
  const expectedBytes = [137, 80, 78, 71];
  let requestedFile = false;
  context.PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (name) => name === "AISHA_SIGNATURE_BASE64" ? "iVBORw==" : "",
    }),
  };
  context.Utilities = {
    base64Decode: (value) => {
      assert.equal(value, "iVBORw==");
      return expectedBytes;
    },
    newBlob: (bytes, contentType, name) => ({ bytes, contentType, name }),
  };
  context.DriveApp = {
    getFileById: () => {
      requestedFile = true;
      throw new Error("No debe consultar Drive cuando existe la firma interna");
    },
  };

  const blob = context.getAishaSignatureBlob_();

  assert.deepEqual(blob.bytes, expectedBytes);
  assert.equal(blob.contentType, "image/png");
  assert.equal(blob.name, "Firma_Aisha_Tizon.png");
  assert.equal(requestedFile, false);
});

test("mantiene fija la ubicación principal de los archivos en Drive", () => {
  assert.match(indexSource, /Ubicación de archivos/);
  assert.match(indexSource, /https:\/\/drive\.google\.com\/drive\/folders\/1LFwml0T6jwio2R0HVILBQ-GxSl1R-VqB\?usp=drive_link/);
  assert.match(indexSource, /target="_blank" rel="noopener noreferrer"/);
});

test("impide publicar código fuente como si fuera la interfaz", () => {
  assert.match(source, /output\.getContent\(\)/);
  assert.match(source, /!\/\^\\s\*<!doctype html>\/i\.test\(html\)/);
  assert.match(source, /data-person="Ingrid Zarate"/);
});

test("permite únicamente los correos autorizados", () => {
  assert.equal(context.isAuthorizedEmail_("sespinoza@esan.edu.pe"), true);
  assert.equal(context.isAuthorizedEmail_("GESPINOZAR822@GMAIL.COM"), true);
  assert.equal(context.isAuthorizedEmail_("izarate@esan.edu.pe"), true);
  assert.equal(context.isAuthorizedEmail_("cursos_actualizacion@ue.edu.pe"), true);
  assert.equal(context.isAuthorizedEmail_("atizon@esan.edu.pe"), true);
  assert.equal(context.isAuthorizedEmail_("kjauregui@esan.edu.pe"), true);
  assert.equal(context.isAuthorizedEmail_("srivadeneyra@esan.edu.pe"), true);
  assert.equal(context.isAuthorizedEmail_("otro@esan.edu.pe"), false);
  assert.match(source, /const AUTHORIZED_EMAILS = \[/);
  assert.match(source, /Acceso no autorizado/);
});

test("protege todas las operaciones públicas de generación", () => {
  for (const functionName of ["getUserEmail", "analyzeWorkbook", "preparePeriod", "prepareGeneration", "generateBatch", "verifyGeneration", "prepareSignatureBatch", "signDocumentBatch", "verifySignedDocuments"]) {
    const guardedFunction = new RegExp(`function ${functionName}\\([^)]*\\) \\{\\s*(?:return )?requireAuthorizedUser_\\(\\);`);
    assert.match(source, guardedFunction);
  }
});
