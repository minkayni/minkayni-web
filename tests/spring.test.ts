import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SPRINGS, project, rubberband, SpringChain, springEase, springLinear, stepSpring, VelocityTracker } from "../src/scripts/spring";

test("todo resorte empieza en 0, acaba en 1 y queda quieto", () => {
  for (const cfg of Object.values(SPRINGS)) {
    const { ease, duration } = springEase(cfg);
    assert.equal(ease(0), 0);
    assert.equal(ease(1), 1);
    assert.ok(Math.abs(ease(0.999) - 1) < 0.002, "salta al final");
    assert.ok(duration > 0.2 && duration < 1.5, `asentado fuera de rango: ${duration}`);
  }
});

test("sin rebote no se pasa del destino; con rebote sí, pero con contención", () => {
  const peak = (cfg: (typeof SPRINGS)[keyof typeof SPRINGS]) => {
    const { ease } = springEase(cfg);
    let max = 0;
    for (let i = 0; i <= 400; i++) max = Math.max(max, ease(i / 400));
    return max;
  };
  assert.ok(peak(SPRINGS.smooth) <= 1 + 1e-6);
  assert.ok(peak(SPRINGS.snappy) > 1.01);
  for (const cfg of Object.values(SPRINGS)) assert.ok(peak(cfg) < 1.2, "rebote desmedido");
});

test("el paso analítico es exacto aunque el paso sea grande", () => {
  const cfg = SPRINGS.snappy;
  let [x1, v1] = [-1, 0];
  for (let i = 0; i < 100; i++) [x1, v1] = stepSpring(cfg, x1, v1, 0.002);
  const [x2, v2] = stepSpring(cfg, -1, 0, 0.2);
  assert.ok(Math.abs(x1 - x2) < 1e-9 && Math.abs(v1 - v2) < 1e-7);
});

test("la velocidad heredada adelanta el movimiento", () => {
  const still = springEase(SPRINGS.smooth, 0).ease(0.1);
  const thrown = springEase(SPRINGS.smooth, 4).ease(0.1);
  assert.ok(thrown > still);
});

test("las curvas --ease-spring-* de global.css salen del generador", () => {
  const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
  for (const [name, cfg] of Object.entries(SPRINGS)) {
    const { easing, duration } = springLinear(cfg);
    assert.ok(css.includes(`--ease-spring-${name}: ${easing};`), `--ease-spring-${name} desactualizada: regenerar con tools/springs.ts`);
    assert.ok(css.includes(`--spring-${name}-duration: ${duration}ms;`), `--spring-${name}-duration desactualizada`);
  }
});

test("proyección, rubber-band y velocidad del puntero", () => {
  assert.equal(project(0), 0);
  assert.ok(project(1000) > 400 && project(1000) < 600);
  /* Cede cada vez menos: nunca llega a recorrer la dimensión entera. */
  assert.ok(rubberband(100, 300) < 100 && rubberband(10000, 300) < 300);
  const vt = new VelocityTracker();
  vt.add(0, 0, 0);
  vt.add(50, 0, 50);
  assert.equal(vt.velocity(50).x, 1000);
  assert.equal(vt.velocity(400).x, 0);
});

test("cadena: tirar de un eslabón arrastra a los vecinos con menos amplitud y al soltar vuelve al reposo", () => {
  const chain = new SpringChain(9, { response: 0.55, bounce: 0.45, coupling: 2.5 }, () => {});
  chain.pull(4, -20);
  chain.step(0.6);
  const y = Array.from(chain.y);
  assert.ok(y[4] < -10, `el eslabón sostenido no sube: ${y[4]}`);
  assert.ok(y[3] < 0 && y[3] > y[4], "el vecino no acompaña o pasa al sostenido");
  assert.ok(y[2] > y[3] && y[1] > y[2], "la amplitud no decae a lo largo de la cadena");
  assert.ok(Math.abs(y[3] - y[5]) < 1e-9, "la cadena no es simétrica");
  chain.release();
  chain.step(4);
  assert.ok(chain.atRest, "la cadena no se asienta");
});

test("cadena: un paso largo (pestaña en segundo plano) no la hace explotar", () => {
  const chain = new SpringChain(20, { response: 0.55, bounce: 0.45, coupling: 2.5 }, () => {});
  chain.impulse(10, -800);
  chain.step(0.064);
  assert.ok(Array.from(chain.y).every((v) => Number.isFinite(v) && Math.abs(v) < 100));
});
