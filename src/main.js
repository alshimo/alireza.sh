import './styles.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ Text splitting ============ */

function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-label', text);
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(span);
  }
  return el.querySelectorAll('.char');
}

function splitWords(el) {
  const text = el.textContent.trim();
  el.textContent = '';
  el.setAttribute('aria-label', text);
  text.split(/\s+/).forEach((word, i, arr) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    el.appendChild(span);
    if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return el.querySelectorAll('.word');
}

/* ============ Smooth scroll ============ */

let lenis = null;

function initSmoothScroll() {
  if (reduceMotion) return;

  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function initAnchorLinks() {
  document.querySelectorAll('[data-scroll-to]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = id === '#top' ? document.body : document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(id === '#top' ? 0 : target, { offset: -40 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ============ Preloader + hero intro ============ */

function initPreloader() {
  const preloader = document.querySelector('.preloader');
  const counter = preloader.querySelector('.preloader-count');
  const heroChars = document.querySelectorAll('.hero-line .char');
  const heroReveals = document.querySelectorAll('.hero [data-reveal]');

  gsap.set(heroChars, { yPercent: 110 });
  gsap.set(heroReveals, { autoAlpha: 0, y: 24 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      preloader.remove();
      ScrollTrigger.refresh();
    },
  });

  if (reduceMotion) {
    preloader.remove();
    gsap.set(heroChars, { yPercent: 0 });
    gsap.set(heroReveals, { autoAlpha: 1, y: 0 });
    return;
  }

  const progress = { value: 0 };

  tl.to(progress, {
    value: 100,
    duration: 1.1,
    ease: 'power2.inOut',
    onUpdate: () => {
      counter.textContent = Math.round(progress.value);
    },
  })
    .to(preloader, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '+=0.15')
    .to(heroChars, { yPercent: 0, duration: 1, stagger: 0.035, ease: 'power4.out' }, '-=0.45')
    .to(heroReveals, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, '-=0.6');
}

/* ============ Custom cursor ============ */

function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cursor = document.querySelector('.cursor');
  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  window.addEventListener('pointermove', (event) => {
    dotX(event.clientX);
    dotY(event.clientY);
    ringX(event.clientX);
    ringY(event.clientY);
  });

  document.querySelectorAll('a, button, [data-magnetic]').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
  });
}

/* ============ Magnetic elements ============ */

function initMagnetic() {
  if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - rect.left - rect.width / 2) * strength);
      yTo((event.clientY - rect.top - rect.height / 2) * strength);
    });

    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ============ Header hide on scroll down ============ */

function initHeader() {
  const header = document.querySelector('.site-header');
  let lastY = 0;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-hidden', y > lastY && y > 160);
      lastY = y;
    },
  });
}

/* ============ Scroll-driven reveals ============ */

function initScrollAnimations() {
  if (reduceMotion) return;

  // Generic fade-up reveals (outside the hero, which the preloader handles)
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, {
      autoAlpha: 0,
      y: 32,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // Section rules grow in
  document.querySelectorAll('.section-rule').forEach((rule) => {
    gsap.from(rule, {
      scaleX: 0,
      duration: 1.1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: rule, start: 'top 90%' },
    });
  });

  // Split-word headings
  document.querySelectorAll('[data-split-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      autoAlpha: 0,
      yPercent: 60,
      rotate: 2,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Stats counters
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const target = Number(el.dataset.counter);
    const obj = { value: 0 };
    gsap.to(obj, {
      value: target,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.value);
      },
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  document.querySelectorAll('[data-stat]').forEach((el, i) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 40,
      duration: 0.8,
      delay: i * 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.stats', start: 'top 85%' },
    });
  });

  // Expertise rows
  document.querySelectorAll('[data-expertise]').forEach((row) => {
    gsap.from(row, {
      autoAlpha: 0,
      y: 36,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 90%' },
    });
  });

  // Timeline entries
  document.querySelectorAll('[data-entry]').forEach((entry) => {
    gsap.from(entry, {
      autoAlpha: 0,
      y: 48,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: { trigger: entry, start: 'top 88%' },
    });
  });

  // Contact "LET'S TALK" chars
  const contactChars = document.querySelectorAll('.contact-mail [data-split-chars] .char');
  if (contactChars.length) {
    gsap.from(contactChars, {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.03,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.contact-title', start: 'top 85%' },
    });
  }

  // Marquee scroll-velocity nudge
  const track = document.querySelector('.marquee-track');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        loop.timeScale(gsap.utils.clamp(0.5, 4, 1 + Math.abs(self.getVelocity()) / 900));
        gsap.to(loop, { timeScale: 1, duration: 0.8, overwrite: 'auto', delay: 0.1 });
      },
    });
  }

  // Hero parallax: title drifts up as you scroll away
  gsap.to('.hero-inner', {
    yPercent: -12,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ============ Three.js hero scene ============ */

function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || reduceMotion) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return; // No WebGL - the hero still works as pure typography
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0b0c, 0.055);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 2.4, 8);
  camera.lookAt(0, 0, 0);

  // Particle terrain: a wide grid of points displaced by layered waves
  const COLS = 160;
  const ROWS = 90;
  const WIDTH = 38;
  const DEPTH = 22;
  const count = COLS * ROWS;

  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  let i = 0;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      positions[i * 3] = (c / (COLS - 1) - 0.5) * WIDTH;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * DEPTH;
      seeds[i] = Math.random();
      i += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uInk: { value: new THREE.Color(0x60605c) },
      uAccent: { value: new THREE.Color(0xd8ff3e) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uMouse;
      attribute float aSeed;
      varying float vElevation;
      varying float vSeed;

      void main() {
        vec3 pos = position;

        float t = uTime * 0.45;
        float wave =
          sin(pos.x * 0.45 + t) * 0.45 +
          sin(pos.z * 0.7 - t * 1.3) * 0.35 +
          sin((pos.x + pos.z) * 0.25 + t * 0.7) * 0.5;

        // Gentle swell toward the mouse
        float mouseDist = distance(pos.xz * 0.05, uMouse * 0.6);
        wave += smoothstep(0.6, 0.0, mouseDist) * 0.8;

        pos.y = wave;
        vElevation = wave;
        vSeed = aSeed;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (1.6 + aSeed * 1.8) * (300.0 / -mvPosition.z) * 0.03 + 1.6;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform vec3 uAccent;
      varying float vElevation;
      varying float vSeed;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.05, d);

        float lift = smoothstep(0.2, 1.3, vElevation);
        vec3 color = mix(uInk, uAccent, lift * (0.45 + vSeed * 0.55));

        gl_FragColor = vec4(color, alpha * (0.55 + lift * 0.45));
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.position.y = -1.4;
  scene.add(points);

  const mouse = new THREE.Vector2(0, 0);
  const targetMouse = new THREE.Vector2(0, 0);

  window.addEventListener('pointermove', (event) => {
    targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -((event.clientY / window.innerHeight) * 2 - 1);
  });

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize);

  // Render only while the hero is on screen
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(canvas);

  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    if (!visible) return;

    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;

    mouse.lerp(targetMouse, 0.04);
    material.uniforms.uMouse.value.copy(mouse);

    camera.position.x = mouse.x * 0.6;
    camera.position.y = 2.4 + mouse.y * 0.3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  });
}

/* ============ Small utilities ============ */

function initClock() {
  const el = document.querySelector('[data-local-time]');
  if (!el) return;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });

  const tick = () => {
    el.textContent = `${formatter.format(new Date())} CET`;
  };

  tick();
  setInterval(tick, 30_000);

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ============ Boot ============ */

document.querySelectorAll('[data-split-chars]').forEach(splitChars);

initSmoothScroll();
initAnchorLinks();
initPreloader();
initCursor();
initMagnetic();
initHeader();
initScrollAnimations();
initHeroScene();
initClock();
