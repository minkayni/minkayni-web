// Reescribe el export de Bodymovin a un Lottie 2D que los reproductores sí soportan.
const fs = require('fs');
const src = process.argv[2] || 'data.json';
const out = process.argv[3] || require('path').join(__dirname, '../../src/assets/lottie/logo_intro.json');
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const A = Object.fromEntries(d.assets.map(a => [a.id, a]));
const clone = o => JSON.parse(JSON.stringify(o));
const BLUE = [0.247058838606, 0.662745118141, 0.960784375668, 1];
const PURPLE = [0.431372582912, 0, 0.639215707779, 1];
const CAM_DIST = 2604.7;

// ---- 1. 3D -> 2D ---------------------------------------------------------
function to2D(l) {
  if (!l.ddd) return;
  l.ddd = 0;
  const ks = l.ks;
  if (ks.rz) { ks.r = ks.rz; }
  delete ks.rx; delete ks.ry; delete ks.rz; delete ks.or;
}
d.layers.forEach(to2D);
d.assets.forEach(a => a.layers && a.layers.forEach(to2D));

// ---- 2. La cámara pasa a ser un nulo 2D: pantalla = C + k·(mundo − cam) ----
const L = Object.fromEntries(d.layers.map(l => [l.nm, l]));
const camNull = L['Nulo 2'];
const cam = L['Cámara 1'];
const zoomToScale = v => { const k = v / CAM_DIST * 100; return [k, k, 100]; };
camNull.nm = 'CAM 2D';
camNull.ks = {
  o: { a: 0, k: 0 },
  r: { a: 0, k: 0 },
  p: { a: 0, k: [d.w / 2, d.h / 2, 0] },
  a: clone(camNull.ks.p),
  s: {
    a: 1,
    k: cam.pe.k.filter(k => k.t >= 50).map(k => {
      const n = { t: k.t, s: zoomToScale(k.s[0]) };
      if (k.i) { n.i = { x: [k.i.x[0], k.i.x[0], k.i.x[0]], y: [k.i.y[0], k.i.y[0], k.i.y[0]] }; n.o = { x: [k.o.x[0], k.o.x[0], k.o.x[0]], y: [k.o.y[0], k.o.y[0], k.o.y[0]] }; }
      return n;
    }),
  },
};

// ---- 3. Degradados: capa de formas con degradado + mate alfa --------------
function gradLayer(base, ramp, ind, name) {
  const P = Object.fromEntries(ramp.ef.map(p => [p.mn, p.v]));
  return {
    ddd: 0, ind, ty: 4, nm: name, sr: 1, parent: base.parent,
    ks: Object.assign(clone(base.ks), { o: { a: 0, k: 100 } }),
    ao: 0,
    shapes: [{
      ty: 'gr', nm: 'Degradado', np: 2, cix: 2, bm: 0, hd: false,
      it: [
        { ty: 'rc', d: 1, nm: 'Rect', s: { a: 0, k: [8000, 6000] }, p: { a: 0, k: [960, 540] }, r: { a: 0, k: 0 }, hd: false },
        {
          ty: 'gf', nm: 'Relleno degradado', o: { a: 0, k: 100 }, r: 1, bm: 0, t: 1, hd: false,
          g: { p: 2, k: { a: 0, k: [0, ...BLUE.slice(0, 3), 1, ...PURPLE.slice(0, 3)] } },
          s: clone(P['ADBE Ramp-0001']), e: clone(P['ADBE Ramp-0003']),
        },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: 'Transformar' },
      ],
    }],
    ip: base.ip, op: base.op, st: base.st, bm: 0,
  };
}

const iso = L['ISOTIPO'], texto = L['TEXTO'], tag = L['TAG'];
iso.parent = 3; texto.parent = 3;

/* TEXTO es el mate del degradado. La máscara se queda en el mate, como en AE:
   sobre el degradado sus bordes se colaban como hilos de 1 px. La expansión de
   12 px va aplicada a mano porque lottie-web no la interpreta. */
const textoGrad = gradLayer(texto, texto.ef.find(e => e.mn === 'ADBE Ramp'), 22, 'TEXTO degradado');
textoGrad.tt = 1; textoGrad.tp = texto.ind;
texto.td = 1; delete texto.ef;
texto.masksProperties[0].x = { a: 0, k: 0 };
texto.masksProperties[0].pt.k.v = [[1432, 377.5], [736, 377.5], [736, 757.5], [1114.5, 757.5], [1133.5, 796.5], [1198, 796.5], [1216, 757.5], [1432, 757.5]];

// ISOTIPO: colores originales hasta el f57; encima entra el degradado (Fusionar con el original 1→0)
const isoBendFx = iso.ef.find(e => e.mn === 'CC Bend It');
const isoRamp = iso.ef.find(e => e.mn === 'ADBE Ramp');
const blend = isoRamp.ef.find(p => p.mn === 'ADBE Ramp-0007').v.k;
delete iso.ef;
const isoMatte = clone(iso); isoMatte.ind = 20; isoMatte.nm = 'ISOTIPO mate'; isoMatte.td = 1; isoMatte.ip = 50;
const isoGrad = gradLayer(iso, isoRamp, 21, 'ISOTIPO degradado');
isoGrad.ip = 50; isoGrad.tt = 1; isoGrad.tp = 20;
isoGrad.ks.o = { a: 1, k: blend.map(k => Object.assign(clone(k), { s: [(1 - k.s[0]) * 100] })) };
iso.op = 58;

// ---- 4. Efecto Relleno -> color real de las formas ------------------------
function paint(items, color) {
  for (const s of items) {
    if (s.ty === 'fl' || s.ty === 'st') s.c = { a: 0, k: color.slice() };
    if (s.it) paint(s.it, color);
  }
}
const cuerpo2 = A['cuerpo l 2 Comp. 1'].layers[0];
paint(cuerpo2.shapes, BLUE); delete cuerpo2.ef;
const tagStroke = A['TAG'].layers.find(l => l.nm === 'Capa de formas 2');
paint(tagStroke.shapes, PURPLE); delete tag.ef;
// el mate, encima de la capa que recorta (así lo entienden también los reproductores viejos)
A['TAG'].layers.sort((a, b) => (b.td || 0) - (a.td || 0));

// ---- 5. Las "n": trazo central real + un solo Recortar trazados -----------
const N_PATH = {
  c: false,
  v: [[124.9, -9.6], [124.9, -49], [92.5, -81.9], [60.1, -49], [60.1, -10.1]],
  i: [[0, 0], [0, 0], [17.9, 0], [0, -18.1], [0, 0]],
  o: [[0, 0], [0, -18.1], [-17.9, 0], [0, 0], [0, 0]],
};
for (const l of A['TEXTO'].layers.filter(l => /^n( 2)?$/.test(l.nm))) {
  const trim = l.shapes.find(s => s.ty === 'tm' && s.s.a === 1);
  const stroke = l.shapes.find(s => s.ty === 'st');
  stroke.w = { a: 0, k: 26.5 };
  l.shapes[0].it[0].ks = { a: 0, k: clone(N_PATH) };
  l.shapes = [l.shapes[0], trim, stroke];
}

// ---- 5b. CC Bend It -> keyframes de trazado --------------------------------
const { evalProp, layerMatrix, mul, bakeBends, rigBody } = require('./bend.cjs');
const bendParams = fx => {
  const P = Object.fromEntries(fx.ef.map(p => [p.mn, p.v]));
  return f => ({
    bend: [].concat(evalProp(P['CC Bend It-0001'], f))[0],
    start: evalProp(P['CC Bend It-0002'], f),
    end: evalProp(P['CC Bend It-0003'], f),
    prestart: P['CC Bend It-0004'].k,
  });
};
const isoLayers = A['ISOTIPO'].layers, animLayers = A['isotipo animado'].layers;
const bodyPrecomp = animLayers[0];                       // 'cuerpo L 2' con su propio Bend It
const body1 = A['cuerpo L 2'].layers[0];
rigBody(body1.shapes.find(g => g.nm === 'Forma 1').it.find(s => s.ty === 'sh'), 48);
const body2Layer = isoLayers.find(l => l.refId === 'cuerpo l 2 Comp. 1');
const isoL2 = isoLayers.find(l => l.refId === 'isotipo animado');
const innerBend = { params: bendParams(bodyPrecomp.ef[0]), toSpace: f => layerMatrix(body1, A['cuerpo L 2'].layers, f) };
const outerParams = bendParams(isoBendFx);
bakeBends(body1, [innerBend, {
  params: outerParams,
  toSpace: f => mul(layerMatrix(isoL2, isoLayers, f), mul(layerMatrix(bodyPrecomp, animLayers, f), layerMatrix(body1, A['cuerpo L 2'].layers, f))),
}], 0, 94);
bakeBends(cuerpo2, [{
  params: outerParams,
  toSpace: f => mul(layerMatrix(body2Layer, isoLayers, f), layerMatrix(cuerpo2, A['cuerpo l 2 Comp. 1'].layers, f)),
}], 52, 94);

// ---- 6. Limpieza ----------------------------------------------------------
function stripEffects(l) { if (l.ef) delete l.ef; }
d.assets.forEach(a => a.layers && a.layers.forEach(stripEffects));
d.layers = [camNull, isoMatte, isoGrad, iso, texto, textoGrad, tag];
d.ddd = 0;

// 3 decimales bastan; más precisión solo engorda el archivo
fs.writeFileSync(out, JSON.stringify(d, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v)));
console.log('ok', out, fs.statSync(out).size, 'bytes');
