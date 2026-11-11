/* Reusable, dependency-free Fourier visualizer. MathJax is optional for notation. */
(() => {
'use strict';
window.MathJax ??= { tex: { inlineMath: [[String.raw`\(`, String.raw`\)`]] } };
let instanceCount = 0;
const instances = new WeakMap();
/** Initialize the existing form and diagrams inside an element ID. Returns { render() }. */
function createFourierGraph(id) {
    const container = document.getElementById(id);
    if (!container) throw new Error(`Fourier graph container not found: ${id}`);
    if (instances.has(container)) return instances.get(container);
    container.classList.add('fourier-graph');
    const prefix = `fourier-${++instanceCount}`;
    container.querySelectorAll('[data-role]').forEach(element => {
        if (!element.id) element.id = `${prefix}-${element.dataset.role}`;
    });
    const $ = role => container.querySelector(`[data-role="${role}"]`);
    const presets = {
        gaussian: 'exp(-x^2/2)',
        packet: 'exp(-x^2/2) * exp(2*i*x)',
        double: 'exp(-(x-2)^2/2) + exp(-(x+2)^2/2)',
        box: 'rect(x/4)',
        excited: 'x * exp(-x^2/2)'
    };

    function run() {
        $('error').textContent = '';
        try {
            const min = Number($('xmin').value), max = Number($('xmax').value);
            const kmin = Number($('kmin').value), kmax = Number($('kmax').value);
            if (![min, max, kmin, kmax, max - min, kmax - kmin].every(Number.isFinite) ||
                max <= min || kmax <= kmin) {
                throw Error('Enter finite bounds with each maximum greater than its minimum.');
            }
            const transformed = transform($('expression').value, [min, max]);
            if (Math.max(Math.abs(kmin), Math.abs(kmax)) >= transformed.nyquist) {
                throw Error('Reduce |k| below ' + transformed.nyquist.toPrecision(4) +
                    ' or narrow the x interval (Nyquist limit).');
            }
            drawWavefunction($('before').id, transformed.position, [min, max]);
            drawWavefunction($('after').id, transformed, [kmin, kmax]);
        } catch (error) {
            $('error').textContent = error.message;
        }
    }

    $('controls').addEventListener('submit', event => {
        event.preventDefault();
        run();
    });
    $('preset').addEventListener('change', () => {
        const expression = presets[$('preset').value];
        if (expression) {
            $('expression').value = expression;
            run();
        }
    });
    $('expression').addEventListener('input', () => { $('preset').value = 'custom'; });
    run();
    if (window.MathJax?.typesetPromise) {
        MathJax.typesetPromise([container]).catch(console.error);
    }
    const instance = { render: run };
    instances.set(container, instance);
    return instance;
}
window.createFourierGraph = createFourierGraph;
// Declarative initialization; callers may also invoke createFourierGraph(id).
function initialize() {
    document.querySelectorAll('[data-fourier-graph]').forEach(container => {
        if (!container.id) container.id = `fourier-container-${++instanceCount}`;
        createFourierGraph(container.id);
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();
})();
