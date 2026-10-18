import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ContactOrb3DProps {
  reducedMotion: boolean;
}

export const ContactOrb3D: React.FC<ContactOrb3DProps> = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const pulseRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglAvailable(false);
      return;
    }

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 260;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    camera.position.set(0, 0.4, 4.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3.2;

    const ambient = new THREE.AmbientLight(0xfaf8ff, 0.85);
    scene.add(ambient);

    const purpleLight = new THREE.PointLight(0xa855f7, 7.0, 12);
    purpleLight.position.set(-2.5, 2.0, 2.5);
    scene.add(purpleLight);

    const orchidLight = new THREE.PointLight(0xe879f9, 6.2, 12);
    orchidLight.position.set(2.5, -2.0, 2.5);
    scene.add(orchidLight);

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Morphing TorusKnot Inner Core
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x14062b,
      emissive: 0x9333ea,
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.9,
      clearcoat: 1.0,
    });
    const coreMesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.52, 0.15, 96, 24, 2, 3),
      coreMat
    );
    orbGroup.add(coreMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const wireShell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 2), wireMat);
    orbGroup.add(wireShell);

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.38, 0.015, 16, 96),
      new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.8 })
    );
    ring1.rotation.x = Math.PI / 3;
    orbGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.56, 0.012, 16, 96),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.65 })
    );
    ring2.rotation.y = Math.PI / 3;
    orbGroup.add(ring2);

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 320;
      const nh = container.clientHeight || 260;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      controls.update();

      pulseRef.current *= 0.92;
      const scaleBoost = 1 + pulseRef.current * 0.22 + Math.sin(t * 2.6) * 0.05;
      coreMesh.scale.setScalar(scaleBoost);
      wireShell.scale.setScalar(1 + pulseRef.current * 0.28);

      coreMesh.rotation.x = t * 0.85;
      coreMesh.rotation.y = t * 1.1;
      wireShell.rotation.y = -t * 0.45;
      wireShell.rotation.x = t * 0.3;
      ring1.rotation.z = t * 0.95;
      ring2.rotation.x = -t * 0.78;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  if (!webglAvailable) {
    return (
      <div className="w-full h-56 rounded-2xl glass-panel flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#A855F7]/30 to-[#C084FC]/30 border border-[#A855F7]/50" />
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        pulseRef.current = 1;
      }}
      className="relative w-full h-60 sm:h-64 rounded-2xl border border-[#A855F7]/45 bg-gradient-to-b from-[#15092D]/85 to-[#070312]/90 backdrop-blur-xl overflow-hidden cursor-grab active:cursor-grabbing group shadow-xl shadow-[#9333EA]/20"
      title="Drag to spin 3D core or click to pulse"
    >
      <div ref={containerRef} className="w-full h-full" />
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-[#C4B5FD]">
        <span>Moving 3D Amethyst Tensor Core</span>
        <span className="group-hover:text-[#FAF8FF] transition-colors">Drag to Spin · Click to Pulse</span>
      </div>
    </div>
  );
};
