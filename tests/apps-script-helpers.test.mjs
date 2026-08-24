import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");
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
