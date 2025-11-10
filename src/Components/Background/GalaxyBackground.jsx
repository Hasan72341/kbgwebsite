import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import vertexShader from '../../../animated-galaxy/src/Shaders/vertex.glsl?raw'
import fragmentShader from '../../../animated-galaxy/src/Shaders/fragment.glsl?raw'
import './GalaxyBackground.css'
gsap.registerPlugin(ScrollTrigger)

const GalaxyBackground = ({ count = 200000 }) => {
  const canvasRef = useRef(null)
  const pointsRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // === Pinned fullscreen canvas ===
    Object.assign(canvas.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
    })

    // === Scene Setup ===
    const scene = new THREE.Scene()
    const sizes = { width: window.innerWidth, height: window.innerHeight }

    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
    camera.position.set(3, 3, 3)
    camera.lookAt(0, 0, 0)
    scene.add(camera)

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    // === Galaxy generation ===
    let geometry, material, points
    const parameters = {
      count,
      size: 0.005,
      radius: 5,
      branches: 3,
      randomness: 0.5,
      randomnessPower: 3,
      insideColor: '#00eaff', // cyan center
      outsideColor: '#ff00ff', // magenta edge
    }

    const generateGalaxy = () => {
      if (points) {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
      }

      geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(parameters.count * 3)
      const colors = new Float32Array(parameters.count * 3)
      const aScale = new Float32Array(parameters.count)

      const insideColor = new THREE.Color(parameters.insideColor)
      const outsideColor = new THREE.Color(parameters.outsideColor)

      for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3
        const radius = Math.random() * parameters.radius
        const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius

        positions[i3] = Math.cos(branchAngle) * radius + randomX
        positions[i3 + 1] = randomY
        positions[i3 + 2] = Math.sin(branchAngle) * radius + randomZ

        const mixed = insideColor.clone().lerp(outsideColor, radius / parameters.radius)
        colors.set([mixed.r, mixed.g, mixed.b], i3)
        aScale[i] = Math.random()
      }

      geometry.setAttribute('aScale', new THREE.BufferAttribute(aScale, 1))
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 8.0 * renderer.getPixelRatio() },
          uScroll: { value: 0.0 },
          uTint: { value: new THREE.Color('#00eaff') }, // start cyan
        },
        depthWrite: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
      })

      points = new THREE.Points(geometry, material)
      scene.add(points)
      pointsRef.current = points
    }

    generateGalaxy()

    // === Animation loop ===
    const clock = new THREE.Clock()
    const tick = () => {
      const elapsed = clock.getElapsedTime()
      if (material) material.uniforms.uTime.value = elapsed
      renderer.render(scene, camera)
      requestAnimationFrame(tick)
    }
    tick()

    // === Resize handler ===
    const onResize = () => {
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      if (material) material.uniforms.uSize.value = 8.0 * renderer.getPixelRatio()
    }
    window.addEventListener('resize', onResize)

    // === Smooth Scroll via Lenis (global and synced) ===
    const lenis = new Lenis({
      duration: 1.2,
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
      direction: 'vertical',
    })

    const raf = (time) => {
      lenis.raf(time)
      ScrollTrigger.update()
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // === GSAP ScrollTrigger Animations ===
    const hueShift = { h: 0 }

    const st = ScrollTrigger.create({
      trigger: '.about-page',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => {
        // hue cycle cyan → magenta → cyan
        hueShift.h = (self.progress * 360) % 360
        const color = new THREE.Color(`hsl(${hueShift.h}, 100%, 60%)`)
        material.uniforms.uTint.value.lerp(color, 0.1)

        // smooth dolly + rotation
        camera.position.z = THREE.MathUtils.lerp(3, 1.4, self.progress)
        const velocity = Math.abs(self.getVelocity()) / 3000
        points.rotation.y += velocity * 0.03
        points.rotation.x += velocity * 0.01
      },
    })

    // === Cleanup ===
    return () => {
      st.kill()
      lenis.destroy()
      window.removeEventListener('resize', onResize)
      if (pointsRef.current) scene.remove(pointsRef.current)
      geometry?.dispose()
      material?.dispose()
      renderer.dispose()
    }
  }, [count])

  return <canvas ref={canvasRef} className="about-galaxy-canvas" />
}

export default GalaxyBackground
