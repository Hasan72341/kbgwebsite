const dnaVertexShader = `
  uniform float time;
  varying vec2 vUv;
  varying float vColorRandom;
  attribute float randoms;
  attribute float colorRandoms;
  float PI = 3.141592653589793238;

  void main() {
    vUv = uv;
    vColorRandom = colorRandoms;
    vec3 pos = position;

    // Twisting, breathing motion
    pos.x += sin(time * 1.5 + randoms * 8.0) * 0.05;
    pos.z += cos(time * 1.3 + randoms * 6.0) * 0.05;
    pos.y += sin(time * 0.6 + pos.x * 3.0) * 0.03;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // 🧬 Larger and smoother particle scaling
    float baseSize = (90.0 * randoms + 25.0); // increased from 40 → 90
    float pulse = sin(time * 1.5 + randoms * PI) * 0.3 + 1.25;

    // Distance-based size falloff (so near DNA looks denser)
    float depthFactor = clamp(15.0 / -mvPosition.z, 0.5, 2.0);

    gl_PointSize = baseSize * pulse * depthFactor * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
