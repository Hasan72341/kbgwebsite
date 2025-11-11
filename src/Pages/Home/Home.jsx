import React, { useEffect, useRef, useState } from 'react';
import './Home.css';
import useDocumentTitle from '../../CustomHooks/useDocumentTitle';
import { API_ENDPOINTS, fetchData } from '../../config/api';
import DNAVisualizer from '../../Components/DNA/DNAVisualizer';
import { LoadingSpinner, ErrorState } from '../../Components/Loading';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  useDocumentTitle('Home');
  const lenisRef = useRef(null);
  const [scroller, setScroller] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const homeData = await fetchData(API_ENDPOINTS.home);
        setData(homeData);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const hero = data?.hero || {};
  const highlights = data?.highlights || [];
  const sections = data?.sections || [];
  const tracks = data?.tracks || [];
  const stories = data?.stories || [];
  const contact = data?.contact || null;

  useEffect(() => {
    if (!data) return; // Wait for data to load before initializing animations

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

    // ✨ Hero Animations - with clearProps to ensure visibility
    gsap.from('.hero-copy h1', {
      opacity: 0,
      y: 50,
      filter: 'blur(15px)',
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.3,
      clearProps: 'all',
    });

    gsap.from('.hero-copy .hero-tagline', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      delay: 0.5,
      clearProps: 'all',
    });

    gsap.from('.hero-copy .hero-description', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      delay: 0.7,
      clearProps: 'all',
    });

    gsap.from('.hero-cta', {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: 'back.out(1.7)',
      delay: 0.9,
      clearProps: 'all',
    });

    gsap.from('.hero-metric', {
      opacity: 0,
      y: 40,
      filter: 'blur(10px)',
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 1.1,
      clearProps: 'all',
    });

    // ✨ Mission/Narrative Cards - Staggered Reveal with GSAP
    const narrativeCards = gsap.utils.toArray('.narrative-card');
    narrativeCards.forEach((card, index) => {
      const title = card.querySelector('h2');
      const content = card.querySelector('p');
      const bullets = card.querySelectorAll('li');

      gsap.from(card, {
        opacity: 0,
        y: 60,
        scale: 0.95,
        filter: 'blur(15px)',
        duration: 1.2,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: card,
          scroller: scrollerEl,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      if (title) {
        gsap.from(title, {
          opacity: 0,
          x: -30,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: card,
            scroller: scrollerEl,
            start: 'top 80%',
          },
          delay: 0.2,
        });
      }

      if (content) {
        gsap.from(content, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: card,
            scroller: scrollerEl,
            start: 'top 80%',
          },
          delay: 0.4,
        });
      }

      if (bullets.length > 0) {
        gsap.from(bullets, {
          opacity: 0,
          x: -20,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: card,
            scroller: scrollerEl,
            start: 'top 80%',
          },
          delay: 0.6,
        });
      }
    });

    // ✨ Track Cards
    const trackCards = gsap.utils.toArray('.track-card');
    trackCards.forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 50,
        filter: 'blur(12px)',
        duration: 1.1,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: el,
          scroller: scrollerEl,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // ✨ Story Cards
    const storyCards = gsap.utils.toArray('.story-card');
    storyCards.forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        scale: 0.95,
        filter: 'blur(10px)',
        duration: 1,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: el,
          scroller: scrollerEl,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // ✨ Contact Card
    gsap.from('.contact-card', {
      opacity: 0,
      y: 60,
      filter: 'blur(15px)',
      duration: 1.2,
      ease: 'power3.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: '.contact-card',
        scroller: scrollerEl,
        start: 'top 90%',
        toggleActions: 'play none none reverse',
      },
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
  }, [data]);

  if (loading) {
    return <LoadingSpinner variant="dna" />;
  }

  if (!data) {
    return <ErrorState message="Failed to load home page data. Please try again later." />;
  }

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
              <span className="hero-pill">Bioengineering Club</span>
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
