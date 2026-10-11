// Scene two's lifecycle — real-time procedural 3D WebGL universe
// with dynamic cards, custom marketing tool logos, and interactive lighting.

import { createGL } from '../gl/renderer.js';
import { Universe } from './universe.js';

export async function initUniverse() {
  const section = document.getElementById('universe');
  const canvas = document.getElementById('uniStage');
  if (!section || !canvas) return null;

  const gl = createGL(canvas);
  if (!gl) {
    section.classList.add('is-fallback');
    return null;
  }

  const universe = new Universe(canvas, gl);
  await universe.load();

  const state = { started: 0, running: false, visible: false, raf: 0, last: 0 };
  const coarseMQ = matchMedia('(pointer: coarse)');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    universe.resize(w, h, dpr);
  }
  resize();

  let resizeId;
  window.addEventListener('resize', () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(resize, 140);
  });

  section.addEventListener('pointermove', (e) => {
    if (coarseMQ.matches) return;
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    universe.pointer.tx = (px / r.width) * 2 - 1;
    universe.pointer.ty = (py / r.height) * 2 - 1;
    universe.pointer.inside = true;
    universe.hovered = universe.pick(px, py);
  }, { passive: true });

  section.addEventListener('pointerleave', () => {
    universe.pointer.inside = false;
    universe.hovered = -1;
  });

  function getScroll() {
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    return Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
  }

  const frame = (now) => {
    if (!state.running) return;
    const dt = Math.min(0.05, (now - state.last) / 1000 || 0.016);
    state.last = now;
    const t = (now - state.started) / 1000;
    const scroll = getScroll();
    const s = universe.render(t, dt, scroll);
    if (s && s.wake > 0.1) {
      section.classList.add('is-on');
    }
    state.raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (state.running) return;
    state.running = true;
    state.last = performance.now();
    if (!state.started) state.started = performance.now();
    state.raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    state.running = false;
    cancelAnimationFrame(state.raf);
  };

  new IntersectionObserver((entries) => {
    for (const e of entries) {
      state.visible = e.isIntersecting;
      if (e.isIntersecting) start();
      else stop();
    }
  }, { threshold: 0.08 }).observe(section);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
    else if (state.visible) start();
  });

  // review hook
  window.__shot2 = async (name = 'universe', at = null) => {
    const t = at !== null ? at : (performance.now() - state.started) / 1000;
    universe.render(t, 0.016, 0.5);
    const url = canvas.toDataURL('image/png');
    await fetch(`/__shot?name=${encodeURIComponent(name)}`,
      { method: 'POST', body: url });
    return `${canvas.width}x${canvas.height} @ t=${t.toFixed(2)}`;
  };
  window.__universe = universe;

  return { universe, section };
}
