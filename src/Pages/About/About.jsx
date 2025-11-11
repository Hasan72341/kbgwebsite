import React, { useEffect, useRef, useState } from 'react'
import "./About.css"
import useDocumentTitle from '../../CustomHooks/useDocumentTitle'
import { API_ENDPOINTS, fetchData } from '../../config/api'
import { LoadingSpinner, ErrorState } from '../../Components/Loading'
import GalaxyBackground from '../../Components/Background/GalaxyBackground'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const About = () => {
  const pageRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useDocumentTitle(data?.title || 'About')

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const aboutData = await fetchData(API_ENDPOINTS.about)
        setData(aboutData)
      } catch (error) {
        console.error('Failed to load about data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!data) return // Wait for data to load

    // 🚀 Initialize ultra-smooth Lenis scroll
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.2,
      infinite: false,
      lerp: 0.08,
    })

    const raf = (time) => {
      lenis.raf(time)
      ScrollTrigger.update()
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // 🌟 Hero Section Animations
    gsap.from('.about-page h1', {
      opacity: 0,
      y: 50,
      filter: 'blur(15px)',
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.3,
      clearProps: 'all',
    })

    gsap.from('.about-page .mission', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      delay: 0.5,
      clearProps: 'all',
    })

    gsap.from('.about-page .history', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      delay: 0.7,
      clearProps: 'all',
    })

    gsap.from('.about-page .about-description', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      delay: 0.9,
      clearProps: 'all',
    })

    // 🌟 Scroll-triggered animations for sections
    const ctx = gsap.context(() => {
      // Features cards animation
      gsap.utils.toArray('.feature-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 60,
          scale: 0.95,
          filter: 'blur(15px)',
          duration: 1.2,
          ease: 'power3.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        })
      })

      // What we do list items
      gsap.utils.toArray('.what-we-do li').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          x: -20,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
          },
          delay: i * 0.1,
        })
      })

      // Section headers
      gsap.utils.toArray('.features h2, .what-we-do h2, .about-contact h2').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          },
        })
      })

      // Contact section
      gsap.from('.about-contact-card', {
        opacity: 0,
        y: 60,
        filter: 'blur(15px)',
        duration: 1.2,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: '.about-contact-card',
          start: 'top 85%',
        },
      })
    }, pageRef)

    return () => {
      lenis.destroy()
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [data])

  if (loading) {
    return <LoadingSpinner variant="ring" />;
  }

  if (!data) {
    return <ErrorState message="Failed to load about page data. Please try again later." />;
  }

  const contact = data.contact || null

  return (
    <section className="about-page" ref={pageRef}>
      <GalaxyBackground count={200000} />
      
      <div className="about-content">
        <div className="about-hero glass-card">
          <h1>{data.title}</h1>
          <p className="mission">{data.mission}</p>
          <p className="history">{data.history}</p>
          {data.aboutLong && <p className="about-description">{data.aboutLong}</p>}
        </div>

        {data.features && (
          <section className="features">
            <h2>Features</h2>
            <div className="features-grid">
              {data.features.map((f, i) => (
                <article className="feature-card glass-card" key={i}>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="what-we-do">
          <h2>What we do</h2>
          <ul>
            {data.whatWeDo && data.whatWeDo.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {contact && (
          <section className="about-contact">
            <h2>Say hello</h2>
            <div className="about-contact-card glass-card">
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
                    <a key={index} href={social.href} target="_blank" rel="noopener noreferrer" className="social-link">
                      <span>{social.label}</span>
                      {social.handle && <small>{social.handle}</small>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

export default About
