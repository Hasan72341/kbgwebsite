import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./DNAVisualizer.css";

gsap.registerPlugin(ScrollTrigger);

const morphMixer = { value: 0 };

const computeMorphFactor = (progress) => {
  if (progress <= 0) {
    return 0;
  }
  if (progress < 0.25) {
    const eased = Math.pow(progress / 0.25, 1.6);
    return eased * 0.35;
  }
  if (progress < 0.65) {
    const eased = Math.pow((progress - 0.25) / 0.4, 1.2);
    return 0.35 + eased * 0.45;
  }
  const tail = Math.pow((progress - 0.65) / 0.35, 0.85);
  return Math.min(1, 0.8 + tail * 0.2);
};

const DNAVisualizer = ({ variant = "hero" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    morphMixer.value = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1200);
    camera.position.set(0, variant === "hero" ? -1.5 : -0.5, 18);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    const clock = new THREE.Clock();

    const updateRendererSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    updateRendererSize();
    window.addEventListener("resize", updateRendererSize);

    const isMobile = (container.clientWidth || window.innerWidth) <= 768;

    let virusMesh = null;
    let constellationsLine = null;
    let constellationLineGeometry = null;
    let constellationLineMaterial = null;
    let animationFrameId = 0;
    let scrollTriggerInstance = null;
    let arrivedOrbit = false;
    let warpTarget = 0;
    let morphTarget = 0;

    const virusVertex = `
      precision highp float;

      attribute float scale;
      attribute vec3 aColor;
      attribute vec3 stateVirus;
      attribute vec3 stateAbstract;

      uniform float uTime;
      uniform float uWarp;
      uniform float uMorph;

      varying vec3 vColor;
      varying float vMorph;
      varying float vSpike;
      varying float vDepth;

      void main() {
        vMorph = uMorph;

        vec3 positionMix = mix(stateVirus, stateAbstract, uMorph);

        float t = uTime * 0.6;
        vec3 wave = vec3(
          sin(t + positionMix.y * 0.015),
          cos(t * 1.2 + positionMix.z * 0.01),
          sin(t * 0.8 + positionMix.x * 0.012)
        );

        vec3 pos = positionMix + wave * mix(2.0, 8.0, uMorph);

        float radial = length(positionMix) + 0.0001;
        float breathing = sin(uTime * 1.35 + radial * 0.012) * mix(2.2, 4.8, 1.0 - uMorph * 0.4);
        pos += normalize(positionMix) * breathing;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDepth = -mvPosition.z;

        float spikeWave = sin(uTime * 3.2 + positionMix.y * 0.045 + positionMix.x * 0.03);
        vSpike = spikeWave;

        float pulsate = 1.0 + 0.18 * sin(uTime * 2.2 + positionMix.x * 0.02);
        float spikeBoost = mix(1.35 + spikeWave * 0.45, 1.0 + abs(spikeWave) * 0.6, uMorph);
        float warpFactor = 1.0 + uWarp * 0.55;
        gl_PointSize = scale * pulsate * spikeBoost * (480.0 / vDepth) * warpFactor;

        gl_Position = projectionMatrix * mvPosition;

        vec3 warm = mix(vec3(0.96, 0.35, 0.22), vec3(0.98, 0.55, 0.35), aColor.x);
        vec3 cool = mix(vec3(0.30, 0.85, 0.95), vec3(0.78, 0.26, 1.0), aColor.y);
        vec3 accent = mix(vec3(1.0, 0.68, 0.45), vec3(0.45, 1.0, 0.92), aColor.z);
        vColor = mix(warm, cool, uMorph);
        vColor = mix(vColor, accent, 0.25 + 0.35 * aColor.z);
      }
    `;

    const virusFragment = `
      precision highp float;

      uniform float uTime;

      varying vec3 vColor;
      varying float vMorph;
      varying float vSpike;
      varying float vDepth;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);

        float core = exp(-dist * 6.0);
        float membrane = smoothstep(0.45, 0.1, dist);
        float spikePattern = pow(max(0.0, sin(angle * 14.0 + uTime * 4.0) + vSpike * 0.8), 2.0);
        float spikeRing = smoothstep(0.38, 0.0, dist) * spikePattern;
        float proteinDots = smoothstep(0.32, 0.05, dist) * (0.4 + 0.6 * sin(angle * 5.0 - uTime * 3.0));
        float virusShape = core * 1.5 + membrane * 0.6 + spikeRing + proteinDots * 0.4;

        float abstractRadial = sin(dist * 18.0 - uTime * 5.0 + vSpike) * 0.5 + 0.5;
        float abstractSpiral = sin(angle * 6.0 + uTime * 2.5) * (1.0 - dist);
        float abstractShell = exp(-dist * 2.0) * (0.55 + 0.35 * sin(uTime * 3.0 + angle * 3.0));
        float abstractShape = abstractRadial + abstractSpiral + abstractShell;

        float shape = mix(virusShape, abstractShape, vMorph);

        float depthFade = clamp(1.0 - vDepth * 0.0006, 0.3, 1.0);
        vec3 highlight = mix(vec3(0.92, 0.52, 0.42), vec3(0.42, 0.86, 1.0), vMorph);
        vec3 base = vColor * (0.65 + 0.25 * sin(uTime * 1.4 + dist * 6.0));
        vec3 color = mix(highlight, base, 0.5 + 0.4 * shape);
        color *= mix(0.58, 0.88, vMorph) * depthFade;

        float alpha = smoothstep(0.55, 0.1, dist) * clamp(shape * depthFade * 0.95, 0.0, 0.92);

        if (alpha < 0.025) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const virusCount = isMobile ? 1800 : 5000;
    const stateVirus = new Float32Array(virusCount * 3);
    const stateAbstract = new Float32Array(virusCount * 3);
    const scales = new Float32Array(virusCount);
    const colors = new Float32Array(virusCount * 3);

    const seededNoise = (seed) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const jitter = (seed, range) => (seededNoise(seed) - 0.5) * range;

    const clusterCount = isMobile ? 4 : 7;
    const clusterCenters = Array.from({ length: clusterCount }, (_, idx) => {
      const u = seededNoise(idx + 1);
      const v = seededNoise(idx + 17);
      const theta = 2.0 * Math.PI * u;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = THREE.MathUtils.lerp(isMobile ? 60 : 80, isMobile ? 160 : 220, seededNoise(idx + 33));
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.cos(phi) * radius * 0.7;
      const z = Math.sin(phi) * Math.sin(theta) * radius;
      return { x, y, z };
    });

    const totalConstellations = isMobile ? 4 : 6;
    const nodesPerConstellation = isMobile ? 5 : 7;
    const constellationDefs = Array.from({ length: totalConstellations }, (_, cIdx) => {
      const nodes = [];
      const baseAngle = (cIdx / totalConstellations) * Math.PI * 2.0;
      const baseRadius = THREE.MathUtils.lerp(isMobile ? 190 : 230, isMobile ? 280 : 340, seededNoise(cIdx + 91));
      for (let n = 0; n < nodesPerConstellation; n++) {
        const nodeSeed = (cIdx + 1) * 100 + n * 7;
        const angleOffset = THREE.MathUtils.degToRad(18 * n) + seededNoise(nodeSeed) * 0.35;
        const radius = baseRadius + jitter(nodeSeed + 5, 46);
        const height = jitter(nodeSeed + 9, isMobile ? 90 : 130);
        const depthWarp = jitter(nodeSeed + 13, isMobile ? 70 : 110);
        const angle = baseAngle + angleOffset + seededNoise(nodeSeed + 2) * 0.25;
        nodes.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius + depthWarp
          )
        );
      }
      return nodes;
    });

    const constellationLinePositions = [];
    const constellationSamples = [];
    const totalSegments = Math.max(
      constellationDefs.reduce((sum, nodes) => sum + Math.max(nodes.length - 1, 0), 0),
      1
    );
    const targetConstellationPoints = Math.floor(virusCount * 0.45);
    const samplesPerSegment = Math.max(2, Math.floor(targetConstellationPoints / totalSegments));

    constellationDefs.forEach((nodes, cIdx) => {
      for (let i = 0; i < nodes.length - 1; i++) {
        const start = nodes[i];
        const end = nodes[i + 1];
        constellationLinePositions.push(start.x, start.y, start.z, end.x, end.y, end.z);
        for (let s = 1; s <= samplesPerSegment && constellationSamples.length < targetConstellationPoints; s++) {
          const t = s / (samplesPerSegment + 1);
          const point = new THREE.Vector3().lerpVectors(start, end, t);
          const seedBase = (cIdx + 1) * 1000 + (i + 1) * 50 + s;
          point.x += jitter(seedBase, 26);
          point.y += jitter(seedBase + 1, 32);
          point.z += jitter(seedBase + 2, 26);
          constellationSamples.push(point);
        }
      }
    });

    for (let i = 0; i < virusCount; i++) {
      const i3 = i * 3;

      let vx;
      let vy;
      let vz;
      if (Math.random() < 0.68) {
        const radial = Math.pow(Math.random(), 0.85);
        const baseRadius = THREE.MathUtils.lerp(isMobile ? 80 : 120, isMobile ? 360 : 460, radial);
        const angle = Math.random() * Math.PI * 2 + radial * 2.8;
        const armWave = Math.sin(angle * 3.0 + radial * 5.2) * THREE.MathUtils.lerp(18, 74, Math.random());
        vx = Math.cos(angle) * baseRadius + armWave;
        vz = Math.sin(angle) * baseRadius + Math.cos(angle * 1.4) * armWave * 0.6;
        vy = THREE.MathUtils.lerp(-160, 160, Math.random()) * (1.0 - radial * 0.45);
      } else {
        const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        const spread = THREE.MathUtils.lerp(20, isMobile ? 38 : 54, Math.random());
        const spreadY = spread * THREE.MathUtils.lerp(1.4, 2.3, Math.random());
        vx = center.x + THREE.MathUtils.randFloatSpread(spread);
        vy = center.y + THREE.MathUtils.randFloatSpread(spreadY);
        vz = center.z + THREE.MathUtils.randFloatSpread(spread);
      }

      stateVirus[i3] = vx;
      stateVirus[i3 + 1] = vy;
      stateVirus[i3 + 2] = vz;

      if (i < constellationSamples.length) {
        const point = constellationSamples[i];
        stateAbstract[i3] = point.x;
        stateAbstract[i3 + 1] = point.y;
        stateAbstract[i3 + 2] = point.z;
      } else {
        const swirlAngle = Math.random() * Math.PI * 5.5 + i * 0.0025;
        const swirlRadius = THREE.MathUtils.lerp(180, isMobile ? 360 : 520, Math.pow(Math.random(), 0.7));
        const swirlHeight = THREE.MathUtils.lerp(-210, 210, Math.random());
        stateAbstract[i3] = Math.cos(swirlAngle) * swirlRadius;
        stateAbstract[i3 + 1] = swirlHeight + Math.sin(swirlAngle * 1.6) * 70;
        stateAbstract[i3 + 2] = Math.sin(swirlAngle) * swirlRadius;
      }

      scales[i] = THREE.MathUtils.lerp(isMobile ? 16 : 20, isMobile ? 38 : 44, Math.random());

      const toneSeed = Math.random();
      colors[i3] = THREE.MathUtils.lerp(0.2, 1.0, toneSeed);
      colors[i3 + 1] = THREE.MathUtils.lerp(0.2, 1.0, Math.random());
      colors[i3 + 2] = THREE.MathUtils.lerp(0.2, 1.0, Math.random());
    }

    const positions = new Float32Array(stateVirus);
    const virusGeometry = new THREE.BufferGeometry();
    virusGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    virusGeometry.setAttribute("stateVirus", new THREE.BufferAttribute(stateVirus, 3));
    virusGeometry.setAttribute("stateAbstract", new THREE.BufferAttribute(stateAbstract, 3));
    virusGeometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    virusGeometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    virusGeometry.computeBoundingSphere();

    const virusMaterial = new THREE.ShaderMaterial({
      vertexShader: virusVertex,
      fragmentShader: virusFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uWarp: { value: 0 },
        uMorph: { value: 0 },
      },
    });

    virusMesh = new THREE.Points(virusGeometry, virusMaterial);
    virusMesh.frustumCulled = false;
    scene.add(virusMesh);

    if (constellationLinePositions.length > 0) {
      constellationLineGeometry = new THREE.BufferGeometry();
      constellationLineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(constellationLinePositions, 3)
      );
      constellationLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#8cf8ff"),
        transparent: true,
        opacity: 0,
        linewidth: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      constellationsLine = new THREE.LineSegments(constellationLineGeometry, constellationLineMaterial);
      constellationsLine.frustumCulled = false;
      scene.add(constellationsLine);
    }

    const scrollerElement = document.querySelector("[data-lenis-container]");
    const scrollTarget = scrollerElement || window;

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: ".hero-block",
      scroller: scrollTarget,
      start: "top top",
      end: "bottom+=4000 top",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        morphTarget = computeMorphFactor(p);
        warpTarget = THREE.MathUtils.clamp(Math.abs(self.getVelocity()) / 600, 0, 1);

        const depth = 14 - p * 70;
        const lateral = Math.sin(p * Math.PI * 2) * 20;
        const vertical = Math.sin(p * Math.PI) * 7 - 2;

        camera.position.set(lateral, vertical, depth);
        camera.rotation.y = Math.sin(p * Math.PI) * 0.6;
        camera.rotation.x = Math.sin(p * Math.PI * 2) * 0.3;
        camera.lookAt(0, 0, 0);

        if (virusMesh) {
          virusMesh.rotation.y += 0.0008 + morphMixer.value * 0.0015;
          virusMesh.rotation.x = Math.sin(p * Math.PI * 0.5) * 0.2 + morphMixer.value * 0.22;
        }

        if (constellationLineMaterial) {
          constellationLineMaterial.opacity = gsap.utils.interpolate(
            constellationLineMaterial.opacity,
            Math.min(0.6, Math.pow(morphMixer.value, 1.2) * 0.9),
            0.1
          );
        }

        if (p >= 0.99 && !arrivedOrbit) {
          arrivedOrbit = true;
          gsap.to(camera.position, {
            duration: 6,
            x: 8,
            y: 2,
            z: -2,
            ease: "power2.out",
          });
          gsap.to(camera.rotation, {
            duration: 6,
            y: Math.PI / 3,
            x: 0.2,
            ease: "power1.out",
          });
        }
      },
    });

    scrollTriggerInstance.refresh();

    const tick = () => {
      const t = clock.getElapsedTime();
      virusMaterial.uniforms.uTime.value = t;
      morphMixer.value = gsap.utils.interpolate(morphMixer.value, morphTarget, 0.08);
      virusMaterial.uniforms.uMorph.value = morphMixer.value;
      virusMaterial.uniforms.uWarp.value = gsap.utils.interpolate(
        virusMaterial.uniforms.uWarp.value,
        warpTarget,
        0.1
      );
      if (virusMesh) {
        virusMesh.rotation.z = gsap.utils.interpolate(
          virusMesh.rotation.z,
          morphMixer.value * 0.85,
          0.08
        );
      }
      if (constellationsLine && virusMesh) {
        constellationsLine.rotation.copy(virusMesh.rotation);
      }
      if (constellationLineMaterial) {
        constellationLineMaterial.opacity = gsap.utils.interpolate(
          constellationLineMaterial.opacity,
          Math.min(0.9, Math.pow(morphMixer.value, 1.2) * 0.9),
          0.08
        );
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();

    const cleanup = () => {
      scrollTriggerInstance?.kill();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateRendererSize);
      if (constellationsLine) {
        scene.remove(constellationsLine);
        constellationLineGeometry?.dispose();
        constellationLineMaterial?.dispose();
      }
      if (virusMesh) {
        scene.remove(virusMesh);
      }
      virusGeometry.dispose();
      virusMaterial.dispose();
      renderer.dispose();
      scene.clear();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };

    return cleanup;
  }, [variant]);

  return (
    <div className="dna-visualizer dna-visualizer--background">
      <div ref={containerRef} className="dna-visualizer-canvas" />
    </div>
  );
};

export default DNAVisualizer;
