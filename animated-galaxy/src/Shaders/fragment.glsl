varying vec3 vColor;
uniform float uScroll;
uniform vec3 uTint;

void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.45, d);

    vec3 color = mix(vColor, uTint, clamp(uScroll, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
}
