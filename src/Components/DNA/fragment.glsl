uniform float time;
varying vec2 vUv;
varying float vColorRandom;

uniform vec3 uColor1; // base cyan
uniform vec3 uColor2; // magenta accent
uniform vec3 uColor3; // bright white-blue core

float PI = 3.141592653589793238;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);

  // Glowing central core and soft rim
  float core = exp(-dist * 8.5);
  float rim = smoothstep(0.35, 0.0, dist);

  // Vertical wave scan pattern
  float scan = sin(time * 3.5 + vUv.y * 30.0) * 0.5 + 0.5;

  // Randomized pulse across DNA strands
  float pulse = 0.5 + 0.5 * sin(time * 2.5 + vColorRandom * 6.283);

  // Cross-interference (adds glow where layers overlap)
  float interference = pow(sin(time * 4.0 + vUv.y * 15.0 + vColorRandom * 3.14), 2.0);

  // Combine energy fields
  float energy = core * 1.6 + rim * 0.5 + scan * 0.4 + interference * 0.6;

  // Multi-hue blending
  vec3 base = mix(uColor1, uColor2, vColorRandom);
  vec3 color = mix(base, uColor3, pulse);
  color = mix(color, vec3(1.0, 0.9, 1.0), interference * 0.4); // adds bright overlap points

  // Amplify emissive brightness
  color *= energy * 2.4;

  // Smooth alpha for edge softness
  float alpha = (core + rim * 0.6) * 1.1;
  if (alpha < 0.02) discard;

  gl_FragColor = vec4(color, alpha);
}
