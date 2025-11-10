import React, { useEffect, useRef } from "react";
import "./Projects.css";
import useDocumentTitle from "../../CustomHooks/useDocumentTitle";
import data from "../../data/projects.json";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
  useDocumentTitle("Projects");

  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const lenisRef = useRef(null);

  useEffect(() => {
    // === Lenis tuned for buttery & accurate scroll ===
    const lenis = new Lenis({
      duration: 1.35,        // inertia
      lerp: 0.08,            // catch-up speed
      smoothWheel: true,
      smoothTouch: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.7,
      syncTouch: true,
      direction: "vertical",
    });
    lenisRef.current = lenis;

    // === Link Lenis + GSAP ticker ===
    gsap.ticker.lagSmoothing(0);
    const update = (time) => {
      lenis.raf(time * 1000);
      ScrollTrigger.update();
    };
    gsap.ticker.add(update);
    lenis.on("scroll", ScrollTrigger.update);

    // === Refresh ScrollTrigger on resize/content change ===
    const refresh = () => ScrollTrigger.refresh(true);
    window.addEventListener("resize", refresh);
    const resizeObs = new ResizeObserver(refresh);
    resizeObs.observe(sectionRef.current);

    // === GSAP Animations ===
    const ctx = gsap.context(() => {
      const cards = cardsRef.current;

      // Fade-in section
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, yPercent: 10, force3D: true },
        { opacity: 1, yPercent: 0, duration: 1.1, ease: "power3.out" }
      );

      // Fly-in / out cards
      cards.forEach((card) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            end: "bottom 5%",
            scrub: 1.3,
          },
        });

        tl.fromTo(
          card,
          {
            opacity: 0,
            y: 220,
            z: -300,
            rotateX: 20,
            scale: 0.9,
            force3D: true,
          },
          {
            opacity: 1,
            y: 0,
            z: 0,
            rotateX: 0,
            scale: 1,
            duration: 1.4,
            ease: "power3.out",
          }
        ).to(card, {
          opacity: 0,
          y: -200,
          z: 180,
          rotateX: -12,
          scale: 0.92,
          duration: 1.3,
          ease: "power2.inOut",
        });
      });

      // GPU parallax mouse tilt
      const handleMouseMove = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        gsap.to(".projects-grid", {
          rotationY: x,
          rotationX: -y,
          ease: "power2.out",
          duration: 1,
          transformPerspective: 1000,
          transformOrigin: "center",
          force3D: true,
        });
      };
      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    }, sectionRef);

    // === Cleanup ===
    return () => {
      resizeObs.disconnect();
      window.removeEventListener("resize", refresh);
      gsap.ticker.remove(update);
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div className="projects-lenis">
      <section className="projects-section" ref={sectionRef}>
        <header className="projects-header">
          <h1>Projects</h1>
          <p>Scroll down — watch ideas lift, hover, and fade into the next.</p>
        </header>

        <div className="projects-grid">
          {data.projects.map((p, i) => (
            <div
              key={i}
              className="project-card"
              ref={(el) => (cardsRef.current[i] = el)}
            >
              <div className="project-content">
                <h3>{p.name}</h3>
                <p>{p.summary}</p>
                <div className="tech-tags">
                  {p.tech.map((t, j) => (
                    <span key={j}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add spacer so bottom always reachable */}
        <div className="projects-bottom-spacer" />
      </section>
    </div>
  );
};

export default Projects;
