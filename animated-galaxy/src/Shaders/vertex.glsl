uniform float uSize;
attribute float aScale;
uniform float uTime;
attribute vec3 color;
varying vec3 vColor;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float time = uTime * 0.25;

    // --- 🌌 Elegant dynamic spiral math pattern ---
    // Combines rotation, radial breathing, and small turbulence
    float angle = atan(modelPosition.z, modelPosition.x);
    float radius = length(modelPosition.xz);

    // Add subtle wave distortion and breathing
    float wave = sin(radius * 3.0 - time * 2.0) * 0.9;
    float breathing = 1.5 * sin(time * 0.7 + radius * 2.0);
    float swirl = 3.0 *( time + radius * 0.8);

    // New radius evolution (adds life)
    radius += breathing + wave;

    // Angular acceleration for swirling feel
    angle += swirl * 0.5 + sin(time * 0.4 + radius) * 0.2;

    // Updated Cartesian coordinates
    modelPosition.x = cos(angle) * radius;
    modelPosition.z = sin(angle) * radius;

    // Subtle vertical wave (galaxy breathing)
    modelPosition.y += sin(radius * 2.0 - time * 1.5) * 0.05;

    // --- Final projection ---
    vec4 modelView = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * modelView;

    // Point size and color
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (-1.0 / modelView.z);
    vColor = color;
}
