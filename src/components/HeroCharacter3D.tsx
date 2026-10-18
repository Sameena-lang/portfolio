import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Camera, Cpu, Layers, Pause, Play, RotateCcw, Sparkles, Upload } from 'lucide-react';
import defaultPortraitUrl from '../assets/images/hero_purple_portrait_backdrop_1791738221468.jpg';

interface HeroCharacter3DProps {
  reducedMotion: boolean;
  onUpdateBackdropPhoto?: (url: string) => void;
}

type SceneMode = 'holo-portrait' | 'cyber-avatar' | 'neural-core';

export const HeroCharacter3D: React.FC<HeroCharacter3DProps> = ({
  onUpdateBackdropPhoto,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [sceneMode, setSceneMode] = useState<SceneMode>('holo-portrait');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [motionSpeed, setMotionSpeed] = useState<number>(1.4);
  const [studioDrawerOpen, setStudioDrawerOpen] = useState<boolean>(false);
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [portraitTextureUrl, setPortraitTextureUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('sameena_backdrop_portrait_purple_v2') || defaultPortraitUrl;
    } catch {
      return defaultPortraitUrl;
    }
  });
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  const modeRef = useRef<SceneMode>('holo-portrait');
  const autoRotateRef = useRef<boolean>(true);
  const speedRef = useRef<number>(1.4);

  const holoPortraitGroupRef = useRef<THREE.Group | null>(null);
  const cyberAvatarGroupRef = useRef<THREE.Group | null>(null);
  const neuralCoreGroupRef = useRef<THREE.Group | null>(null);
  const customModelGroupRef = useRef<THREE.Group | null>(null);
  const portraitMeshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    modeRef.current = sceneMode;
    if (customModelGroupRef.current && customModelGroupRef.current.children.length > 0) {
      return;
    }
    if (holoPortraitGroupRef.current) {
      holoPortraitGroupRef.current.visible = sceneMode === 'holo-portrait';
    }
    if (cyberAvatarGroupRef.current) {
      cyberAvatarGroupRef.current.visible = sceneMode === 'cyber-avatar';
    }
    if (neuralCoreGroupRef.current) {
      neuralCoreGroupRef.current.visible = sceneMode === 'neural-core';
    }
  }, [sceneMode]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    speedRef.current = motionSpeed;
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 2.0 * motionSpeed;
    }
  }, [motionSpeed]);

  // Update 3D Portrait Texture whenever portraitTextureUrl changes
  useEffect(() => {
    const mesh = portraitMeshRef.current;
    if (!mesh) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      portraitTextureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
      },
      undefined,
      () => {
        // fallback handled by material color
      }
    );
  }, [portraitTextureUrl]);

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
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 520;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.65, 5.4);

    // Interactive 360-degree OrbitControls with continuous autoRotate
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 8.2;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 2.0 * speedRef.current;
    controlsRef.current = controls;

    // --- LIGHTING (ROYAL PURPLE, AMETHYST & ORCHID VOLUMETRIC RIG) ---
    const ambientLight = new THREE.AmbientLight(0xfaf8ff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfaf8ff, 2.1);
    keyLight.position.set(3, 4.5, 4);
    scene.add(keyLight);

    const purpleRimLight = new THREE.PointLight(0xa855f7, 8.0, 12, 1.5);
    purpleRimLight.position.set(-3.0, 2.0, -1.8);
    scene.add(purpleRimLight);

    const orchidRimLight = new THREE.PointLight(0xc084fc, 7.0, 12, 1.5);
    orchidRimLight.position.set(3.0, 1.8, -1.8);
    scene.add(orchidRimLight);

    const upglowLight = new THREE.PointLight(0x9333ea, 5.0, 8, 1.6);
    upglowLight.position.set(0, -1.4, 1.2);
    scene.add(upglowLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // =========================================================================
    // 1. SHARED CONTINUOUSLY MOVING 3D GYROSCOPIC RINGS, PEDESTAL & SATELLITES
    // =========================================================================
    const baseGroup = new THREE.Group();
    baseGroup.position.y = -1.45;
    masterGroup.add(baseGroup);

    const platformMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b0418,
      emissive: 0x3b0764,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
    });
    const platformDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.65, 1.9, 0.14, 64),
      platformMat
    );
    baseGroup.add(platformDisk);

    const platformRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.022, 16, 128),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    platformRim.rotation.x = Math.PI / 2;
    platformRim.position.y = 0.07;
    baseGroup.add(platformRim);

    // 3 Concentric Counter-Rotating 3D Gyroscopic Rings
    const gyroGroup = new THREE.Group();
    gyroGroup.position.y = 0.1;
    masterGroup.add(gyroGroup);

    const gyroRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.014, 16, 128),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.72 })
    );
    gyroRing1.rotation.x = Math.PI / 2.2;
    gyroGroup.add(gyroRing1);

    const gyroRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.011, 16, 128),
      new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55 })
    );
    gyroRing2.rotation.y = Math.PI / 3;
    gyroGroup.add(gyroRing2);

    const gyroRing3 = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.009, 16, 128),
      new THREE.MeshBasicMaterial({ color: 0x9333ea, transparent: true, opacity: 0.5 })
    );
    gyroRing3.rotation.x = -Math.PI / 3;
    gyroGroup.add(gyroRing3);

    // Orbiting 3D AI Satellites
    const satellitesGroup = new THREE.Group();
    masterGroup.add(satellitesGroup);

    const satellites: Array<{
      pivot: THREE.Group;
      mesh: THREE.Object3D;
      orbitSpeed: number;
      bobSpeed: number;
      phase: number;
    }> = [];

    const satConfigs = [
      { geo: new THREE.TorusKnotGeometry(0.13, 0.035, 64, 12), radius: 2.15, y: 0.85, speed: 0.75, color: 0xc084fc },
      { geo: new THREE.OctahedronGeometry(0.18, 0), radius: 2.05, y: -0.35, speed: -0.65, color: 0xa855f7 },
      { geo: new THREE.IcosahedronGeometry(0.17, 0), radius: 2.2, y: 0.45, speed: 0.55, color: 0xe879f9 },
      { geo: new THREE.BoxGeometry(0.22, 0.22, 0.22), radius: 1.95, y: -0.65, speed: -0.85, color: 0x9333ea },
    ];

    satConfigs.forEach((cfg, idx) => {
      const pivot = new THREE.Group();
      pivot.rotation.y = (idx * Math.PI) / 2;
      satellitesGroup.add(pivot);

      const holder = new THREE.Group();
      holder.position.set(cfg.radius, cfg.y, 0);
      pivot.add(holder);

      const solid = new THREE.Mesh(
        cfg.geo,
        new THREE.MeshPhysicalMaterial({
          color: 0x120826,
          emissive: cfg.color,
          emissiveIntensity: 0.6,
          metalness: 0.85,
          roughness: 0.15,
        })
      );
      const wire = new THREE.Mesh(
        cfg.geo,
        new THREE.MeshBasicMaterial({
          color: 0xfaf8ff,
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        })
      );
      wire.scale.setScalar(1.22);
      holder.add(solid, wire);

      satellites.push({
        pivot,
        mesh: holder,
        orbitSpeed: cfg.speed,
        bobSpeed: 1.8 + idx * 0.3,
        phase: idx * 1.4,
      });
    });

    // =========================================================================
    // MODE 1: 3D HOLOGRAPHIC PORTRAIT MONOLITH & AI WORKSTATION (DEFAULT)
    // =========================================================================
    const holoPortraitGroup = new THREE.Group();
    masterGroup.add(holoPortraitGroup);
    holoPortraitGroupRef.current = holoPortraitGroup;

    // Sculpted 3D Obsidian & Amethyst Portrait Frame
    const frameOuter = new THREE.Mesh(
      new THREE.BoxGeometry(1.78, 2.18, 0.12),
      new THREE.MeshPhysicalMaterial({
        color: 0x0c051c,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.35,
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 1.0,
      })
    );
    frameOuter.position.set(0, 0.25, 0);
    holoPortraitGroup.add(frameOuter);

    const frameNeonEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.82, 2.22, 0.14)),
      new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.9 })
    );
    frameNeonEdges.position.copy(frameOuter.position);
    holoPortraitGroup.add(frameNeonEdges);

    // Floating Back Depth Grid Plane
    const backGridEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.98, 2.38, 0.04)),
      new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.45 })
    );
    backGridEdges.position.set(0, 0.25, -0.16);
    holoPortraitGroup.add(backGridEdges);

    // High-Res Portrait Texture Plane (Front & Back so 360° rotation looks great on both sides!)
    const texLoader = new THREE.TextureLoader();
    const initialTex = texLoader.load(portraitTextureUrl);
    initialTex.colorSpace = THREE.SRGBColorSpace;

    const portraitMat = new THREE.MeshBasicMaterial({
      map: initialTex,
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const portraitPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 2.02), portraitMat);
    portraitPlane.position.set(0, 0.25, 0.068);
    holoPortraitGroup.add(portraitPlane);
    portraitMeshRef.current = portraitPlane;

    const portraitBackPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 2.02), portraitMat);
    portraitBackPlane.position.set(0, 0.25, -0.068);
    portraitBackPlane.rotation.y = Math.PI;
    holoPortraitGroup.add(portraitBackPlane);

    // Vertically Sweeping 3D Laser Scan Bar across Portrait
    const scanBeam = new THREE.Mesh(
      new THREE.BoxGeometry(1.72, 0.035, 0.18),
      new THREE.MeshBasicMaterial({
        color: 0xe879f9,
        transparent: true,
        opacity: 0.85,
      })
    );
    scanBeam.position.set(0, 0.25, 0);
    holoPortraitGroup.add(scanBeam);

    // Floating 3D Holographic Workstation Laptop / Console in Front
    const workstationGroup = new THREE.Group();
    workstationGroup.position.set(0, -0.95, 0.88);
    workstationGroup.rotation.x = -0.32;
    holoPortraitGroup.add(workstationGroup);

    const holoConsolePad = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.56, 0.03),
      new THREE.MeshPhysicalMaterial({
        color: 0x14082c,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.85,
        roughness: 0.15,
        metalness: 0.6,
      })
    );
    workstationGroup.add(holoConsolePad);

    const consoleBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.47, 0.58, 0.035)),
      new THREE.LineBasicMaterial({ color: 0xc084fc })
    );
    workstationGroup.add(consoleBorder);

    const telemetryBars: THREE.Mesh[] = [];
    for (let i = 0; i < 11; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.22, 0.025),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xa855f7 : 0xe879f9,
        })
      );
      bar.position.set(-0.5 + i * 0.1, -0.02, 0.032);
      workstationGroup.add(bar);
      telemetryBars.push(bar);
    }

    // =========================================================================
    // MODE 2: CYBER-SCULPTED 3D AI DEVELOPER AVATAR (SLEEK VISOR BUST)
    // =========================================================================
    const cyberAvatarGroup = new THREE.Group();
    cyberAvatarGroup.visible = false;
    masterGroup.add(cyberAvatarGroup);
    cyberAvatarGroupRef.current = cyberAvatarGroup;

    const chromeObsidianMat = new THREE.MeshPhysicalMaterial({
      color: 0x110722,
      emissive: 0x2e1065,
      emissiveIntensity: 0.3,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const glowingVisorMat = new THREE.MeshPhysicalMaterial({
      color: 0xc084fc,
      emissive: 0xa855f7,
      emissiveIntensity: 1.2,
      metalness: 0.5,
      roughness: 0.1,
    });

    // Sculpted Futuristic Helmet / Head Silhouette
    const cyberHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 48), chromeObsidianMat);
    cyberHead.scale.set(0.88, 1.12, 0.96);
    cyberHead.position.set(0, 0.68, 0);
    cyberAvatarGroup.add(cyberHead);

    // Glowing Curved Amethyst AR Visor
    const cyberVisor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.37, 0.16, 36, 1, true, -Math.PI * 0.38, Math.PI * 0.76),
      glowingVisorMat
    );
    cyberVisor.position.set(0, 0.72, 0.03);
    cyberAvatarGroup.add(cyberVisor);

    // Glowing Neural Halo Crown behind Head
    const neuralHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.016, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xc084fc })
    );
    neuralHalo.position.set(0, 0.72, -0.18);
    cyberAvatarGroup.add(neuralHalo);

    // Sculpted Cyber-Torso & Shoulder Armor Plates
    const cyberTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.34, 1.05, 36),
      chromeObsidianMat
    );
    cyberTorso.scale.set(1.22, 1, 0.68);
    cyberTorso.position.set(0, -0.25, 0);
    cyberAvatarGroup.add(cyberTorso);

    // Glowing Amethyst Arc Reactor Core on Chest
    const chestCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 1),
      glowingVisorMat
    );
    chestCore.position.set(0, -0.05, 0.32);
    cyberAvatarGroup.add(chestCore);

    const chestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.014, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0xe879f9 })
    );
    chestRing.position.set(0, -0.05, 0.33);
    cyberAvatarGroup.add(chestRing);

    // Floating Shoulder Pauldrons
    [-1, 1].forEach((side) => {
      const shoulderPlate = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.26, 1),
        chromeObsidianMat
      );
      shoulderPlate.scale.set(1.15, 0.65, 0.85);
      shoulderPlate.position.set(side * 0.68, 0.18, 0);
      cyberAvatarGroup.add(shoulderPlate);
    });

    // =========================================================================
    // MODE 3: 3D NEURAL NETWORK & TENSOR GALAXY CORE
    // =========================================================================
    const neuralCoreGroup = new THREE.Group();
    neuralCoreGroup.visible = false;
    masterGroup.add(neuralCoreGroup);
    neuralCoreGroupRef.current = neuralCoreGroup;

    const tensorKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.68, 0.18, 128, 32, 2, 3),
      new THREE.MeshPhysicalMaterial({
        color: 0x1a0938,
        emissive: 0x9333ea,
        emissiveIntensity: 0.55,
        metalness: 0.88,
        roughness: 0.14,
        clearcoat: 1.0,
      })
    );
    tensorKnot.position.y = 0.2;
    neuralCoreGroup.add(tensorKnot);

    const tensorWireShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.28, 1),
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        wireframe: true,
        transparent: true,
        opacity: 0.42,
      })
    );
    tensorWireShell.position.y = 0.2;
    neuralCoreGroup.add(tensorWireShell);

    // Custom Uploaded GLB Model Group
    const customModelGroup = new THREE.Group();
    customModelGroup.position.set(0, -1.2, 0);
    masterGroup.add(customModelGroup);
    customModelGroupRef.current = customModelGroup;

    // =========================================================================
    // 3D ORBITING PARTICLE FIELD & SYNAPTIC DATA PULSES
    // =========================================================================
    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorPurple = new THREE.Color(0xa855f7);
    const colorOrchid = new THREE.Color(0xe879f9);

    for (let i = 0; i < particleCount; i++) {
      const r = 1.65 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.6;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const c = i % 2 === 0 ? colorPurple : colorOrchid;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    masterGroup.add(particleSystem);

    const canvasEl = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglSupported(false);
    };
    const handleContextRestored = () => {
      setWebglSupported(true);
    };
    canvasEl.addEventListener('webglcontextlost', handleContextLost);
    canvasEl.addEventListener('webglcontextrestored', handleContextRestored);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 560;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const s = autoRotateRef.current ? speedRef.current : 0.25;

      // Update OrbitControls (handles smooth autoRotate + user drag)
      controls.update();

      // Continuous vertical levitation of main centerpiece
      const floatY = Math.sin(elapsed * 1.8 * s) * 0.08;
      holoPortraitGroup.position.y = floatY;
      cyberAvatarGroup.position.y = floatY;
      neuralCoreGroup.position.y = floatY;

      // Sweeping 3D laser scan beam across the portrait monolith
      scanBeam.position.y = 0.25 + Math.sin(elapsed * 2.2 * s) * 0.96;

      // Counter-rotating 3D gyroscopic rings
      gyroRing1.rotation.z = elapsed * 0.55 * s;
      gyroRing2.rotation.x = -elapsed * 0.48 * s;
      gyroRing2.rotation.z = elapsed * 0.32 * s;
      gyroRing3.rotation.y = elapsed * 0.62 * s;

      // Orbiting 3D satellites
      satellites.forEach((sat) => {
        sat.pivot.rotation.y += 0.012 * sat.orbitSpeed * s;
        sat.mesh.position.y += Math.sin(elapsed * sat.bobSpeed + sat.phase) * 0.003;
        sat.mesh.rotation.x += 0.018 * s;
        sat.mesh.rotation.y += 0.022 * s;
      });

      // Animated 3D workstation telemetry bars
      telemetryBars.forEach((bar, idx) => {
        bar.scale.y = 0.45 + Math.abs(Math.sin(elapsed * 3.2 * s + idx * 0.6)) * 1.15;
      });

      // Mode 2 & Mode 3 continuous rotations
      neuralHalo.rotation.z = elapsed * 0.8 * s;
      chestCore.rotation.y = elapsed * 1.5 * s;
      tensorKnot.rotation.x = elapsed * 0.45 * s;
      tensorKnot.rotation.y = elapsed * 0.65 * s;
      tensorWireShell.rotation.y = -elapsed * 0.35 * s;

      // Particle field swirl
      particleSystem.rotation.y = elapsed * 0.14 * s;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      canvasEl.removeEventListener('webglcontextlost', handleContextLost);
      canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModelLoadError(null);
    const objectUrl = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(
      objectUrl,
      (gltf) => {
        const customGroup = customModelGroupRef.current;
        if (!customGroup) return;

        while (customGroup.children.length > 0) {
          customGroup.remove(customGroup.children[0]);
        }

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.2 / maxDim;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

        customGroup.add(model);
        if (holoPortraitGroupRef.current) holoPortraitGroupRef.current.visible = false;
        if (cyberAvatarGroupRef.current) cyberAvatarGroupRef.current.visible = false;
        if (neuralCoreGroupRef.current) neuralCoreGroupRef.current.visible = false;
        setCustomModelName(file.name);
      },
      undefined,
      () => {
        setModelLoadError('Could not parse GLB/GLTF file. Keeping active 3D scene.');
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPortraitTextureUrl(reader.result);
        setSceneMode('holo-portrait');
        if (onUpdateBackdropPhoto) {
          onUpdateBackdropPhoto(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetScene = () => {
    setSceneMode('holo-portrait');
    setAutoRotate(true);
    setMotionSpeed(1.4);
    setCustomModelName(null);
    setPortraitTextureUrl(defaultPortraitUrl);
    setModelLoadError(null);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (customModelGroupRef.current) {
      while (customModelGroupRef.current.children.length > 0) {
        customModelGroupRef.current.remove(customModelGroupRef.current.children[0]);
      }
    }
    if (holoPortraitGroupRef.current) holoPortraitGroupRef.current.visible = true;
    if (cyberAvatarGroupRef.current) cyberAvatarGroupRef.current.visible = false;
    if (neuralCoreGroupRef.current) neuralCoreGroupRef.current.visible = false;
  };

  if (!webglSupported) {
    return (
      <div className="relative w-full h-[460px] lg:h-[560px] rounded-2xl glass-panel flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#A855F7]/20 to-[#C084FC]/20 border border-[#A855F7]/40 flex items-center justify-center mb-5">
          <Sparkles className="w-10 h-10 text-[#A855F7]" />
        </div>
        <h3 className="text-xl font-semibold text-[#FAF8FF] mb-2">Sameena P — Interactive 3D Studio</h3>
        <p className="text-sm text-[#C4B5FD] max-w-md">
          AI &amp; Data Science Engineer · Full-Stack Developer · UI/UX Designer · SEO Analyst
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] flex flex-col justify-between rounded-2xl border border-[#A855F7]/50 bg-gradient-to-b from-[#170934]/85 via-[#0D0420]/80 to-[#070312]/92 backdrop-blur-xl overflow-hidden shadow-2xl shadow-[#9333EA]/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#9333EA]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#C084FC]/25 blur-3xl"
      />

      {/* Top Interactive 3D HUD Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5">
        {/* 3D Mode Switcher */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl bg-[#070312]/90 backdrop-blur-md border border-[#A855F7]/30"
          role="group"
          aria-label="Select 3D Scene View"
        >
          <button
            type="button"
            onClick={() => setSceneMode('holo-portrait')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
              sceneMode === 'holo-portrait'
                ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                : 'text-[#C4B5FD] hover:text-[#FAF8FF]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>3D Holo-Portrait</span>
          </button>

          <button
            type="button"
            onClick={() => setSceneMode('cyber-avatar')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
              sceneMode === 'cyber-avatar'
                ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                : 'text-[#C4B5FD] hover:text-[#FAF8FF]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>3D Cyber-Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => setSceneMode('neural-core')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
              sceneMode === 'neural-core'
                ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                : 'text-[#C4B5FD] hover:text-[#FAF8FF]'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>3D Neural Core</span>
          </button>
        </div>

        {/* Continuous 3D Motion & Custom Upload Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              autoRotate
                ? 'bg-[#A855F7]/25 border-[#A855F7]/60 text-[#FAF8FF]'
                : 'bg-[#070312]/85 border-white/10 text-[#C4B5FD]'
            }`}
            title="Toggle continuous 360° 3D rotation"
          >
            {autoRotate ? <Pause className="w-3 h-3 text-[#C084FC]" /> : <Play className="w-3 h-3 text-[#C084FC]" />}
            <span>{autoRotate ? 'Moving 3D' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMotionSpeed((prev) => (prev >= 2.2 ? 1.0 : Number((prev + 0.6).toFixed(1))))}
            className="px-2 py-1.5 text-xs font-mono-tabular text-[#C084FC] bg-[#070312]/85 border border-[#A855F7]/30 rounded-lg hover:border-[#C084FC] transition-colors cursor-pointer"
            title="Change 3D Orbit Speed"
          >
            {motionSpeed.toFixed(1)}x
          </button>

          <button
            type="button"
            onClick={() => setStudioDrawerOpen((prev) => !prev)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#FAF8FF] bg-[#070312]/85 hover:border-[#A855F7]/70 backdrop-blur-md border border-[#A855F7]/30 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>Photo / GLB</span>
          </button>
        </div>
      </div>

      {studioDrawerOpen && (
        <div className="relative z-20 mx-4 mt-2 p-4 rounded-xl bg-[#0B041A]/95 backdrop-blur-xl border border-[#A855F7]/50 text-left shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#FAF8FF]">
              Customize Moving 3D Portrait &amp; Model
            </span>
            <button
              type="button"
              onClick={() => setStudioDrawerOpen(false)}
              className="text-xs text-[#C4B5FD] hover:text-[#FAF8FF] px-1.5 py-0.5 cursor-pointer"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-[#C4B5FD] leading-relaxed mb-3">
            Upload your photo to project it onto the rotating 3D Hologram Monolith AND the scrolling backside backdrop, or upload a custom <span className="font-mono-tabular text-[#FAF8FF]">.glb/.gltf</span> 3D character.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload My Photo (3D + Backside)</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
            </label>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9333EA]/30 hover:bg-[#9333EA]/50 border border-[#C084FC]/50 text-xs font-medium text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Load Custom .GLB Model</span>
              <input type="file" accept=".glb,.gltf" onChange={handleGlbUpload} className="sr-only" />
            </label>

            <button
              type="button"
              onClick={handleResetScene}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#C4B5FD] hover:text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 3D View</span>
            </button>
          </div>
          {modelLoadError && <p className="text-xs text-rose-400 mt-2">{modelLoadError}</p>}
        </div>
      )}

      {/* Interactive 360° WebGL Canvas */}
      <div
        ref={mountRef}
        className="relative inset-0 w-full flex-1 cursor-grab active:cursor-grabbing"
        aria-label="Interactive Moving 3D Scene — Drag to Orbit 360 Degrees or Scroll to Zoom"
      />

      {/* Bottom Telemetry Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 pb-3.5 pt-2 border-t border-[#A855F7]/25 bg-[#070312]/80 backdrop-blur-sm text-xs text-[#C4B5FD]">
        <span>
          {customModelName
            ? `Custom 3D Model: ${customModelName}`
            : '360° Moving 3D Stage · Drag to Spin · Scroll to Zoom'}
        </span>
        <span className="font-mono-tabular text-[11px] text-[#C084FC]">
          Three.js OrbitControls · Live 60 FPS
        </span>
      </div>
    </div>
  );
};
