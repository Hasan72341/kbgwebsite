import React, { useEffect, useRef, useState } from "react";
import "./Events.css";
import useDocumentTitle from "../../CustomHooks/useDocumentTitle";
import { API_ENDPOINTS, fetchData } from "../../config/api";
import { LoadingSpinner, ErrorState } from "../../Components/Loading";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

export default function Events() {
  const sectionRef = useRef(null);
  const lenisRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(data?.title || "Events");

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsData = await fetchData(API_ENDPOINTS.events);
        setData(eventsData);
      } catch (error) {
        console.error('Failed to load events data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!data) return; // Wait for data to load

    // === Lenis: tuned for ultimate smoothness ===
    const lenis = new Lenis({
      duration: 2.2,         // ultra long inertia
      lerp: 0.035,           // smaller → smoother interpolation
      smoothWheel: true,
      smoothTouch: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.1,  // long glide on mobile
      syncTouch: true,
      infinite: false,
    });
    lenisRef.current = lenis;

    gsap.ticker.lagSmoothing(0);
    const update = (time) => {
      lenis.raf(time * 1000);
      ScrollTrigger.update();
    };
    gsap.ticker.add(update);
    lenis.on("scroll", ScrollTrigger.update);

    const refresh = () => ScrollTrigger.refresh(true);
    window.addEventListener("resize", refresh);

    // === GSAP context ===
    const ctx = gsap.context(() => {
      const fills = gsap.utils.toArray(".timeline-fill");

      fills.forEach((fill) => {
        const section = fill.closest(".timeline-section");
        gsap.fromTo(
          fill,
          { scaleY: 0, opacity: 0.4 },
          {
            scaleY: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top+=300",
              end: "bottom bottom-=60",
              scrub: true,
              onUpdate: (self) => {
                const c = gsap.utils.interpolate(
                  ["#00ffff", "#ff00ff"]
                )(self.progress);
                fill.style.boxShadow = `0 0 30px ${c}`;
              },
            },
          }
        );
      });

      gsap.utils.toArray(".timeline-row").forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 100, rotateX: 10, filter: "blur(15px)" },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      gsap.utils.toArray(".timeline-dot").forEach((dot) => {
        gsap.to(dot, {
          scale: 1.3,
          duration: 2.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      gsap.fromTo(
        ".timeline-bg-surge",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1.6,
          duration: 3.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".timeline-section.past",
            start: "bottom 90%",
            end: "bottom 20%",
            scrub: true,
          },
        }
      );
    }, sectionRef);

    return () => {
      window.removeEventListener("resize", refresh);
      gsap.ticker.remove(update);
      ctx.revert();
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [data]);

  if (loading) {
    return <LoadingSpinner variant="dna" />;
  }

  if (!data) {
    return <ErrorState message="Failed to load events data. Please try again later." />;
  }

  const renderRows = (events, type) =>
    events.map((event, i) => {
      const isLeft = i % 2 === 0;
      const dotClass =
        type === "upcoming" ? "timeline-dot-upcoming" : "timeline-dot-past";

      const card = (
        <div className={`timeline-card card-${type}`}>
          <div className="timeline-image">
            <img src={event.image} alt={event.title} />
          </div>
          <div className="timeline-content">
            <h3>{event.title}</h3>
            <p className="date">{event.date}</p>
            <p className="desc">{event.description}</p>
          </div>
        </div>
      );

      return (
        <div className="timeline-row" key={`${type}-${i}`}>
          <div className="cell left">{isLeft ? card : null}</div>
          <div className="cell center">
            <div className={`timeline-dot ${dotClass}`} />
          </div>
          <div className="cell right">{!isLeft ? card : null}</div>
        </div>
      );
    });

  return (
    <div className="events-lenis">
      <section className="events-section" ref={sectionRef}>
        <header className="events-header">
          <h1 className="neon-title">Events & Milestones</h1>
          <p>Our journey through innovation — where ideas meet impact.</p>
        </header>

        <div className="timeline-section upcoming">
          <h2 className="timeline-title">Upcoming</h2>
          <div className="timeline">
            <div className="timeline-line timeline-line-upcoming">
              <div className="timeline-fill timeline-fill-upcoming" />
            </div>
            <div className="timeline-rows">
              {renderRows(data.upcoming || [], "upcoming")}
            </div>
          </div>
        </div>

        <div className="timeline-section past">
          <h2 className="timeline-title">Past Highlights</h2>
          <div className="timeline">
            <div className="timeline-line timeline-line-past">
              <div className="timeline-fill timeline-fill-past" />
            </div>
            <div className="timeline-rows">
              {renderRows(data.past || [], "past")}
            </div>
          </div>
        </div>

        <div className="timeline-bg" />
        <div className="timeline-bg-surge" />
        <div className="events-bottom-spacer" />
      </section>
    </div>
  );
}
