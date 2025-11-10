import React, { useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import data from "../../data/projects.json";
import "./Projects3D.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lightweight ProjectPanel - plane with an HTML overlay for text.
 * Kept simple to reduce overhead.
 */
function ProjectPanel({ project, position, rotation, index }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Panel surface */}
      <mesh castShadow receiveShadow>
        <planeGeometry args={[4.2, 2.5]} />
        <meshStandardMaterial
          color={"#071017"}
          roughness={0.6}
          metalness={0.2}
          emissive={"#00121a"}
          emissiveIntensity={0.02}
        />
      </mesh>

      {/* Thin neon rim - subtle emissive plane slightly in front */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[4.2, 2.5]} />
        <meshBasicMaterial
          color={index % 3 === 0 ? "#00ffff" : index % 3 === 1 ? "#ff00ff" : "#8affc7"}
          transparent
          opacity={0.06}
        />
      </mesh>

      {/* HTML content — small, centered, transform for 3D */}
      <Html
        transform
        distanceFactor={1.6}
        style={{
          width: 360,
          pointerEvents: "auto",
          color: "white",
          fontFamily: "Inter, system-ui, Arial",
          lineHeight: "1.2",
        }}
      >
        <div className="panel-card">
          <h3 className="panel-title">{project.name}</h3>
          <p className="panel-summary">{project.summary}</p>
          <div className="panel-tech">
            {project.tech.map((t, i) => (
              <span key={i} className="panel-tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * Room geometry (floor + three walls). Kept low-poly and cheap.
 */
function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#020203" roughness={1} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -20]}>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial color="#040508" />
      </mesh>

      {/* Right wall */}
      <mesh position={[25, 0, -10]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[40, 20]} />
        <meshStandardMaterial color="#040508" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-25, 0, -10]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[40, 20]} />
        <meshStandardMaterial color="#040508" />
      </mesh>
    </group>
  );
}

/**
 * CameraRig: sets up a GSAP timeline that scrub-animates the camera along
 * a computed path. The section containing the canvas should be pinned.
 */
function CameraRig({ positions, lookAt = [0, 0, -10], containerSelector = "#projects-3d" }) {
  const { camera } = useThree();
  const tlRef = useRef(null);

  useEffect(() => {
    if (!positions || positions.length === 0) return;

    // ensure camera starts at first position
    camera.position.set(...positions[0]);
    camera.lookAt(...lookAt);

    // build timeline that animates camera position through the positions array
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerSelector,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        // markers: true, // enable for debugging
      },
    });

    // animate sequentially through positions
    positions.forEach((pos, i) => {
      // duration proportional to distance is nicer but fixed here is simpler & consistent
      tl.to(
        camera.position,
        {
          x: pos[0],
          y: pos[1],
          z: pos[2],
          duration: 1,
          ease: "power1.inOut",
          onUpdate: () => {
            camera.lookAt(...lookAt);
          },
        },
        i // place at each step
      );
    });

    tlRef.current = tl;

    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
      }
      ScrollTrigger.getAll().forEach((s) => s.kill());
    };
  }, [positions, camera, lookAt, containerSelector]);

  return null;
}

/**
 * Main page component
 */
export default function Projects3D() {
  const projects = useMemo(() => data.projects || [], []);

  // Compute logical positions for camera and panels:
  // we place groups of panels on three walls and stagger by 'row'
  const spacing = 6; // distance between successive rows (z axis)
  const wallOffsetX = 8; // distance from center to walls

  // For each project compute its panel position (left wall, right wall, back wall)
  const panels = useMemo(() => {
    return projects.map((p, i) => {
      const wall = i % 3; // 0 = left wall, 1 = right wall, 2 = back
      const row = Math.floor(i / 3);
      const z = -6 - row * spacing; // start a bit into the room and go deeper
      if (wall === 0) return { project: p, position: [-wallOffsetX, 0, z], rotation: [0, 0.25, 0] };
      if (wall === 1) return { project: p, position: [wallOffsetX, 0, z], rotation: [0, -0.25, 0] };
      return { project: p, position: [0, 0, z - 3], rotation: [0, 0, 0] };
    });
  }, [projects]);

  // Camera positions: start near entrance and move deeper, sweep left-right-back-center
  const cameraPositions = useMemo(() => {
    const baseZ = 8; // camera starts in front of the room
    const path = [];

    // Start: outside the room looking in
    path.push([0, 2.4, baseZ]);

    // For each 'row' advance camera forward a bit and do a small orbit
    const rows = Math.ceil(projects.length / 3);
    for (let r = 0; r <= rows; r++) {
      const z = 4 - r * spacing; // move forward each step
      // center view
      path.push([0, 2.0, z]);
      // slight right sweep
      path.push([6, 2.2, z - 2]);
      // slight left sweep
      path.push([-6, 2.2, z - 2]);
    }

    // final: pull back a bit
    path.push([0, 2.5, -14]);

    // reduce duplicates (GSAP still handles duplicates okay)
    return path;
  }, [projects.length]);

  // Set container height: number of path steps -> more realistic scroll length
  const pageHeight = Math.max(150 * (Math.ceil(projects.length / 3) + 2), 1000); // px fallback

  return (
    <section id="projects-3d" className="projects-3d-section" style={{ minHeight: `${pageHeight}vh` }}>
      {/* Intro overlay (HTML) */}
      <div className="projects-3d-intro">
        <h1>{data.title || "Projects"}</h1>
        <p className="intro-sub">Explore our AI × Biology projects — scroll to move through the lab.</p>
      </div>

      <Canvas
        className="projects-3d-canvas"
        camera={{ position: [0, 2, 8], fov: 55 }}
        gl={{ antialias: false, physicallyCorrectLights: false }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
      >
        <color attach="background" args={["#010101"]} />
        {/* Lights (kept light and cheap) */}
        <ambientLight intensity={0.35} />
        <directionalLight intensity={0.6} position={[5, 10, 5]} />
        <pointLight color="#00ffff" intensity={0.6} position={[0, 6, 8]} distance={40} />

        <Suspense fallback={null}>
          <Room />

          {/* Panels */}
          {panels.map((p, i) => (
            <Float key={i} speed={0.6} rotationIntensity={0.02} floatIntensity={0.2}>
              <ProjectPanel project={p.project} position={p.position} rotation={p.rotation} index={i} />
            </Float>
          ))}
        </Suspense>

        {/* Camera rig that is driven by scroll */}
        <CameraRig positions={cameraPositions} lookAt={[0, 0, -8]} containerSelector={"#projects-3d"} />
      </Canvas>
    </section>
  );
}
