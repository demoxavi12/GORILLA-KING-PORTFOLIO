import * as THREE from "three";
import gsap from "gsap";

/**
 * The hero character — an ink figure standing on the perch pole against the moon.
 *
 * Asset-based (public/characters/*), produced by scripts/cutout-character.py from a
 * black-and-white reference: `body` and `sword` are separate RGBA layers so the blade
 * can genuinely rise around the fist. Swap the reference + re-run the script to change
 * the character without touching code.
 *
 * Layers (back → front): aura (shader smoke from the blurred silhouette) · body (wind-
 * displaced cloth, moon rim light) · sword (rotates about the fist) · ripple · slash.
 */

export const CHARACTER = {
  body: "/characters/hero-body.webp",
  sword: "/characters/hero-sword.webp",
  w: 1512,
  h: 1146,
  /** fist, in texture px — the sword's pivot */
  pivot: [1095, 633] as [number, number],
  /** where the feet meet the pole top, in texture uv (x from left, y from bottom) */
  anchor: [0.885, 0.17] as [number, number], // above the misted hem: the pole top disappears into it
  /** the figure (not the blade), in uv — used for the cursor hit area */
  figure: { x0: 0.58, x1: 1.0, y0: 0.05, y1: 1.0 },
};

const BODY_VS = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uSquash;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // cloth: the lower coat and the trailing tail move; torso, fist and face stay locked
    float coat = (1.0 - smoothstep(0.12, 0.62, uv.y)) * (0.35 + 0.65 * (1.0 - smoothstep(0.55, 0.95, uv.x)));
    float hair = smoothstep(0.86, 0.97, uv.y) * smoothstep(0.82, 0.9, uv.x);
    float w = coat + hair * 0.35;
    float ph = uTime * 2.3 + uv.y * 7.0 + uv.x * 5.0;
    float gust = 0.6 + 0.4 * sin(uTime * 0.7) * sin(uTime * 1.3 + 1.7);
    p.x += (sin(ph) * 0.018 + sin(ph * 2.3 + 1.1) * 0.006 - 0.012 * gust) * w * uWind;
    p.y += cos(ph * 0.8) * 0.008 * w * uWind;
    // anticipation: settle into the stance (squash toward the feet)
    p.y = mix(p.y, -0.5 + (p.y + 0.5) * (1.0 - 0.03 * uSquash), 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const BODY_FS = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec2 uLight;     // direction toward the moon, uv space
  uniform float uRim;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    // moon rim: alpha edge facing the light
    float behind = texture2D(uMap, vUv - uLight * 0.006).a;
    float rim = clamp(c.a - behind, 0.0, 1.0);
    vec3 col = c.rgb + vec3(0.93, 0.9, 0.84) * rim * uRim;
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
    // the silhouette, smeared upward by rising smoke
    vec2 flow = vec2(0.0, -uTime * 0.12);
    float n = fbm(vUv * vec2(7.0, 5.0) + flow);
    vec2 uv = vUv + vec2((n - 0.5) * 0.04, -(n * 0.05) * (0.6 + uPower));
    float m = 0.0;
    float r = 0.012 + 0.018 * uPower;
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 0.5236;
      m += texture2D(uMap, uv + vec2(cos(a), sin(a)) * r).a;
    }
    m /= 12.0;
    float core = texture2D(uMap, uv).a;
    float halo = clamp(m * 1.35 - core * 0.6, 0.0, 1.0);
    float flick = smoothstep(0.35, 0.85, fbm(vUv * 9.0 + vec2(0.0, -uTime * 0.6)));
    float a = halo * (0.35 + 0.65 * flick) * (0.25 + 0.75 * uPower);
    vec3 ink = vec3(0.02, 0.02, 0.025);
    vec3 ember = vec3(0.88, 0.28, 0.17);
    vec3 col = mix(ink, ember, smoothstep(0.15, 0.6, halo) * (0.35 + 0.65 * uPower) * flick);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

const BASIC_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const RING_FS = /* glsl */ `
  uniform float uT; // 0..1 lifetime
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float edge = smoothstep(0.0, 0.03, 1.0 - d) * smoothstep(0.86 + uT * 0.1, 1.0, d);
    float a = edge * (1.0 - uT);
    gl_FragColor = vec4(mix(vec3(0.95, 0.92, 0.85), vec3(0.88, 0.28, 0.17), uT), a);
  }
`;

const SLASH_FS = /* glsl */ `
  uniform float uT;
  varying vec2 vUv;
  void main() {
    float core = exp(-pow((vUv.y - 0.5) * 9.0, 2.0));
    float glow = exp(-pow((vUv.y - 0.5) * 3.2, 2.0)) * 0.5;
    float taper = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
    float a = (core + glow) * taper * (1.0 - uT);
    vec3 col = mix(vec3(0.88, 0.28, 0.17), vec3(0.98, 0.95, 0.9), core * (1.0 - uT));
    gl_FragColor = vec4(col, a);
  }
`;

type FX = { wind: number; aura: number; sword: number; squash: number; lean: number; ring: number; slash: number; presence: number };

export class HeroCharacter {
  readonly group = new THREE.Group();
  private body!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private aura!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private swordPivot = new THREE.Group();
  private sword!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private ring!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private slash!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private textures: THREE.Texture[] = [];
  private fx: FX = { wind: 1, aura: 0.25, sword: 0, squash: 0, lean: 0, ring: 1, slash: 1, presence: 0 };
  private planeW: number;
  private planeH: number;
  private hover = 0;
  private armed = true;
  private busy = false;
  private cooldown = 0;
  private tl: gsap.core.Timeline | null = null;
  private tmp = new THREE.Vector3();
  /** called on the release beat — the scene uses it to blow embers outward */
  onRelease: ((origin: THREE.Vector3) => void) | null = null;

  constructor(height: number, onReady?: () => void) {
    this.planeH = height;
    this.planeW = height * (CHARACTER.w / CHARACTER.h);
    const loader = new THREE.TextureLoader();
    let pending = 2;
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
    const bodyTex = load(CHARACTER.body);
    const swordTex = load(CHARACTER.sword);
    const W = this.planeW;
    const H = this.planeH;

    // aura — slightly larger than the body, behind it
    this.aura = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.ShaderMaterial({
        vertexShader: BASIC_VS,
        fragmentShader: AURA_FS,
        uniforms: { uMap: { value: bodyTex }, uTime: { value: 0 }, uPower: { value: 0.25 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.aura.position.z = -0.02;

    // body — subdivided so the coat can move
    const geo = new THREE.PlaneGeometry(1, 1, 48, 36);
    this.body = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        vertexShader: BODY_VS,
        fragmentShader: BODY_FS,
        uniforms: {
          uMap: { value: bodyTex },
          uTime: { value: 0 },
          uWind: { value: 1 },
          uSquash: { value: 0 },
          uOpacity: { value: 0 },
          uLight: { value: new THREE.Vector2(-0.8, 0.6) },
          uRim: { value: 0.55 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.body.scale.set(W, H, 1);

    // sword — its own layer, pivoting at the fist
    const [px, py] = CHARACTER.pivot;
    const pivotLocal = new THREE.Vector2((px / CHARACTER.w - 0.5) * W, (0.5 - py / CHARACTER.h) * H);
    this.swordPivot.position.set(pivotLocal.x, pivotLocal.y, 0.01);
    this.sword = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: swordTex, transparent: true, depthWrite: false, opacity: 0 }),
    );
    this.sword.position.set(-pivotLocal.x, -pivotLocal.y, 0);
    this.swordPivot.add(this.sword);

    // release effects
    this.ring = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ vertexShader: BASIC_VS, fragmentShader: RING_FS, uniforms: { uT: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.ring.position.set(pivotLocal.x, pivotLocal.y, 0.03);
    this.slash = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ vertexShader: BASIC_VS, fragmentShader: SLASH_FS, uniforms: { uT: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.slash.position.set(pivotLocal.x - W * 0.35, pivotLocal.y + H * 0.08, 0.04);
    this.slash.rotation.z = 0.32;

    this.group.add(this.aura, this.body, this.swordPivot, this.ring, this.slash);
    // drawn after every scenery layer, in this order
    [this.aura, this.body, this.sword, this.ring, this.slash].forEach((m, i) => (m.renderOrder = 200 + i));
  }

  /** Stand the figure with its feet on `top` (world). */
  placeOn(top: THREE.Vector3) {
    const [ax, ay] = CHARACTER.anchor;
    this.group.position.set(top.x + (0.5 - ax) * this.planeW, top.y + (0.5 - ay) * this.planeH, top.z);
  }

  /** 0 → absent, 1 → fully present (used by the intro's assembly). */
  setPresence(v: number) {
    this.fx.presence = v;
  }

  /** Hit test in screen px against the figure (not the long blade). */
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

  /** Tap on touch devices. */
  tap(px: number, py: number, cam: THREE.Camera, w: number, h: number) {
    if (this.hit(px, py, cam, w, h)) this.encounter();
  }

  /** The encounter: notice → anticipation → sword rises → release → rest. */
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
      // notice — the air around him changes
      .to(fx, { aura: 0.55, wind: 1.9, duration: 0.3, ease: "power2.out" }, 0)
      // anticipation — he settles, the blade dips
      .to(fx, { squash: 1, lean: -0.012, sword: 0.07, duration: 0.28, ease: "power2.inOut" }, 0.22)
      // the blade rises
      .to(fx, { sword: -0.42, squash: 0, lean: 0.01, aura: 1, duration: 0.32, ease: "expo.out" }, 0.5)
      // release
      .call(() => {
        this.tmp.copy(this.swordPivot.position);
        this.group.localToWorld(this.tmp);
        this.onRelease?.(this.tmp.clone());
      }, [], 0.6)
      .fromTo(fx, { ring: 0 }, { ring: 1, duration: 0.9, ease: "power2.out" }, 0.58)
      .fromTo(fx, { slash: 0 }, { slash: 1, duration: 0.7, ease: "power3.out" }, 0.6)
      // rest
      .to(fx, { sword: 0, lean: 0, aura: 0.25, wind: 1, duration: 1.1, ease: "power3.inOut" }, 1.35);
  }

  update(t: number, dt: number, pointer: { px: number; py: number; active: boolean }, cam: THREE.Camera, w: number, h: number, still = false) {
    const fx = this.fx;
    if (!still) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      const over = pointer.active && this.hit(pointer.px, pointer.py, cam, w, h);
      if (over) this.hover += dt;
      else {
        this.hover = 0;
        if (!this.busy) this.armed = true;
      }
      if (over && this.armed && this.hover > 0.12) this.encounter();
    }

    const pres = fx.presence;
    const b = this.body.material.uniforms;
    b.uTime.value = t;
    b.uWind.value = still ? 0 : fx.wind;
    b.uSquash.value = fx.squash;
    b.uOpacity.value = pres;
    const a = this.aura.material.uniforms;
    a.uTime.value = t;
    a.uPower.value = fx.aura;
    a.uOpacity.value = pres;
    this.sword.material.opacity = pres;
    // the blade points left: in y-up space a negative z-rotation lifts its tip
    this.swordPivot.rotation.z = fx.sword; // positive dips the tip, negative raises it
    this.group.rotation.z = fx.lean;

    // release effects
    const ringR = this.planeH * (0.15 + fx.ring * 1.4);
    this.ring.scale.set(ringR, ringR, 1);
    this.ring.material.uniforms.uT.value = fx.ring;
    this.ring.visible = fx.ring < 0.999;
    this.slash.scale.set(this.planeW * 2.6 * Math.min(1, fx.slash * 3), this.planeH * 0.05, 1);
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
