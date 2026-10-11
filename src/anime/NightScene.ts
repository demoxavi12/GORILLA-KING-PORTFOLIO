import * as THREE from "three";
import { paintBranch, paintCity, paintClouds, paintGlow, paintMoon, paintMountains, paintPoles, paintSky } from "./paint";
import { HeroCharacter } from "./Character";

/**
 * The hero world: painted depth layers in a real perspective scene.
 *  - camera parallax follows the cursor (true depth, not CSS offsets)
 *  - embers + ash drift on the wind and swirl away from the cursor
 *  - the character stands on the perch pole against the moon (see Character.ts)
 *  - `setAssemble(p)` builds the world layer by layer (intro handoff)
 *  - `moonScreen()` reports where the moon is, so the intro's moon can land on it
 *  - `setDive(p)` flies the camera through the layers into the moon
 */

/** order: assembly sequence (-1 = the moon, driven separately); rise: lifts from below while assembling */
type Layer = { mesh: THREE.Mesh; z: number; drift?: number; base: THREE.Vector3; order: number; rise: number };

const FOV = 38;
const CAM_Z = 10;

const PARTICLE_VS = /* glsl */ `
  attribute float size;
  attribute vec3 tint;
  attribute float alpha;
  varying vec3 vTint;
  varying float vAlpha;
  void main() {
    vTint = tint;
    vAlpha = alpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const PARTICLE_FS = /* glsl */ `
  varying vec3 vTint;
  varying float vAlpha;
  uniform float uGlobal;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vTint, a * a * vAlpha * uGlobal);
  }
`;

export class NightScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private layers: Layer[] = [];
  private textures: THREE.Texture[] = [];
  private raf = 0;
  private running = false;
  private clock = new THREE.Timer();
  private pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, active: false };
  private dive = 0;
  private w = 1;
  private h = 1;

  // particles
  private points!: THREE.Points;
  private pos!: Float32Array;
  private vel!: Float32Array;
  private count: number;
  private tmp = new THREE.Vector3();

  // character + assembly
  private character!: HeroCharacter;
  private perchWorld = new THREE.Vector3();
  private moonPos = new THREE.Vector3();
  private moonSize = 1;
  private assemble = 0;
  private moonPresence = 0;
  private characterPresence = 0;

  constructor(private host: HTMLElement, opts: { particles: number; dpr: number }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(opts.dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x050608, 1);
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    this.camera.position.set(0, 0, CAM_Z);
    this.count = opts.particles;
    this.build();
  }

  /** World-space size of the visible frustum at depth z (from the resting camera). */
  private frame(z: number) {
    const dist = CAM_Z - z;
    const h = 2 * Math.tan((FOV * Math.PI) / 360) * dist;
    return { w: h * (this.w / this.h), h };
  }

  private tex(c: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    this.textures.push(t);
    return t;
  }

  private plane(
    c: HTMLCanvasElement,
    z: number,
    width: number,
    height: number,
    y = 0,
    opts: { additive?: boolean; drift?: number; order?: number; rise?: number } = {},
  ) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: this.tex(c),
        transparent: true,
        depthWrite: false,
        blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    );
    m.position.set(0, y, z);
    // explicit back-to-front order: far layers first (transparent sorting is unreliable across such different plane sizes)
    m.renderOrder = Math.round(100 + z);
    this.scene.add(m);
    this.layers.push({ mesh: m, z, drift: opts.drift, base: m.position.clone(), order: opts.order ?? 0, rise: opts.rise ?? 0 });
    return m;
  }

  private build() {
    const rect = this.host.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    const aspect = this.w / this.h;
    const portrait = aspect < 1;
    const margin = 1.35; // room for parallax

    // texture resolution scales with the screen, capped
    const res = (fw: number) => Math.min(2048, Math.max(900, fw));
    const texW = res(this.w * 1.4);

    const layer = (z: number) => {
      const f = this.frame(z);
      return { w: f.w * margin, h: f.h * margin };
    };

    // Sky
    let f = layer(-70);
    this.plane(paintSky(texW, texW / (f.w / f.h)), -70, f.w, f.h, 0, { order: 0 });

    // Moon + glow
    const moonZ = -55;
    f = this.frame(moonZ);
    const moonSize = f.h * (portrait ? 0.42 : 0.62);
    const moonX = portrait ? f.w * 0.05 : f.w * 0.16;
    const moonY = f.h * (portrait ? 0.17 : 0.12);
    const glow = this.plane(paintGlow(512, "rgba(236,230,214,ALPHA)", 0.8), moonZ - 1, moonSize * 3.2, moonSize * 3.2, moonY, { additive: true, order: -1 });
    glow.position.x = moonX;
    const ember = this.plane(paintGlow(512, "rgba(224,72,44,ALPHA)", 0.35), moonZ - 0.5, moonSize * 2.2, moonSize * 2.2, moonY - moonSize * 0.1, { additive: true, order: -1 });
    ember.position.x = moonX;
    const moon = this.plane(paintMoon(1024), moonZ, moonSize, moonSize, moonY, { order: -1 });
    moon.position.x = moonX;
    this.moonPos.copy(moon.position);
    this.moonSize = moonSize;
    this.layers.slice(-3).forEach((l) => l.base.copy(l.mesh.position));

    // Clouds crossing the moon
    f = layer(-46);
    this.plane(paintClouds(texW, texW / (f.w / f.h), 9, [0.55, 0.62]), -46, f.w, f.h, 0, { drift: 0.18, order: 1 });
    f = layer(-36);
    this.plane(paintClouds(texW, texW / (f.w / f.h), 14, [0.6, 0.68]), -36, f.w, f.h, 0, { drift: -0.32, order: 1.4 });

    // Mountains + city
    f = layer(-30);
    this.plane(paintMountains(texW, texW / (f.w / f.h)), -30, f.w, f.h, -f.h * 0.06, { order: 2, rise: f.h * 0.12 });
    f = layer(-18);
    const cityH = f.h * 0.42;
    this.plane(paintCity(texW, (texW / f.w) * cityH), -18, f.w, cityH, -f.h * 0.5 + cityH / 2, { order: 2.8, rise: cityH * 0.45 });

    // Poles + wires, with the perch
    const poleZ = -7;
    f = layer(poleZ);
    const pw = texW;
    const ph = texW / (f.w / f.h);
    // The perch pole stands in front of the moon so the shadow reads as a silhouette.
    // screen = 0.5 + (canvas - 0.5) * margin  →  canvas = 0.5 + (screen - 0.5) / margin
    const moonScreenX = 0.5 + moonX / this.frame(moonZ).w;
    const perchX = 0.5 + (moonScreenX - 0.5) / margin;
    const perchTop = 0.5 + ((portrait ? 0.47 : 0.52) - 0.5) / margin;
    const poleXs = portrait ? [0.08, perchX] : [0.04, 0.33, perchX, 0.97];
    const perchIndex = portrait ? 1 : 2;
    // The character: crouched on the perch, silhouetted against the moon.
    // Built first so the perch post can match the width of his own pole.
    const visible = this.frame(poleZ).h;
    // textures arrive async: if nothing is animating (reduced motion), redraw the still frame
    this.character = new HeroCharacter(visible * (portrait ? 0.2 : 0.27), () => {
      if (!this.running) this.tick(0);
    });
    const perchWidthPx = (this.character.poleWidth / f.w) * pw * 0.98;
    const { canvas: poles, perch } = paintPoles(pw, ph, poleXs, perchIndex, perchTop, perchWidthPx);
    this.plane(poles, poleZ, f.w, f.h, 0, { order: 3.5, rise: f.h * 0.18 });
    // perch in world coords (a hair above the post's top edge, under his feet)
    this.perchWorld.set((perch.x / pw - 0.5) * f.w, (0.5 - perch.y / ph) * f.h, poleZ + 0.05);
    this.character.placeOn(this.perchWorld);
    this.character.onRelease = (o) => this.impulse(o);
    this.scene.add(this.character.group);

    // Foreground branch
    f = layer(-1);
    this.plane(paintBranch(texW, texW / (f.w / f.h)), -1, f.w, f.h, 0, { order: 4.4, rise: -f.h * 0.15 });

    this.buildParticles();
    this.resize();
  }

  private buildParticles() {
    const n = this.count;
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const tint = new Float32Array(n * 3);
    const alpha = new Float32Array(n);
    const ember = new THREE.Color("#e0482c");
    const hot = new THREE.Color("#ff9a5a");
    const ash = new THREE.Color("#f1efe8");
    for (let i = 0; i < n; i++) {
      this.spawn(i, true);
      const isEmber = Math.random() < 0.55;
      const c = isEmber ? (Math.random() < 0.3 ? hot : ember) : ash;
      tint.set([c.r, c.g, c.b], i * 3);
      size[i] = isEmber ? 0.6 + Math.random() * 1.4 : 0.4 + Math.random() * 0.9;
      alpha[i] = isEmber ? 0.6 + Math.random() * 0.4 : 0.18 + Math.random() * 0.3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    g.setAttribute("tint", new THREE.BufferAttribute(tint, 3));
    g.setAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
    this.points = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VS,
        fragmentShader: PARTICLE_FS,
        uniforms: { uGlobal: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.points.renderOrder = 300; // embers drift in front of the figure too
    this.scene.add(this.points);
  }

  private spawn(i: number, anywhere: boolean) {
    const z = -26 + Math.random() * 30;
    const f = this.frame(z);
    const x = anywhere ? (Math.random() - 0.5) * f.w * 1.3 : -f.w * 0.7;
    const y = (Math.random() - 0.5) * f.h * 1.2;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([0.6 + Math.random() * 1.2, 0.15 + Math.random() * 0.5, 0], i * 3);
  }

  resize() {
    const rect = this.host.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }

  setPointer(clientX: number, clientY: number) {
    const rect = this.host.getBoundingClientRect();
    this.pointer.tx = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.ty = -(((clientY - rect.top) / rect.height) * 2 - 1);
    this.pointer.px = clientX - rect.left;
    this.pointer.py = clientY - rect.top;
    this.pointer.active = true;
  }

  leavePointer() {
    this.pointer.tx = 0;
    this.pointer.ty = 0;
    this.pointer.active = false;
  }

  /** 0 = resting, 1 = inside the moon. */
  setDive(p: number) {
    this.dive = p;
  }

  /** 0 → only the night sky, 1 → the whole world in place. */
  setAssemble(p: number) {
    this.assemble = p;
  }

  /** The character is revealed last, after the type, text and environment. */
  setCharacterPresence(v: number) {
    this.characterPresence = v;
  }

  /** Keyboard / programmatic encounter. */
  encounter() {
    this.character.encounter();
  }

  /** The moon (and its glow), handed over from the intro's moon. */
  setMoonPresence(v: number) {
    this.moonPresence = v;
  }

  /** Where the moon disc is on screen right now (px, relative to the host). */
  moonScreen() {
    const cam = this.camera;
    cam.updateMatrixWorld();
    const c = this.tmp.copy(this.moonPos).project(cam);
    const cx = (c.x * 0.5 + 0.5) * this.w;
    const cy = (-c.y * 0.5 + 0.5) * this.h;
    const e = this.tmp.set(this.moonPos.x + this.moonSize * 0.48, this.moonPos.y, this.moonPos.z).project(cam);
    const ex = (e.x * 0.5 + 0.5) * this.w;
    return { x: cx, y: cy, d: Math.abs(ex - cx) * 2 };
  }

  /** Tap (touch): lets the character be encountered without hover. */
  tap(clientX: number, clientY: number) {
    const rect = this.host.getBoundingClientRect();
    this.character.tap(clientX - rect.left, clientY - rect.top, this.camera, this.w, this.h);
  }

  /** The release beat: embers near the blade are blown outward. */
  private impulse(origin: THREE.Vector3) {
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      const dx = this.pos[k] - origin.x;
      const dy = this.pos[k + 1] - origin.y;
      const d = Math.hypot(dx, dy) + 0.3;
      const f = Math.min(9, 26 / (d * d));
      this.vel[k] += (dx / d) * f - f * 0.6;
      this.vel[k + 1] += (dy / d) * f;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.update();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick();
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Render a single still frame (reduced motion). */
  still() {
    this.tick(0);
  }

  private tick(forceDt?: number) {
    this.clock.update();
    const dt = Math.min(forceDt ?? this.clock.getDelta(), 0.05);
    const t = this.clock.getElapsed();
    const p = this.pointer;
    p.x += (p.tx - p.x) * 0.06;
    p.y += (p.ty - p.y) * 0.06;

    // Camera: cursor parallax + dive
    const d = this.dive;
    const ease = d * d * (3 - 2 * d);
    const cam = this.camera;
    cam.position.x = p.x * 1.6 * (1 - ease) + this.moonPos.x * ease * 0.85;
    cam.position.y = p.y * 0.8 * (1 - ease) + this.moonPos.y * ease * 0.85;
    cam.position.z = CAM_Z - ease * 58;
    cam.fov = FOV - ease * 10;
    cam.updateProjectionMatrix();
    cam.lookAt(cam.position.x * (0.35 + ease * 0.65), cam.position.y * (0.5 + ease * 0.5), -60);
    cam.rotation.z += -p.x * 0.015;

    // Cloud drift
    for (const l of this.layers) {
      if (l.drift) {
        const span = this.frame(l.z).w * 0.5;
        l.mesh.position.x = l.base.x + ((((t * l.drift + span) % (span * 2)) + span * 2) % (span * 2)) - span;
      }
    }

    // Particles — wind, turbulence, cursor swirl
    const n = this.count;
    const cursorR = Math.min(this.w, this.h) * 0.16;
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      let vx = this.vel[k];
      let vy = this.vel[k + 1];
      const x = this.pos[k];
      const y = this.pos[k + 1];
      const z = this.pos[k + 2];
      vx += Math.sin(t * 0.7 + y * 0.4 + i) * 0.02;
      vy += Math.cos(t * 0.9 + x * 0.3 + i * 0.5) * 0.015;
      if (p.active) {
        this.tmp.set(x, y, z).project(cam);
        const sx = (this.tmp.x * 0.5 + 0.5) * this.w;
        const sy = (-this.tmp.y * 0.5 + 0.5) * this.h;
        const dx = sx - p.px;
        const dy = sy - p.py;
        const dist = Math.hypot(dx, dy);
        if (dist < cursorR && dist > 0.001) {
          const f = (1 - dist / cursorR) * 0.9;
          // push out + swirl around the cursor
          vx += ((dx / dist) * f + (-dy / dist) * f * 0.8) * 0.5;
          vy += ((-dy / dist) * f + (-dx / dist) * f * 0.8) * 0.5;
        }
      }
      vx += (0.9 - vx) * 0.02;
      vy += (0.3 - vy) * 0.02;
      this.vel[k] = vx;
      this.vel[k + 1] = vy;
      this.pos[k] = x + vx * dt * 1.4;
      this.pos[k + 1] = y + vy * dt * 1.4;
      const fr = this.frame(z);
      if (this.pos[k] > fr.w * 0.75 || this.pos[k + 1] > fr.h * 0.7 || this.pos[k + 1] < -fr.h * 0.7) this.spawn(i, false);
    }
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Assembly: the world builds itself layer by layer
    const A = this.assemble;
    for (const l of this.layers) {
      const mat = l.mesh.material as THREE.MeshBasicMaterial;
      if (l.order < 0) {
        mat.opacity = this.moonPresence;
        continue;
      }
      const k = Math.min(1, Math.max(0, (A * 5.2 - l.order) / 1.1));
      const e = 1 - Math.pow(1 - k, 3);
      mat.opacity = e;
      if (l.rise) l.mesh.position.y = l.base.y - (1 - e) * l.rise;
    }
    (this.points.material as THREE.ShaderMaterial).uniforms.uGlobal.value = Math.min(1, Math.max(0, A * 5.2 - 4.2));
    this.character.setPresence(this.characterPresence);
    this.character.update(t, dt, p, cam, this.w, this.h, forceDt === 0);

    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.stop();
    this.character.dispose();
    this.textures.forEach((t) => t.dispose());
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
