/**
 * Work environment — flowing ink behind the project theatre.
 *
 * One full-screen fragment shader (raw WebGL, no scene graph): domain-warped ink smoke
 * in black/grey with vermillion veins. Each project sets its own flow, turbulence and
 * amount of red; a cut floods a vermillion wash along the slash line that recedes
 * into the next project's ink. The cursor parts the ink and carries a faint ember light.
 * Rendered at reduced resolution (soft by nature) and paused off-screen.
 */

const VS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform float uSeed;
uniform vec2 uDir;
uniform float uRed;
uniform float uTurb;
uniform float uFlood;

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a * n(p); p = r * p * 2.02; a *= 0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  // the hand parts the ink
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  vec2 dm = p - m;
  float md = length(dm);
  p += normalize(dm + 1e-4) * 0.13 * exp(-md * 5.5) * uMouseOn;

  float t = uTime * 0.045;
  vec2 q = vec2(fbm(p * 1.5 + uDir * t + uSeed), fbm(p * 1.5 + vec2(5.2, 1.3) - uDir * t * 0.7));
  vec2 r = vec2(fbm(p * 1.5 + uTurb * q + vec2(1.7, 9.2) + t * 0.6), fbm(p * 1.5 + uTurb * q + vec2(8.3, 2.8) - t * 0.4));
  float v = fbm(p * 1.3 + 3.4 * r);

  vec3 ember = vec3(0.878, 0.282, 0.173);
  vec3 col = vec3(0.031);
  float smoke = smoothstep(0.38, 0.95, v);
  col = mix(col, vec3(0.13, 0.125, 0.13), smoke * 0.85);
  // thin vermillion veins where the warp folds
  float vein = (1.0 - smoothstep(0.0, 0.03, abs(r.x - 0.52))) * smoothstep(0.45, 0.85, v);
  col += ember * vein * (0.18 + 0.7 * uRed);
  // ember light at the hand
  col += ember * exp(-md * 4.5) * 0.1 * uMouseOn + vec3(0.95) * exp(-md * 16.0) * 0.025 * uMouseOn;

  // the cut's flood: a vermillion wash along the slash (64% → 30% from the top)
  vec2 a0 = vec2(0.0, 0.36), a1 = vec2(1.0, 0.70);
  vec2 ab = (a1 - a0) * vec2(asp, 1.0);
  vec2 ap = (uv - a0) * vec2(asp, 1.0);
  float d = abs(ab.x * ap.y - ab.y * ap.x) / length(ab);
  float spread = uFlood * 1.4;
  float wash = (1.0 - smoothstep(spread - 0.22, spread, d)) * step(0.001, uFlood) * sin(3.14159 * clamp(uFlood, 0.0, 1.0));
  col = mix(col, ember * (0.45 + 0.55 * smoke) + vec3(0.06) * vein, wash * 0.85);

  // keep the reading zone (title, idea, links: lower left) quiet
  float read = (1.0 - smoothstep(0.0, 0.75, length((uv - vec2(0.18, 0.2)) * vec2(1.1, 1.5))));
  col *= 1.0 - 0.5 * read;
  // vignette + grain
  col *= 0.75 + 0.25 * (1.0 - smoothstep(0.3, 1.2, length((uv - 0.5) * vec2(asp * 0.8, 1.0))));
  col += (h(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.015;
  o = vec4(col, 1.0);
}`;

export type InkLook = { seed: number; dir: [number, number]; red: number; turb: number };

export class InkField {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private buf!: WebGLBuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private running = false;
  private t0 = performance.now();
  private scale: number;
  private mouse = { x: -9999, y: -9999, on: 0, target: 0 };
  /** live values, tweened by the owner */
  readonly look = { seed: 0, dx: 1, dy: 0.3, red: 0.2, turb: 3, flood: 0 };

  static supported() {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  }

  constructor(private canvas: HTMLCanvasElement, opts: { mobile: boolean }) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) throw new Error("webgl2 unavailable");
    this.gl = gl;
    this.scale = opts.mobile ? 0.35 : 0.5;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer()!;
    this.buf = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const k of ["uRes", "uTime", "uMouse", "uMouseOn", "uSeed", "uDir", "uRed", "uTurb", "uFlood"]) this.u[k] = gl.getUniformLocation(prog, k);
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(2, Math.round(r.width * this.scale));
    this.canvas.height = Math.max(2, Math.round(r.height * this.scale));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setLook(l: InkLook) {
    Object.assign(this.look, { seed: l.seed, dx: l.dir[0], dy: l.dir[1], red: l.red, turb: l.turb });
  }

  setPointer(clientX: number, clientY: number, on: boolean) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = (clientX - r.left) * this.scale;
    this.mouse.y = (r.height - (clientY - r.top)) * this.scale;
    this.mouse.target = on ? 1 : 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.draw();
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  draw() {
    const gl = this.gl;
    const u = this.u;
    const L = this.look;
    this.mouse.on += (this.mouse.target - this.mouse.on) * 0.06;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, (performance.now() - this.t0) / 1000);
    gl.uniform2f(u.uMouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(u.uMouseOn, this.mouse.on);
    gl.uniform1f(u.uSeed, L.seed);
    gl.uniform2f(u.uDir, L.dx, L.dy);
    gl.uniform1f(u.uRed, L.red);
    gl.uniform1f(u.uTurb, L.turb);
    gl.uniform1f(u.uFlood, L.flood);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Frees GPU objects but keeps the context: the same canvas may host a new InkField
   *  (React re-mounts effects), and a lost context can't be recovered from the canvas. */
  dispose() {
    this.stop();
    const gl = this.gl;
    gl.deleteBuffer(this.buf);
    gl.deleteProgram(this.prog);
  }
}
