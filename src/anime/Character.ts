import * as THREE from "three";
import gsap from "gsap";

/**
 * The hero character — a crouched silhouette on the perch pole, against the moon.
 *
 * Asset-based (public/characters/hero-*.webp), produced by scripts/cutout-itachi.py
 * from the supplied reference. Layers, all aligned on one plane:
 *   aura   shader smoke grown from the blurred silhouette (behind everything)
 *   sword  hilt + a hidden blade continuing behind his back; it slides along its own
 *          axis, so drawing it genuinely pulls the blade out of the scabbard
 *   body   the silhouette; wind moves only the hair strand and sleeve edges; he breathes
 *   eyes   an additive glow that pulses at rest and flares in the encounter
 *   ripple + slash  the release
 * The figure's own pole cap is part of the body and fades into the scene's pole.
 */

/** Geometry from scripts/cutout-itachi.py → meta.json (uv: x from left, y from bottom). */
export const CHARACTER = {
  body: "/characters/hero-body.webp",
  sword: "/characters/hero-sword.webp",
  eyes: "/characters/hero-eyes.webp",
  w: 505,
  h: 665,
  anchor: [0.4851, 0.3038] as [number, number], // feet on the pole top
  figureTop: 0.9744,
  poleWidth: 0.2851, // fraction of the plane width
  hiltDir: [0.6196, 0.7849] as [number, number], // y-up, along the hilt
  hiltLen: 0.2397, // fraction of the plane width
  hair: { x0: 0.6792, y0: 0.7444, y1: 0.9098 },
  figure: { x0: 0.0198, x1: 0.9604, y0: 0.3038, y1: 0.9774 },
};

const BODY_VS = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uCrouch;
  uniform float uBreath;
  uniform vec3 uHair; // x0, y0, y1
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 q = uv;
    vec3 p = position;
    // hair strand: rooted at x0, free toward its tip
    float band = smoothstep(uHair.y - 0.02, uHair.y + 0.03, q.y) * (1.0 - smoothstep(uHair.z - 0.02, uHair.z + 0.02, q.y));
    float hair = smoothstep(uHair.x, uHair.x + 0.26, q.x) * band;
    // sleeve / cloak edges at both sides of the crouch
    float sleeve = (1.0 - smoothstep(0.02, 0.16, q.x)) * smoothstep(0.42, 0.5, q.y) * (1.0 - smoothstep(0.62, 0.7, q.y));
    sleeve += smoothstep(0.84, 0.96, q.x) * smoothstep(0.42, 0.5, q.y) * (1.0 - smoothstep(0.6, 0.68, q.y)) * 0.6;
    float ph = uTime * 3.1 - q.x * 11.0;
    float gust = 0.65 + 0.35 * sin(uTime * 0.8) * sin(uTime * 1.7 + 1.3);
    p.y += (sin(ph) * 0.016 + sin(ph * 2.2 + 0.7) * 0.005) * hair * uWind * gust;
    p.x += (0.006 + sin(ph * 0.7) * 0.004) * hair * uWind * gust;
    p.x += sin(uTime * 2.4 + q.y * 9.0) * 0.003 * sleeve * uWind;
    // breathing + the crouch sinking (anchored at the feet)
    float above = max(q.y - 0.3038, 0.0);
    p.y -= above * (uBreath * 0.006 + uCrouch * 0.035);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const BODY_FS = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec2 uLight;
  uniform float uRim;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    // moonlight rim on the edge facing the moon
    float behind = texture2D(uMap, vUv - uLight * 0.008).a;
    float rim = clamp(c.a - behind, 0.0, 1.0);
    vec3 col = c.rgb + vec3(0.55, 0.62, 0.8) * rim * uRim;
    gl_FragColor = vec4(col, c.a * uOpacity);
  }
`;

const AURA_FS = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uPower;
  uniform float uOpacity;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
  void main() {
    // the silhouette, smeared upward by rising shadow
    float n = fbm(vUv * vec2(6.0, 4.5) + vec2(0.0, -uTime * 0.14));
    vec2 uv = vUv + vec2((n - 0.5) * 0.05, -n * 0.06 * (0.5 + uPower));
    float m = 0.0;
    float r = 0.014 + 0.024 * uPower;
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 0.5236;
      m += texture2D(uMap, uv + vec2(cos(a), sin(a)) * r).a;
    }
    m /= 12.0;
    float core = texture2D(uMap, vUv).a;
    float halo = clamp(m * 1.4 - core * 0.85, 0.0, 1.0);
    float flick = smoothstep(0.3, 0.85, fbm(vUv * 8.0 + vec2(0.0, -uTime * 0.55)));
    // only above the feet: the pole carries no aura
    float onFigure = smoothstep(0.28, 0.36, vUv.y);
    float a = halo * (0.3 + 0.7 * flick) * (0.22 + 0.78 * uPower) * onFigure;
    vec3 ink = vec3(0.015, 0.02, 0.035);
    vec3 ember = vec3(0.88, 0.25, 0.16);
    vec3 col = mix(ink, ember, smoothstep(0.2, 0.7, halo) * uPower * flick);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

const EYES_FS = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uGlow;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    gl_FragColor = vec4(c.rgb * (0.7 + uGlow * 1.6), c.a * uOpacity * (0.55 + 0.45 * uGlow));
  }
`;

const BASIC_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const RING_FS = /* glsl */ `
  uniform float uT;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float edge = smoothstep(0.0, 0.03, 1.0 - d) * smoothstep(0.86 + uT * 0.1, 1.0, d);
    gl_FragColor = vec4(mix(vec3(0.95, 0.92, 0.85), vec3(0.88, 0.28, 0.17), uT), edge * (1.0 - uT));
  }
`;

const SLASH_FS = /* glsl */ `
  uniform float uT;
  varying vec2 vUv;
  void main() {
    float core = exp(-pow((vUv.y - 0.5) * 9.0, 2.0));
    float glow = exp(-pow((vUv.y - 0.5) * 3.2, 2.0)) * 0.5;
    float taper = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
    vec3 col = mix(vec3(0.88, 0.28, 0.17), vec3(0.98, 0.95, 0.9), core * (1.0 - uT));
    gl_FragColor = vec4(col, (core + glow) * taper * (1.0 - uT));
  }
`;

type FX = { wind: number; aura: number; eyes: number; draw: number; tilt: number; crouch: number; ring: number; slash: number; presence: number };

export class HeroCharacter {
  readonly group = new THREE.Group();
  private body: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private aura: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private eyes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private swordPivot = new THREE.Group();
  private sword: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private ring: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private slash: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private textures: THREE.Texture[] = [];
  private fx: FX = { wind: 1, aura: 0.2, eyes: 0.25, draw: 0, tilt: 0, crouch: 0, ring: 1, slash: 1, presence: 0 };
  readonly planeW: number;
  readonly planeH: number;
  private hover = 0;
  private armed = true;
  private busy = false;
  private cooldown = 0;
  private tl: gsap.core.Timeline | null = null;
  private tmp = new THREE.Vector3();
  /** called on the release beat — the scene blows embers outward */
  onRelease: ((origin: THREE.Vector3) => void) | null = null;

  /** `figureHeight`: world height of the crouched figure (feet → top of the head). */
  constructor(figureHeight: number, onReady?: () => void) {
    const C = CHARACTER;
    this.planeH = figureHeight / (C.figureTop - C.anchor[1]);
    this.planeW = this.planeH * (C.w / C.h);
    const W = this.planeW;
    const H = this.planeH;
    const loader = new THREE.TextureLoader();
    let pending = 3;
    const done = () => {
      if (--pending === 0) onReady?.();
    };
    const load = (src: string) => {
      const t = loader.load(src, done, undefined, done);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.textures.push(t);
      return t;
    };
    const bodyTex = load(C.body);
    const swordTex = load(C.sword);
    const eyesTex = load(C.eyes);

    this.aura = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.ShaderMaterial({
        vertexShader: BASIC_VS,
        fragmentShader: AURA_FS,
        uniforms: { uMap: { value: bodyTex }, uTime: { value: 0 }, uPower: { value: 0.2 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    );

    // sword — rendered BEHIND the body; it slides along the hilt axis to draw
    this.sword = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: swordTex, transparent: true, depthWrite: false, opacity: 0 }));
    this.swordPivot.add(this.sword);

    this.body = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 40, 52),
      new THREE.ShaderMaterial({
        vertexShader: BODY_VS,
        fragmentShader: BODY_FS,
        uniforms: {
          uMap: { value: bodyTex },
          uTime: { value: 0 },
          uWind: { value: 1 },
          uCrouch: { value: 0 },
          uBreath: { value: 0 },
          uHair: { value: new THREE.Vector3(C.hair.x0, C.hair.y0, C.hair.y1) },
          uOpacity: { value: 0 },
          uLight: { value: new THREE.Vector2(-0.6, 0.8) },
          uRim: { value: 0.5 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.body.scale.set(W, H, 1);

    this.eyes = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.ShaderMaterial({
        vertexShader: BASIC_VS,
        fragmentShader: EYES_FS,
        uniforms: { uMap: { value: eyesTex }, uGlow: { value: 0.25 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    const center = new THREE.Vector2((0.48 - 0.5) * W, (0.78 - 0.5) * H); // around the head/eyes
    this.ring = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ vertexShader: BASIC_VS, fragmentShader: RING_FS, uniforms: { uT: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.ring.position.set(center.x, center.y, 0.03);
    this.slash = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ vertexShader: BASIC_VS, fragmentShader: SLASH_FS, uniforms: { uT: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    // the slash follows the sword's angle, across the moon
    this.slash.position.set(center.x + W * 0.1, center.y + H * 0.05, 0.04);
    this.slash.rotation.z = Math.atan2(C.hiltDir[1], C.hiltDir[0]) - Math.PI / 2 + 0.35;

    this.group.add(this.aura, this.swordPivot, this.body, this.eyes, this.ring, this.slash);
    [this.aura, this.sword, this.body, this.eyes, this.ring, this.slash].forEach((m, i) => (m.renderOrder = 200 + i));
  }

  /** Stand the figure with its feet on `top` (world). */
  placeOn(top: THREE.Vector3) {
    const [ax, ay] = CHARACTER.anchor;
    this.group.position.set(top.x + (0.5 - ax) * this.planeW, top.y + (0.5 - ay) * this.planeH, top.z);
  }

  /** World width of his own pole cap, so the scene's pole can match it. */
  get poleWidth() {
    return CHARACTER.poleWidth * this.planeW;
  }

  setPresence(v: number) {
    this.fx.presence = v;
  }

  private hit(px: number, py: number, cam: THREE.Camera, w: number, h: number) {
    const f = CHARACTER.figure;
    const corner = (u: number, v: number) => {
      this.tmp.set((u - 0.5) * this.planeW, (v - 0.5) * this.planeH, 0);
      this.group.localToWorld(this.tmp);
      this.tmp.project(cam);
      return { x: (this.tmp.x * 0.5 + 0.5) * w, y: (-this.tmp.y * 0.5 + 0.5) * h };
    };
    const a = corner(f.x0, f.y1);
    const b = corner(f.x1, f.y0);
    return px >= Math.min(a.x, b.x) && px <= Math.max(a.x, b.x) && py >= Math.min(a.y, b.y) && py <= Math.max(a.y, b.y);
  }

  tap(px: number, py: number, cam: THREE.Camera, w: number, h: number) {
    if (this.hit(px, py, cam, w, h)) this.encounter();
  }

  /** The encounter: notice → anticipation → the sword is drawn → release → rest. */
  encounter() {
    if (this.busy || this.cooldown > 0 || this.fx.presence < 0.95) return;
    this.busy = true;
    this.armed = false;
    const fx = this.fx;
    this.tl?.kill();
    this.tl = gsap
      .timeline({
        onComplete: () => {
          this.busy = false;
          this.cooldown = 2.6;
        },
      })
      // notice — the eyes find you; the shadows thicken
      .to(fx, { eyes: 1, aura: 0.5, wind: 1.8, duration: 0.3, ease: "power2.out" }, 0)
      // anticipation — he sinks deeper into the crouch
      .to(fx, { crouch: 1, duration: 0.28, ease: "power2.inOut" }, 0.2)
      // the draw — the blade comes up out of the scabbard along its own axis
      .to(fx, { draw: 1, tilt: 1, crouch: 0.2, aura: 1, duration: 0.36, ease: "expo.out" }, 0.48)
      .call(() => {
        this.tmp.copy(this.ring.position);
        this.group.localToWorld(this.tmp);
        this.onRelease?.(this.tmp.clone());
      }, [], 0.58)
      .fromTo(fx, { ring: 0 }, { ring: 1, duration: 1.0, ease: "power2.out" }, 0.56)
      .fromTo(fx, { slash: 0 }, { slash: 1, duration: 0.7, ease: "power3.out" }, 0.6)
      // rest — the sword returns, the night settles
      .to(fx, { draw: 0, tilt: 0, crouch: 0, aura: 0.2, eyes: 0.25, wind: 1, duration: 1.1, ease: "power3.inOut" }, 1.45);
  }

  update(t: number, dt: number, pointer: { px: number; py: number; active: boolean }, cam: THREE.Camera, w: number, h: number, still = false) {
    const fx = this.fx;
    const C = CHARACTER;
    if (!still) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      const over = pointer.active && this.hit(pointer.px, pointer.py, cam, w, h);
      if (over) this.hover += dt;
      else {
        this.hover = 0;
        if (!this.busy) this.armed = true;
      }
      if (over && this.armed && this.hover > 0.14) this.encounter();
    }

    const pres = fx.presence;
    const b = this.body.material.uniforms;
    b.uTime.value = t;
    b.uWind.value = still ? 0 : fx.wind;
    b.uCrouch.value = fx.crouch;
    b.uBreath.value = still ? 0 : 0.5 + 0.5 * Math.sin(t * 1.4);
    b.uOpacity.value = pres;
    const a = this.aura.material.uniforms;
    a.uTime.value = t;
    a.uPower.value = fx.aura;
    a.uOpacity.value = pres;
    const e = this.eyes.material.uniforms;
    e.uGlow.value = still ? 0.4 : fx.eyes * (0.85 + 0.15 * Math.sin(t * 2.2));
    e.uOpacity.value = pres;
    this.sword.material.opacity = pres;

    // the draw: slide along the hilt axis, tilting slightly toward vertical
    const len = C.hiltLen * this.planeW;
    const d = fx.draw * len * 0.62;
    this.swordPivot.position.set(C.hiltDir[0] * d, C.hiltDir[1] * d - fx.crouch * 0.03 * this.planeH * 0.67, 0);
    this.swordPivot.rotation.z = fx.tilt * 0.06;

    const ringR = this.planeH * (0.12 + fx.ring * 1.3);
    this.ring.scale.set(ringR, ringR, 1);
    this.ring.material.uniforms.uT.value = fx.ring;
    this.ring.visible = fx.ring < 0.999;
    this.slash.scale.set(this.planeW * 3.2 * Math.min(1, fx.slash * 3), this.planeH * 0.04, 1);
    this.slash.material.uniforms.uT.value = fx.slash;
    this.slash.visible = fx.slash < 0.999;
  }

  dispose() {
    this.tl?.kill();
    this.textures.forEach((t) => t.dispose());
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
}
