import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import { API_ENDPOINTS, fetchData } from "../../config/api";
import { LoadingSpinner, ErrorState } from "../../Components/Loading";
import "./Team.css";

gsap.registerPlugin(ScrollTrigger);

export default function Team() {
  const containerRef = useRef(null);
  const scrollRef = useRef(0);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const pulseRef = useRef(0);
  const surgeRef = useRef({ intensity: 0 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const teamData = await fetchData(API_ENDPOINTS.team);
        setData(teamData);
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      smoothTouch: false,
      lerp: 0.1,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Lenis doesn't expose `update()`; call raf with current time to sync
    const onRefresh = () => {
      try {
        // requestAnimationFrame timestamps are in ms, so use performance.now()
        lenis.raf(performance.now());
      } catch (e) {
        // fallback: call ScrollTrigger.update to ensure layout recalculation
        ScrollTrigger.update();
      }
    };

    lenis.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        // Setter: delegate to Lenis
        if (arguments.length) {
          // prefer lenis.scrollTo if available
          if (typeof lenis.scrollTo === 'function') {
            lenis.scrollTo(value);
            return;
          }
          // fallback to native scroll
          window.scrollTo(0, value);
          return;
        }

        // Getter: try Lenis exposed value, otherwise fallback to window
        if (typeof lenis.scroll === 'number') return lenis.scroll;
        if (lenis?.scroll?.instance && typeof lenis.scroll.instance.scroll === 'number') {
          return lenis.scroll.instance.scroll;
        }
        return window.scrollY || document.documentElement.scrollTop || 0;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    ScrollTrigger.defaults({ scroller: document.body });
    ScrollTrigger.addEventListener("refresh", onRefresh);
    ScrollTrigger.refresh();

    return () => {
      lenis.destroy();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!data) return; // Wait for data to load

    const ctx = gsap.context(() => {
      // Heading fade-in
      gsap.from(titleRef.current, {
        opacity: 0,
        y: -60,
        duration: 1.4,
        ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
      });

      // Card stagger entry
      cardsRef.current.forEach((card, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        gsap.from(card, {
          opacity: 0,
          x: dir * 120,
          rotateY: dir * 10,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 90%" },
        });
      });

      // Scroll progress
      gsap.to(scrollRef, {
        current: 1,
        scrollTrigger: { scrub: true, start: "top top", end: "bottom bottom" },
      });

      // Energy surge trigger
      gsap.to(surgeRef.current, {
        intensity: 1,
        duration: 1.8,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top 80%",
          toggleActions: "play reverse play reverse",
          onEnter: () => {
            gsap.to(surgeRef.current, { intensity: 1, duration: 1.2 });
            setTimeout(() => {
              gsap.to(surgeRef.current, { intensity: 0, duration: 2 });
            }, 1200);
          },
        },
      });
    });

    return () => ctx.revert();
  }, [data]);

  if (loading) {
    return <LoadingSpinner variant="ring" />;
  }

  if (!data) {
    return <ErrorState message="Failed to load team data. Please try again later." />;
  }

  // 🌌 Starfield
  function Starfield({ count = 9000, scrollRef, surgeRef }) {
    const points = useRef();

    const positions = useMemo(() => {
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 100 + Math.random() * 700;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i * 3 + 2] = r * Math.cos(phi);
      }
      return arr;
    }, [count]);

    useFrame((state, delta) => {
      if (!points.current) return;
      points.current.rotation.y += delta * 0.012;
      const t = state.clock.getElapsedTime();
      const s = scrollRef.current;
      const surge = surgeRef.current.intensity;

      // Randomized camera motion
      const cam = state.camera;
      cam.position.x = Math.sin(t * 0.25) * 10 * s;
      cam.position.y = Math.cos(t * 0.2) * 5 * s;
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, 90 - s * 50 - surge * 15, 0.05);
      cam.rotation.z = surge * 0.1;
      cam.lookAt(0, 0, 0);

      points.current.material.uniforms.uTime.value = t;
      points.current.material.uniforms.uSurge.value = surge;
    });

    const vertex = `
      uniform float uTime;
      void main(){
        vec3 pos = position;
        pos.x += sin(uTime*0.3 + pos.y*0.1)*0.8;
        pos.y += cos(uTime*0.3 + pos.x*0.1)*0.8;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 3.2 * (250.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragment = `
      uniform float uSurge;
      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        if(d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        vec3 color = mix(vec3(0.3, 0.8, 1.0), vec3(1.0, 1.0, 1.0), uSurge);
        gl_FragColor = vec4(color, glow * (1.0 + uSurge*1.2));
      }
    `;

    return (
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={{
            uTime: { value: 0 },
            uSurge: { value: 0 },
          }}
          vertexShader={vertex}
          fragmentShader={fragment}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </points>
    );
  }

  // ⚡ Constellations with neural pulse
  function Constellations({ cards, hoveredIndex, pulseRef, surgeRef }) {
    const { size } = useThree();
    const group = useRef();
    const [lines, setLines] = useState([]);

    useEffect(() => {
      if (hoveredIndex === null) {
        setLines([]);
        return;
      }

      const hoveredCard = cards[hoveredIndex];
      if (!hoveredCard) return;

      const rects = cards.map((card) => card.getBoundingClientRect());
      const base = rects[hoveredIndex];

      const newLines = rects
        .filter((_, i) => i !== hoveredIndex)
        .map((r) => {
          const dist = Math.hypot(base.x - r.x, base.y - r.y);
          const opacity = Math.max(0, 1 - dist / 600);
          return { start: base, end: r, opacity, dist };
        });

      setLines(newLines);
      pulseRef.current = 0;
    }, [hoveredIndex, cards, pulseRef]);

    useFrame((state, delta) => {
      if (!group.current) return;
      pulseRef.current += delta * 2.5;
      const pulse = Math.abs(Math.sin(pulseRef.current));
      const surge = surgeRef.current.intensity;

      group.current.children.forEach((line, i) => {
        const opacity = lines[i]?.opacity ?? 0;
        const intensity = opacity * (0.5 + 0.5 * pulse + surge);
        line.material.opacity = THREE.MathUtils.lerp(
          line.material.opacity,
          intensity,
          0.2
        );
        line.material.color.setHSL(0.55 + 0.05 * surge, 1, 0.5 + 0.25 * pulse);
      });
    });

    return (
      <group ref={group}>
        {lines.map((l, i) => {
          const x1 = (l.start.x / size.width) * 2 - 1;
          const y1 = -(l.start.y / size.height) * 2 + 1;
          const x2 = (l.end.x / size.width) * 2 - 1;
          const y2 = -(l.end.y / size.height) * 2 + 1;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x1 * 50, y1 * 30, 0),
            new THREE.Vector3(x2 * 50, y2 * 30, 0),
          ]);
          return (
            <line key={i} geometry={geometry}>
              <lineBasicMaterial
                color={"#38bdf8"}
                transparent
                opacity={0}
                linewidth={1.5}
              />
            </line>
          );
        })}
      </group>
    );
  }

  return (
    <div className="team-container" ref={containerRef}>
      <Canvas
        className="team-bg"
        camera={{ position: [0, 0, 90], fov: 65 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Starfield scrollRef={scrollRef} surgeRef={surgeRef} />
        <Constellations
          cards={cardsRef.current}
          hoveredIndex={hoveredIndex}
          pulseRef={pulseRef}
          surgeRef={surgeRef}
        />
      </Canvas>

      <div className="team-content">
        <h1 ref={titleRef} className="team-title">Our Team</h1>

        <div className="team-grid">
          {data.members.map((m, i) => (
            <div
              className="member-card"
              ref={(el) => (cardsRef.current[i] = el)}
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="card-inner">
                <img src={m.image} alt={m.name} className="avatar" />
                <h3>{m.name}</h3>
                <p className="role">{m.role}</p>
                <p className="bio">{m.bio}</p>
                <div className="links">
                  {m.socials?.github && (
                    <a href={m.socials.github} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                  {m.socials?.linkedin && (
                    <a href={m.socials.linkedin} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cta-section">
          <h2>Join the Collective</h2>
          <p>
            We’re fusing biology and AI to push innovation frontiers. Be part of
            the evolution.
          </p>
          <div className="cta-buttons">
            <a href="mailto:hello@kbg.ai" className="primary-btn">
              Contact Us
            </a>
            <a href="/events" className="secondary-btn">
              Explore Events
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
