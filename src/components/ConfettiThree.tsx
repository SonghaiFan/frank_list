import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import * as THREE from 'three';

export interface ConfettiThreeRef {
  spawn: (x: number, y: number) => void;
}

const ConfettiThree = forwardRef<ConfettiThreeRef>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<Array<{
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotationVelocity: THREE.Vector3;
    isSettled: boolean;
    phase: number;
    rotationSpeed: number;
  }>>([]);

  const colors = [0xFFFFFF, 0xFDFDFD, 0xF9F9F9];

  useImperativeHandle(ref, () => ({
    spawn: (x: number, y: number) => {
      if (!sceneRef.current || !cameraRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1
      );

      // Project screen point to a plane at z=0 (where the notebook is)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current!);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const spawnPos = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, spawnPos);

      // If no intersection (rare), use a default distance
      if (spawnPos.length() === 0) {
        raycaster.ray.at(10, spawnPos);
      }

      const geometry = new THREE.PlaneGeometry(0.8, 0.8); // Increased size
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({ 
        color, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(spawnPos);
      
      // Random initial rotation
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      
      sceneRef.current.add(mesh);

      // Initial velocity (mostly down and out)
      const angle = (Math.random() * Math.PI * 0.6) + (Math.PI * 0.2);
      const force = 0.15 + Math.random() * 0.15; // Increased force
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * force * 2,
        -Math.sin(angle) * force * 2,
        (Math.random() - 0.5) * 0.1 // More depth movement
      );

      const rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );

      particlesRef.current.push({
        mesh,
        velocity,
        rotationVelocity,
        isSettled: false,
        phase: Math.random() * Math.PI * 2,
        rotationSpeed: 0.05 + Math.random() * 0.1
      });

      // Limit count
      if (particlesRef.current.length > 150) {
        const removed = particlesRef.current.shift();
        if (removed) {
          sceneRef.current.remove(removed.mesh);
          removed.mesh.geometry.dispose();
          (removed.mesh.material as THREE.Material).dispose();
        }
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15); // Closer to scene
    camera.lookAt(0, -2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Floor (invisible but receives shadows)
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.ShadowMaterial({ 
      opacity: 0.1 // Subtle shadow
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = true;
    scene.add(floor);

    // Remove the visible border line as it's distracting
    
    const floorY = -8;

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      particlesRef.current.forEach(p => {
        if (p.isSettled) return;

        // Gravity
        p.velocity.y -= 0.006;
        
        // Air resistance / Flutter
        p.phase += p.rotationSpeed;
        const flutter = Math.sin(p.phase) * 0.002;
        p.velocity.x += flutter;
        p.velocity.y += Math.abs(flutter) * 0.3;

        // Update position
        p.mesh.position.add(p.velocity);
        
        // Update rotation
        p.mesh.rotation.x += p.rotationVelocity.x;
        p.mesh.rotation.y += p.rotationVelocity.y;
        p.mesh.rotation.z += p.rotationVelocity.z;

        // Collision with floor
        if (p.mesh.position.y <= floorY + 0.05) {
          p.mesh.position.y = floorY + 0.02;
          p.isSettled = true;
          
          // Lay flat
          p.mesh.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI);
          
          const mat = p.mesh.material as THREE.MeshStandardMaterial;
          mat.opacity = 1;
          
          // Add blue outline for settled bits
          const edges = new THREE.EdgesGeometry(p.mesh.geometry);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x002FA7, transparent: true, opacity: 0.3 }));
          p.mesh.add(line);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-40 overflow-hidden" />
  );
});

ConfettiThree.displayName = 'ConfettiThree';

export default ConfettiThree;
