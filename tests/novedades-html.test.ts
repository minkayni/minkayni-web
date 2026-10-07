/* Pies de foto que llegan en HTML desde el CMS. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { aTextoPlano } from "../src/utils/texto-plano.ts";

test("convierte párrafos HTML en líneas de texto", () => {
    const pie = "<p>Titular de la jornada 🥁</p><p></p><p>Primer párrafo con &quot;comillas&quot; &amp; más.</p><p>#Batucada</p>";
    assert.equal(aTextoPlano(pie).split("\n").filter(Boolean).join("|"), 'Titular de la jornada 🥁|Primer párrafo con "comillas" & más.|#Batucada');
});

test("respeta los saltos <br> y elimina etiquetas de formato", () => {
    assert.equal(aTextoPlano("Uno<br>Dos <strong>tres</strong>"), "Uno\nDos tres");
});

test("deja intacto el texto plano", () => {
    const pie = "Texto con a < b y 3 > 2\nSegunda línea";
    assert.equal(aTextoPlano(pie), pie);
});
