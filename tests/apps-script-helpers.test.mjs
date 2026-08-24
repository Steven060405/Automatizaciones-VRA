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

test("completa nombre y DNI del asesor en su párrafo", () => {
  let output = "";
  const paragraph = {
    getType: () => "PARAGRAPH",
    asParagraph: () => ({ setText: (value) => { output = value; } }),
  };
  const textElement = {
    getType: () => "TEXT",
    getParent: () => paragraph,
  };
  const body = { findText: () => ({ getElement: () => textElement }) };

  context.fillAdvisor_(body, { name: "Estuardo Victor Lu Chang Say", dni: "09303769" });

  assert.equal(
    output,
    "Asesorados por el profesor: Estuardo Victor Lu Chang Say\t\tDNI: 09303769",
  );
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
