import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MovingBackground3DProps {
  scrollY: number;
}

export const MovingBackground3D: React.FC<MovingBackground3DProps> = ({ scrollY }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current = scrollY;
  }, [scrollY]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 120);
    camera.position.set(0, 1.2, 8);

    const ambient = new THREE.AmbientLight(0xfaf8ff, 0.8);
    scene.add(ambient);

    const pointLight1 = new THREE.PointLight(0xa855f7, 6, 30);
    pointLight1.position.set(-6, 4, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xc084fc, 5, 30);
    pointLight2.position.set(6, -3, 2);
    scene.add(pointLight2);

    // 1. Moving 3D Perspective Grid Floor & Ceiling
    const gridHelperBottom = new THREE.GridHelper(60, 48, 0xa855f7, 0x4c1d95);
    gridHelperBottom.position.y = -4.2;
    (gridHelperBottom.material as THREE.Material).transparent = true;
    (gridHelperBottom.material as THREE.Material).opacity = 0.28;
    scene.add(gridHelperBottom);

    // 2. 3D Starfield / Neural Particle Tunnel moving toward camera
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const c1 = new THREE.Color(0xa855f7);
    const c2 = new THREE.Color(0xc084fc);
    const c3 = new THREE.Color(0x9333ea);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const pick = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      colors[i * 3] = pick.r;
      colors[i * 3 + 1] = pick.g;
      colors[i * 3 + 2] = pick.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 3. Floating 3D Wireframe Polyhedra Drifting Through Space
    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    const floatingMeshes: Array<{
      mesh: THREE.Object3D;
      rotSpeedX: number;
      rotSpeedY: number;
      floatSpeed: number;
      baseY: number;
      phase: number;
    }> = [];

    const geometries = [
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TorusGeometry(0.45, 0.08, 12, 36),
      new THREE.TorusKnotGeometry(0.36, 0.07, 64, 12),
    ];

    for (let i = 0; i < 14; i++) {
      const geo = geometries[i % geometries.length];
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xa855f7 : 0xc084fc,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (4.2 + (i % 4) * 2.4);
      const y = (Math.random() - 0.5) * 14;
      const z = -2 - (i % 6) * 3.2;
      mesh.position.set(x, y, z);
      shapesGroup.add(mesh);

      floatingMeshes.push({
        mesh,
        rotSpeedX: 0.006 + (i % 4) * 0.003,
        rotSpeedY: 0.009 + (i % 3) * 0.004,
        floatSpeed: 0.8 + (i % 5) * 0.25,
        baseY: y,
        phase: i * 0.9,
      });
    }

    const pointer = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentScroll = scrollRef.current;

      // Continuous forward grid motion + scroll velocity
      gridHelperBottom.position.z = ((elapsed * 1.8 + currentScroll * 0.008) % 2.5);

      // Stream particles forward in Z and wrap around
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let z = posAttr.getZ(i);
        z += 0.035;
        if (z > 12) {
          z = -28;
        }
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      // Rotate and float 3D wireframe polyhedra
      floatingMeshes.forEach((item) => {
        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        item.mesh.position.y =
          item.baseY +
          Math.sin(elapsed * item.floatSpeed + item.phase) * 0.65 +
          (currentScroll * 0.0025) % 4;
      });

      // Smooth camera parallax from mouse + gentle continuous sway
      const targetCamX = pointer.x * 0.85 + Math.sin(elapsed * 0.45) * 0.35;
      const targetCamY = 1.2 + pointer.y * 0.55 + Math.cos(elapsed * 0.35) * 0.25;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 0.2, -6);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
    />
  );
};
