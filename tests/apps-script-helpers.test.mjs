import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");
const context = vm.createContext({
  console,
  DocumentApp: { ElementType: { PARAGRAPH: "PARAGRAPH" } },
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
