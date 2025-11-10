import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const GLTFBackground = ({ modelPath = '/by-gen_web/scene.gltf' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    const loader = new GLTFLoader();

    let modelGroup = null;
    const clock = new THREE.Clock();
    let rafId = null;

    const resize = () => {
      if (!container) return;
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onScroll = () => {
      const scrollTop = window.scrollY || window.pageYOffset;
      const docHeight = document.body.scrollHeight - window.innerHeight || 1;
      const t = Math.max(0, Math.min(1, scrollTop / docHeight));
      // move camera subtly along z and y and rotate slightly for parallax
      camera.position.z = 3 - t * 1.2; // move closer as you scroll
      camera.position.y = 1.5 - t * 0.8;
      if (modelGroup) {
        modelGroup.rotation.y = t * Math.PI * 0.5; // slow rotation with scroll
      }
    };

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      if (modelGroup) {
        // gentle idle motion
        modelGroup.rotation.y += 0.0015;
        modelGroup.rotation.x = Math.sin(elapsed * 0.1) * 0.02;
      }
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    // lights: ambient + directional + subtle point light for highlights
    let ambient = new THREE.AmbientLight(0xffffff, 0.6);
    let dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7.5);
    let pointLight = new THREE.PointLight(0x88ccff, 0.8, 15);
    pointLight.position.set(0, 1.5, 3);
    scene.add(ambient, dir, pointLight);

    loader.load(
      modelPath,
      (gltf) => {
        /* debug */
        console.log('[GLTFBackground] loaded', modelPath, gltf);
        modelGroup = new THREE.Group();
        const root = gltf.scene || gltf.scenes?.[0];
        if (root) {
          // compute bounds and center model
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // normalize scale so model fits comfortably in view
          const maxDim = Math.max(size.x, size.y, size.z, 1);
          // increase desiredSize to make the model more visible
          const desiredSize = 8; // world units for the largest dimension
          const scale = desiredSize / maxDim;
          root.scale.setScalar(scale * 0.9);

          // recenter geometry
          root.position.sub(center.multiplyScalar(scale * 0.9));

          // Ensure materials are visible (double sided) as a fallback
          root.traverse((node) => {
            if (node.isMesh && node.material) {
              node.material.side = THREE.DoubleSide;
              node.material.needsUpdate = true;
            }
          });

          modelGroup.add(root);

          // add debug visuals: axes at world origin and a small marker
          const axes = new THREE.AxesHelper(Math.max(size.x, size.y, size.z) * 0.6 || 1);
          axes.name = 'debug_axes_helper';
          scene.add(axes);
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
          );
          marker.name = 'debug_origin_marker';
          marker.position.set(0, 0, 0);
          scene.add(marker);

          // position camera to frame the model

          const sphere = box.getBoundingSphere(new THREE.Sphere());
          const radius = sphere.radius * scale * 1.2;
          // move camera further back to ensure visibility
          const camPos = new THREE.Vector3(0, Math.max(size.y, 1) * 0.15, radius * 3.0 + Math.max(size.z, 1) * 0.2);
          camera.position.copy(camPos);
          camera.near = Math.max(0.01, radius * 0.001);
          camera.far = Math.max(1000, radius * 10);
          camera.updateProjectionMatrix();
          camera.lookAt(new THREE.Vector3(0, 0, 0));

          // debug bounds logging
          console.log('[GLTFBackground] bounds:', {
            box,
            size,
            center,
            scale,
            radius,
            camPos,
            cameraPos: camera.position.clone(),
          });
        }
        scene.add(modelGroup);
        animate();
      },
      undefined,
      (err) => {
        console.error('Failed to load GLTF background', err);
      }
    );

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();

    const originalAnimate = animate;
    // wrap animate to include light behaviour
    const animateWithLights = () => {
      const elapsed = clock.getElapsedTime();
      if (pointLight) {
        // subtle pulsing
        pointLight.intensity = 0.6 + Math.sin(elapsed * 1.2) * 0.15;
        // smoothly follow camera for parallax highlight
        pointLight.position.lerp(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 1.5), 0.05);
      }
      originalAnimate();
    };

    // cancel previous raf and start the wrapped animation if needed
    if (typeof rafId === 'number') cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function loop() {
      animateWithLights();
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (modelGroup) scene.remove(modelGroup);
      if (ambient) scene.remove(ambient);
      if (dir) scene.remove(dir);
      if (pointLight) scene.remove(pointLight);
      renderer.dispose();
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, [modelPath]);

  return <div ref={containerRef} className="about-bg-canvas" />;
};

export default GLTFBackground;
