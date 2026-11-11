/* Single-diagram renderer. No form, transform, or automatic initialization. */
(() => {
'use strict';
let diagramCount = 0;
const C = (r, i = 0) => ({ r, i }), add = (a, b) => C(a.r + b.r, a.i + b.i), neg = a => C(-a.r, -a.i), mul = (a, b) => C(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r), mag = a => Math.hypot(a.r, a.i);
const div = (a, b) => { const d = b.r * b.r + b.i * b.i; return C((a.r * b.r + a.i * b.i) / d, (a.i * b.r - a.r * b.i) / d) }, exp = a => C(Math.exp(a.r) * Math.cos(a.i), Math.exp(a.r) * Math.sin(a.i)), log = a => C(Math.log(mag(a)), Math.atan2(a.i === 0 ? 0 : a.i, a.r));
const pow = (a, b) => { if (a.r === 0 && a.i === 0) { if (b.i === 0 && b.r > 0) return C(0); if (b.r === 0 && b.i === 0) return C(1) } return exp(mul(b, log(a))) };
const funcs = { exp, log, sqrt: a => pow(a, C(.5)), abs: a => C(mag(a)), conj: a => C(a.r, -a.i), re: a => C(a.r), im: a => C(a.i), sin: a => C(Math.sin(a.r) * Math.cosh(a.i), Math.cos(a.r) * Math.sinh(a.i)), cos: a => C(Math.cos(a.r) * Math.cosh(a.i), -Math.sin(a.r) * Math.sinh(a.i)), rect: a => { if (a.i) throw Error('rect requires a real argument.'); return C(Math.abs(a.r) <= .5 ? 1 : 0) }, sinc: a => mag(a) < 1e-8 ? C(1) : div(funcs.sin(a), a) };
function compile(source) {
    if (source.length > 600) throw Error('Please keep expressions under 600 characters.');
    const tokens = []; let pos = 0;
    while (pos < source.length) { const m = /^\s*(?:(\d*\.\d+|\d+\.?\d*)(?:[eE]([+-]?\d+))?|([A-Za-z]+)|([+\-*/^()]))/.exec(source.slice(pos)); if (!m) { if (!source.slice(pos).trim()) break; throw Error('Unexpected character near ' + source.slice(pos, pos + 12)); } tokens.push(m[1] ? { n: Number(m[1] + (m[2] ? 'e' + m[2] : '')) } : m[3] || m[4]); pos += m[0].length; }
    let at = 0; const take = () => tokens[at++], peek = () => tokens[at];
    function atom() { const t = take(); if (t && typeof t === 'object') return () => C(t.n); if (t === 'x') return x => C(x); if (t === 'i') return () => C(0, 1); if (t === 'pi') return () => C(Math.PI); if (t === 'e') return () => C(Math.E); if (t === '(') { const a = sum(); if (take() !== ')') throw Error('Missing closing parenthesis.'); return a; } if (typeof t === 'string' && Object.hasOwn(funcs, t)) { if (take() !== '(') throw Error('Use ' + t + '(...).'); const a = sum(); if (take() !== ')') throw Error('Missing closing parenthesis.'); return x => funcs[t](a(x)); } throw Error('Expected a number, x, constant, or supported function.'); }
    function power() { const a = atom(); if (peek() === '^') { take(); const b = unary(); return x => pow(a(x), b(x)); } return a; }
    function unary() { if (peek() === '+' || peek() === '-') { const op = take(), a = unary(); return op === '-' ? x => neg(a(x)) : a; } return power(); }
    function product() { let a = unary(); while (peek() === '*' || peek() === '/') { const op = take(), left = a, b = unary(); a = x => (op === '*' ? mul : div)(left(x), b(x)); } return a; }
    function sum() { let a = product(); while (peek() === '+' || peek() === '-') { const op = take(), left = a, b = product(); a = x => add(left(x), op === '-' ? neg(b(x)) : b(x)); } return a; }
    const f = sum(); if (at !== tokens.length) throw Error('Unexpected token. Use * for multiplication.'); return f;
}
function plot(svg, xs, vs, minimum, maximum, yrange, { grid = true, axisLabels = true, mainAxes = true } = {}) {
    const id = svg.id, NS = 'http://www.w3.org/2000/svg';
    svg.replaceChildren();
    const el = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; svg.append(e); return e; };
    const series = [vs.map(v => v.r), vs.map(v => v.i), vs.map(v => v.r * v.r + v.i * v.i)];
    let low = 0, high = 0;
    for (const values of series) {
        for (const value of values) {
            low = Math.min(low, value);
            high = Math.max(high, value);
        }
    }
    const padding = (high - low) * .08 || 1;
    if (low < 0) low -= padding;
    high += padding;
    if (yrange) [low, high] = yrange;
    const defs = el('defs', {}), clip = document.createElementNS(NS, 'clipPath'), rect = document.createElementNS(NS, 'rect'); clip.id = id + '-clip'; for (const [key, value] of Object.entries({ x: 58, y: 20, width: 560, height: 270 })) rect.setAttribute(key, value); clip.append(rect); defs.append(clip);
    const X = x => 58 + (x - minimum) / (maximum - minimum) * 560, Y = y => 290 - (y - low) / (high - low) * 270;
    for (let j = 0; j <= 4; j++) {
        const v = low + (high - low) * j / 4, y = Y(v);
        if (grid) el('line', { x1: 58, x2: 618, y1: y, y2: y, stroke: '#333' });
        if (axisLabels) el('text', { x: 50, y: y + 4, 'text-anchor': 'end', fill: '#999', 'font-size': 11, style: '-webkit-user-select: none; user-select: none;' }, v.toFixed(2));
    }
    for (let j = 0; j <= 10; j++) {
        const x = minimum + (maximum - minimum) * j / 10;
        if (grid) el('line', { x1: X(x), x2: X(x), y1: 20, y2: 290, stroke: '#333' });
        if (axisLabels) el('text', { x: X(x), y: 312, 'text-anchor': 'middle', fill: '#999', 'font-size': 11, style: '-webkit-user-select: none; user-select: none;' }, Number(x.toFixed(2)));
    }
    if (mainAxes && low <= 0 && high >= 0) el('line', { x1: 58, x2: 618, y1: Y(0), y2: Y(0), stroke: '#666' }); if (mainAxes && minimum < 0 && maximum > 0) el('line', { x1: X(0), x2: X(0), y1: 20, y2: 290, stroke: '#666' });
    series.forEach((s, j) => el('path', { d: s.map((v, k) => (k ? 'L' : 'M') + X(xs[k]).toFixed(2) + ',' + Y(v).toFixed(2)).join(' '), fill: 'none', 'clip-path': 'url(#' + id + '-clip)', stroke: ['var(--real)', 'var(--imag)', 'var(--density)'][j], 'stroke-width': 2, ...(j === 1 ? { 'stroke-dasharray': '6 4' } : {}) }));
    // Draw last so the legend remains legible above the plotted curves.
    el('rect', { x: 475, y: 27, width: 135, height: 72,
        fill: 'var(--background-color)', 'fill-opacity': .94 });
    ['Real', 'Imaginary', 'Probability'].forEach((label, j) => {
        const y = 43 + j * 21;
        const color = ['var(--real)', 'var(--imag)', 'var(--density)'][j];
        el('line', { x1: 485, x2: 510, y1: y, y2: y, stroke: color,
            'stroke-width': 2, ...(j === 1 ? { 'stroke-dasharray': '6 4' } : {}) });
        el('text', { x: 518, y: y + 4, fill: color, 'font-size': 12,
            style: '-webkit-user-select: none; user-select: none;' }, label);
    });
}


function validateRange(range, name) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite) ||
        range[0] >= range[1] || !Number.isFinite(range[1] - range[0])) {
        throw new Error(`${name} must be a finite [minimum, maximum] pair.`);
    }
}

/** Draw ONE diagram. psi: expression, callback, or { xs, values } samples.
 * Callback values: real numbers or complex { r, i } objects.
 * yrange: [min, max], or null for automatic scaling. No normalization is applied.
 * config: { grid: true, axisLabels: true, mainAxes: true }; set an option to false to hide it.
 */
function drawWavefunction(id, psi, xrange = [-5, 5], yrange = null, config = {}) {
    const target = document.getElementById(id);
    if (!target) throw new Error(`Diagram element not found: ${id}`);
    validateRange(xrange, 'xrange');
    if (yrange !== null) validateRange(yrange, 'yrange');
    let xs, values;
    if (typeof psi === 'string') psi = compile(psi);
    if (typeof psi === 'function') {
        xs = Array.from({ length: 1024 }, (_, j) =>
            xrange[0] + (j + .5) * (xrange[1] - xrange[0]) / 1024);
        values = xs.map(x => psi(x));
    } else if (psi && Array.isArray(psi.xs) && Array.isArray(psi.values)) {
        xs = psi.xs;
        values = psi.values;
    } else {
        throw new Error('psi must be an expression, a function, or { xs, values } samples.');
    }
    if (xs.length < 2 || xs.length !== values.length ||
        xs.some((x, j) => !Number.isFinite(x) || (j > 0 && x <= xs[j - 1]))) {
        throw new Error('Samples must have matching lengths and increasing finite x values.');
    }
    values = values.map(value => typeof value === 'number' ? C(value) : value);
    if (values.some(v => !v || !Number.isFinite(v.r) || !Number.isFinite(v.i) ||
        !Number.isFinite(v.r * v.r + v.i * v.i))) {
        throw new Error('psi must return finite real numbers or complex { r, i } values.');
    }
    const svg = target.tagName.toLowerCase() === 'svg' ? target :
        document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (svg !== target) svg.id = `fourier-diagram-${++diagramCount}`;
    svg.classList.add('fourier-diagram');
    svg.setAttribute('viewBox', '0 0 640 340');
    svg.setAttribute('role', 'img');
    if (!svg.hasAttribute('aria-label')) svg.setAttribute('aria-label', 'Wavefunction diagram');
    plot(svg, xs, values, xrange[0], xrange[1], yrange, config);
    if (svg !== target) target.replaceChildren(svg);
    return svg;
}
/** Return the Fourier transform of psi as a callable k => { r, i }.
 * Normalize psi over xrange, using 1024 midpoint samples and 1/sqrt(2*pi).
 */
function transform(psi, xrange = [-5, 5]) {
    validateRange(xrange, 'xrange');
    const evaluate = typeof psi === 'string' ? compile(psi) : psi;
    if (typeof evaluate !== 'function') throw new Error('psi must be an expression or a function.');
    const samples = 1024, dx = (xrange[1] - xrange[0]) / samples;
    const xs = [], values = [];
    let norm = 0;
    for (let j = 0; j < samples; j++) {
        const x = xrange[0] + (j + .5) * dx;
        const value = evaluate(x);
        const v = typeof value === 'number' ? C(value) : value;
        if (!v || !Number.isFinite(v.r) || !Number.isFinite(v.i)) {
            throw new Error('psi must return finite real numbers or complex { r, i } values.');
        }
        xs.push(x);
        values.push(C(v.r, v.i));
        norm += (v.r * v.r + v.i * v.i) * dx;
    }
    if (!(norm > 0) || !Number.isFinite(norm)) {
        throw new Error('Wavefunction must have a finite, nonzero norm on this interval.');
    }
    const scale = 1 / Math.sqrt(norm);
    values.forEach(v => { v.r *= scale; v.i *= scale; });
    const nyquist = Math.PI / dx;
    function transformed(k) {
        if (!Number.isFinite(k)) throw new Error('k must be finite.');
        if (Math.abs(k) >= nyquist) {
            throw new Error('Reduce |k| below ' + nyquist.toPrecision(4) +
                ' or narrow the x interval (Nyquist limit).');
        }
        let r = 0, i = 0;
        for (let j = 0; j < samples; j++) {
            const angle = k * xs[j], c = Math.cos(angle), s = Math.sin(angle);
            const v = values[j];
            r += v.r * c + v.i * s;
            i += v.i * c - v.r * s;
        }
        return C(r * dx / Math.sqrt(2 * Math.PI), i * dx / Math.sqrt(2 * Math.PI));
    }
    // Expose the normalized input samples for a matching position-space diagram.
    transformed.position = { xs, values };
    transformed.nyquist = nyquist;
    return transformed;
}
window.drawWavefunction = drawWavefunction;
window.transform = transform;
window.FourierDiagram = Object.freeze({ draw: drawWavefunction, compile, transform });
})();
