import React, { useEffect, useRef } from 'react'
import "./About.css"
import useDocumentTitle from '../../CustomHooks/useDocumentTitle'
import data from '../../data/about.json'
import GalaxyBackground from '../../Components/Background/GalaxyBackground'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const About = () => {
  useDocumentTitle(data.title || 'About')
  const pageRef = useRef(null)

  useEffect(() => {
    // 🚀 Initialize ultra-smooth Lenis scroll
    const lenis = new Lenis({
      duration: 2.4,
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 1.3,
      infinite: false,
      lerp: 0.08
    })

    const raf = (time) => {
      lenis.raf(time)
      ScrollTrigger.update()
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // 🌟 GSAP fade-in animations
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.fade-in').forEach((el, i) => {
        gsap.fromTo(el, 
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1,
            delay: i * 0.1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      })
    }, pageRef)

    return () => {
      lenis.destroy()
      ctx.revert()
    }
  }, [])

  const contact = data.contact || null

  return (
    <section className="about-page" ref={pageRef}>
      <GalaxyBackground count={200000} />
      
      <h1 className="fade-in">{data.title}</h1>
      <p className="mission fade-in">{data.mission}</p>
      <p className="history fade-in">{data.history}</p>

      {data.aboutLong && (
        <div className="about-long fade-in">
          <p>{data.aboutLong}</p>
        </div>
      )}

      {data.features && (
        <section className="features fade-in">
          <h2>Features</h2>
          <div className="features-grid">
            {data.features.map((f, i) => (
              <article className="feature-card" key={i}>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.timeline && (
        <section className="timeline fade-in">
          <h2>Timeline</h2>
          <ol>
            {data.timeline.map((t, i) => (
              <li key={i} className="timeline-item">
                <strong>{t.year}</strong>: {t.event}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="what-we-do fade-in">
        <h2>What we do</h2>
        <ul>
          {data.whatWeDo && data.whatWeDo.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {contact && (
        <section className="about-contact fade-in">
          <h2>Say hello</h2>
          <div className="about-contact-card glass">
            <div className="about-contact-details">
              {contact.location && <p className="about-contact-location">{contact.location}</p>}
              <div className="about-contact-links">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="about-contact-email">
                    {contact.email}
                  </a>
                )}
                {contact.phone && <span className="about-contact-phone">{contact.phone}</span>}
              </div>
            </div>
            {Array.isArray(contact.socials) && contact.socials.length > 0 && (
              <div className="about-contact-socials">
                {contact.socials.map((social, index) => (
                  <a key={index} href={social.href} target="_blank" rel="noopener noreferrer">
                    <span>{social.label}</span>
                    {social.handle && <small>{social.handle}</small>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  )
}

export default About
