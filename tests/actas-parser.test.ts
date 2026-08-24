import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseActasWorkbook } from "../app/actas-parser.ts";

const workbookPath = process.env.ACTAS_TEST_XLSX;

test("separa el consolidado por hojas de carrera y grupos", { skip: !workbookPath }, async () => {
  const source = await readFile(workbookPath!);
  const file = new File([source], "CONSOLIDADO TEMAS GRUPO.xlsx");
  const groups = await parseActasWorkbook(file);
  const counts = Object.fromEntries(
    Array.from(new Set(groups.map((group) => group.careerFolder)))
      .map((career) => [career, groups.filter((group) => group.careerFolder === career).length]),
  );

  assert.equal(groups.length, 44);
  assert.deepEqual(counts, {
    DERECHO: 3,
    "ADM Y FIN-DPA": 7,
    "ADM Y MKT": 9,
    "ECO Y NEG": 7,
    ING: 18,
  });

  const sample = groups.find((group) => group.actNumber === "1373-2026-T");
  assert.ok(sample);
  assert.equal(sample.careerFolder, "ADM Y MKT");
  assert.equal(sample.hour, "07:30");
  assert.equal(sample.day, "22");
  assert.equal(sample.month, "junio");
  assert.equal(sample.year, "2026");
  assert.equal(sample.members.length, 4);
  assert.equal(sample.professionalTitle, "LICENCIADO (A) EN ADMINISTRACIÓN Y MARKETING");
  assert.deepEqual(sample.advisor, {
    name: "Estuardo Victor Lu Chang Say",
    dni: "09303769",
  });
  assert.deepEqual(sample.jurors, [
    { name: "Kety Lourdes Jauregui Machuca", dni: "08728982" },
    { name: "Jose Epifanio Ventura Egoavil", dni: "09849018" },
  ]);
});
