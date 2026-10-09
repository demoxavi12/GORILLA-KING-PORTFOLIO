import * as THREE from "three";
import { paintBranch, paintCity, paintClouds, paintGlow, paintMoon, paintMountains, paintPoles, paintSky } from "./paint";
import { drawNinja, perchPose, FIGURE_HEIGHT } from "./ninja";

/**
 * The hero world: painted depth layers in a real perspective scene.
 *  - camera parallax follows the cursor (true depth, not CSS offsets)
 *  - embers + ash drift on the wind and swirl away from the cursor
 *  - the shadow perches on a utility pole and turns to watch the cursor
 *  - `setDive(p)` flies the camera through the layers into the moon
 */

type Layer = { mesh: THREE.Mesh; z: number; drift?: number; base: THREE.Vector3 };

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
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vTint, a * a * vAlpha);
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

  // ninja
  private ninjaCanvas = document.createElement("canvas");
  private ninjaCtx = this.ninjaCanvas.getContext("2d")!;
  private ninjaTex!: THREE.CanvasTexture;
  private ninjaMesh!: THREE.Mesh;
  private ninjaDrop = 1; // 1 = above frame, 0 = landed
  private ninjaWorld = new THREE.Vector3();
  private moonPos = new THREE.Vector3();

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

  private plane(c: HTMLCanvasElement, z: number, width: number, height: number, y = 0, opts: { additive?: boolean; drift?: number } = {}) {
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
    this.scene.add(m);
    this.layers.push({ mesh: m, z, drift: opts.drift, base: m.position.clone() });
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
    this.plane(paintSky(texW, texW / (f.w / f.h)), -70, f.w, f.h);

    // Moon + glow
    const moonZ = -55;
    f = this.frame(moonZ);
    const moonSize = f.h * (portrait ? 0.42 : 0.62);
    const moonX = portrait ? f.w * 0.05 : f.w * 0.16;
    const moonY = f.h * (portrait ? 0.17 : 0.12);
    const glow = this.plane(paintGlow(512, "rgba(236,230,214,ALPHA)", 0.8), moonZ - 1, moonSize * 3.2, moonSize * 3.2, moonY, { additive: true });
    glow.position.x = moonX;
    const ember = this.plane(paintGlow(512, "rgba(224,72,44,ALPHA)", 0.35), moonZ - 0.5, moonSize * 2.2, moonSize * 2.2, moonY - moonSize * 0.1, { additive: true });
    ember.position.x = moonX;
    const moon = this.plane(paintMoon(1024), moonZ, moonSize, moonSize, moonY);
    moon.position.x = moonX;
    this.moonPos.copy(moon.position);
    this.layers.slice(-3).forEach((l) => l.base.copy(l.mesh.position));

    // Clouds crossing the moon
    f = layer(-46);
    this.plane(paintClouds(texW, texW / (f.w / f.h), 9, [0.3, 0.42]), -46, f.w, f.h, 0, { drift: 0.18 });
    f = layer(-36);
    this.plane(paintClouds(texW, texW / (f.w / f.h), 14, [0.4, 0.5]), -36, f.w, f.h, 0, { drift: -0.32 });

    // Mountains + city
    f = layer(-30);
    this.plane(paintMountains(texW, texW / (f.w / f.h)), -30, f.w, f.h, -f.h * 0.06);
    f = layer(-18);
    const cityH = f.h * 0.42;
    this.plane(paintCity(texW, (texW / f.w) * cityH), -18, f.w, cityH, -f.h * 0.5 + cityH / 2);

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
    const { canvas: poles, perch } = paintPoles(pw, ph, poleXs, perchIndex, perchTop);
    this.plane(poles, poleZ, f.w, f.h);
    // perch in world coords
    this.ninjaWorld.set((perch.x / pw - 0.5) * f.w, (0.5 - perch.y / ph) * f.h, poleZ + 0.05);

    // The ninja: a live canvas texture, feet on the pole top
    const figWorld = f.h * (portrait ? 0.085 : 0.11);
    this.ninjaCanvas.width = 512;
    this.ninjaCanvas.height = 512;
    this.ninjaTex = this.tex(this.ninjaCanvas);
    this.ninjaMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(figWorld * 2.2, figWorld * 2.2),
      new THREE.MeshBasicMaterial({ map: this.ninjaTex, transparent: true, depthWrite: false }),
    );
    this.scene.add(this.ninjaMesh);

    // Foreground branch
    f = layer(-1);
    this.plane(paintBranch(texW, texW / (f.w / f.h)), -1, f.w, f.h);

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
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
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

  /** 1 → hidden above the pole, 0 → landed. */
  setNinjaDrop(v: number) {
    this.ninjaDrop = v;
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

    // Ninja — perched, watching the cursor
    const ctx = this.ninjaCtx;
    const cw = this.ninjaCanvas.width;
    ctx.clearRect(0, 0, cw, cw);
    const nx = this.ninjaWorld.x;
    this.tmp.copy(this.ninjaWorld).project(cam);
    const lookX = p.active ? p.x - this.tmp.x : -1;
    const lookY = p.active ? p.y - this.tmp.y : 0;
    const facing: 1 | -1 = lookX < 0 ? -1 : 1;
    drawNinja(ctx, perchPose(t, { x: lookX, y: Math.max(-1, Math.min(1, lookY * 1.5)) }), {
      x: cw / 2,
      y: cw * 0.5,
      scale: (cw * 0.42) / FIGURE_HEIGHT,
      facing,
      t,
      color: "#030304",
    });
    this.ninjaTex.needsUpdate = true;
    const size = (this.ninjaMesh.geometry as THREE.PlaneGeometry).parameters.height;
    const drop = this.ninjaDrop;
    this.ninjaMesh.position.set(nx, this.ninjaWorld.y + size * 0.0 + drop * size * 4, this.ninjaWorld.z);
    (this.ninjaMesh.material as THREE.MeshBasicMaterial).opacity = 1 - drop * 0.6;

    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.stop();
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
