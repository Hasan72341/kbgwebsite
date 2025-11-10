import React, { useEffect, useRef, useState } from 'react';
import './Home.css';
import useDocumentTitle from '../../CustomHooks/useDocumentTitle';
import data from '../../data/home.json';
import DNAVisualizer from '../../Components/DNA/DNAVisualizer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  useDocumentTitle('Home');
  const lenisRef = useRef(null);
  const [scroller, setScroller] = useState(null);

  const hero = data.hero || {};
  const highlights = data.highlights || [];
  const sections = data.sections || [];
  const tracks = data.tracks || [];
  const stories = data.stories || [];
  const contact = data.contact || null;

  useEffect(() => {
    // 🌀 Initialize Lenis (smooth scroll)
    const lenis = new Lenis({
      duration: 1.2,
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1.2,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const scrollerEl = document.querySelector('[data-lenis-container]');
    setScroller(scrollerEl); // for DNAVisualizer

    // 🧭 ScrollTrigger + Lenis sync
    ScrollTrigger.scrollerProxy(scrollerEl, {
      scrollTop(value) {
        if (arguments.length) lenis.scrollTo(value);
        else return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    lenis.on('scroll', ScrollTrigger.update);

    // ✅ New Lenis API fix (no lenis.update)
    ScrollTrigger.addEventListener('refresh', () => lenis.raf(performance.now()));
    ScrollTrigger.refresh();

    // ✨ Text + Card Reveal Animations
    const revealElements = gsap.utils.toArray([
      '.hero-copy h1',
      '.hero-copy p',
      '.hero-cta',
      '.hero-metric',
      '.narrative-card',
      '.track-card',
      '.story-card',
      '.contact-card'
    ]);

    revealElements.forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 36,
        filter: 'blur(12px)',
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          scroller: scrollerEl,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // Hero metric subtle float
    gsap.to('.hero-metric', {
      y: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-block',
        scroller: scrollerEl,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.7,
      },
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((s) => s.kill());
      gsap.globalTimeline.clear();
    };
  }, []);

  return (
    <>
      {/* 🧬 DNA Visualizer stays behind everything */}
      <div id="dna-global-layer">
        {scroller && <DNAVisualizer variant="background" scroller={scroller} />}
      </div>

      {/* Smooth scroll container */}
      <main className="home-page" data-lenis-container>
        <div className="home-content">
          {/* HERO */}
          <section className="hero-block">
            <div className="hero-copy">
              <span className="hero-pill">Three.js Shader Lab</span>
              <h1>{hero.title}</h1>
              <p className="hero-tagline">{hero.subtitle}</p>
              <p className="hero-description">{hero.description}</p>
              {hero.cta && (
                <a className="hero-cta" href={hero.cta.href}>{hero.cta.label}</a>
              )}
            </div>

            {!!highlights.length && (
              <div className="hero-metrics">
                {highlights.map((item, index) => (
                  <article key={index} className="hero-metric">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Narrative */}
          {!!sections.length && (
            <section className="narrative-grid">
              {sections.map((section, index) => (
                <article key={index} className="narrative-card">
                  <h2>{section.title}</h2>
                  <p>{section.copy}</p>
                  {Array.isArray(section.bullets) && section.bullets.length > 0 && (
                    <ul>
                      {section.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </section>
          )}

          {/* Tracks */}
          {!!tracks.length && (
            <section className="tracks-section">
              <div className="section-heading">
                <h2>Focus Tracks</h2>
                <p>Choose your lane and mix biology with computation.</p>
              </div>
              <div className="tracks-grid">
                {tracks.map((track, index) => (
                  <article key={index} className="track-card">
                    <header>
                      <h3>{track.title}</h3>
                      <p>{track.summary}</p>
                    </header>
                    {Array.isArray(track.focus) && track.focus.length > 0 && (
                      <ul>
                        {track.focus.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Stories */}
          {!!stories.length && (
            <section className="stories-section">
              <div className="section-heading">
                <h2>Field Notes</h2>
                <p>Snapshots from members exploring biology and design.</p>
              </div>
              <div className="stories-grid">
                {stories.map((story, index) => (
                  <figure key={index} className="story-card">
                    <blockquote>“{story.quote}”</blockquote>
                    <figcaption>
                      <span>{story.author}</span>
                      <small>{story.role}</small>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Contact */}
          {contact && (
            <section className="contact-section">
              <div className="contact-card glass-card">
                <div className="contact-copy">
                  <h2>{contact.headline || 'Let’s collaborate'}</h2>
                  {contact.description && <p>{contact.description}</p>}
                </div>
                <div className="contact-links">
                  <a className="contact-email" href={`mailto:${contact.email}`}>{contact.email}</a>
                  {contact.phone && <span className="contact-phone">{contact.phone}</span>}
                  {Array.isArray(contact.socials) && contact.socials.length > 0 && (
                    <div className="contact-socials">
                      {contact.socials.map((s, i) => (
                        <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">
                          {s.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
