import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Matter from 'matter-js';

export interface ConfettiPhysicsRef {
  spawn: (x: number, y: number) => void;
}

interface ConfettiPhysicsProps {
  notebookRef: React.RefObject<HTMLDivElement | null>;
}

const ConfettiPhysics = forwardRef<ConfettiPhysicsRef, ConfettiPhysicsProps>(({ notebookRef }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine>(Matter.Engine.create({
    gravity: { x: 0, y: 0.8 } // Increased gravity for faster fall
  }));
  const runnerRef = useRef<Matter.Runner | null>(null);
  const particlesRef = useRef<Array<{ 
    body: Matter.Body, 
    color: string, 
    phase: number, 
    rotationSpeed: number,
    isSettled: boolean,
    depthScale: number,
    targetY: number,
    id: number // Added for layering priority
  }>>([]);
  const idCounter = useRef(0);

  const colors = ['#FFFFFF', '#FDFDFD', '#F9F9F9'];

  useImperativeHandle(ref, () => ({
    spawn: (clientX: number, clientY: number) => {
      const engine = engineRef.current;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const scrollY = window.scrollY;
      const x = clientX;
      const y = clientY + scrollY; // Convert to document-relative
      
      const radius = 8;
      // Disable collisions between particles by setting a negative group
      const body = Matter.Bodies.circle(x, y, radius, {
        restitution: 0.1,
        friction: 0.5,
        frictionAir: 0.1, // Increased air resistance for a lighter, leaf-like fall
        collisionFilter: {
          group: -1 // This prevents collision with other particles
        },
        render: { visible: false }
      });
      
      // Initial "pop" effect - reduced upward force
      const force = 0.5 + Math.random() * 1;
      
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: -force // Small initial jump
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      // Assign a random target Y within the trapezoid area for landing
      // Positioned relative to the notebook (document-relative)
      let floorTop = y + 500;
      let floorBottom = y + 700;

      if (notebookRef.current) {
        const rect = notebookRef.current.getBoundingClientRect();
        // rect.bottom is viewport-relative, so add scrollY to get document-relative
        floorTop = rect.bottom + scrollY - 20; 
        floorBottom = rect.bottom + scrollY + 180;
      }

      const targetY = floorTop + Math.random() * (floorBottom - floorTop);

      particlesRef.current.push({
        body,
        color,
        phase: Math.random() * Math.PI * 2,
        rotationSpeed: 0.08 + Math.random() * 0.04, // Slightly faster frequency for tighter zig-zag
        isSettled: false,
        depthScale: 1.0,
        targetY, // Store the landing depth (document-relative)
        id: idCounter.current++ // Unique ID for layering
      });

      if (particlesRef.current.length > 100) {
        const removed = particlesRef.current.shift();
        if (removed) {
          Matter.Composite.remove(engine.world, removed.body);
        }
      }

      Matter.Composite.add(engine.world, body);
    }
  }));

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We don't need physical walls/ground anymore as we use targetY logic
    // But we can keep them far away just in case
    const wallThickness = 100;
    const ground = Matter.Bodies.rectangle(0, 10000, 1, 1, { isStatic: true, render: { visible: false } });
    Matter.Composite.add(engine.world, [ground]);

    const updateSize = (width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          updateSize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    let animationId: number;
    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const scrollY = window.scrollY;
      
      ctx.clearRect(0, 0, width, height);
      
      // Define Trapezoid landing zone relative to notebook (document-relative)
      let trapBottomY = height - 30 + scrollY;
      let trapTopY = height - 230 + scrollY;
      let trapCenterX = width / 2;
      let trapBaseWidth = 400;

      if (notebookRef.current) {
        const rect = notebookRef.current.getBoundingClientRect();
        trapTopY = rect.bottom + scrollY - 20;
        trapBottomY = rect.bottom + scrollY + 180;
        trapCenterX = rect.left + rect.width / 2;
        trapBaseWidth = rect.width;
      }

      const trapWidthBottom = trapBaseWidth * 1.2;
      const trapWidthTop = trapBaseWidth * 0.8;
      
      // Draw Trapezoid (Subtle background)
      // We need to render it relative to the viewport
      ctx.save();
      ctx.translate(0, -scrollY);
      ctx.beginPath();
      ctx.moveTo(trapCenterX - trapWidthTop / 2, trapTopY);
      ctx.lineTo(trapCenterX + trapWidthTop / 2, trapTopY);
      ctx.lineTo(trapCenterX + trapWidthBottom / 2, trapBottomY);
      ctx.lineTo(trapCenterX - trapWidthBottom / 2, trapBottomY);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 47, 167, 0.1)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Sort particles by Y position for z-index effect (painter's algorithm)
      // We add a small weight to the ID so that newer particles appear on top
      // if they are at a similar depth.
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        const ay = a.body.position.y + (a.id * 0.5);
        const by = b.body.position.y + (b.id * 0.5);
        return ay - by;
      });

      sortedParticles.forEach(p => {
        const { position, angle } = p.body;
        const particleData = p as any;
        
        // Perspective Scaling Logic
        // Scale 1.0 at trapTopY, Scale 1.5 at trapBottomY
        const normalizedY = Math.max(0, Math.min(1, (position.y - trapTopY) / (trapBottomY - trapTopY)));
        p.depthScale = 1.0 + (normalizedY * 0.5);

        // Landing Logic: Check if it reached its target depth
        if (!p.isSettled && position.y >= particleData.targetY) {
          p.isSettled = true;
          Matter.Body.setStatic(p.body, true);
          Matter.Body.setAngle(p.body, 0); // Force zero rotation on landing
          Matter.Body.setPosition(p.body, { x: position.x, y: particleData.targetY });
        }

        if (!p.isSettled) {
          p.phase += p.rotationSpeed;
          // Smaller sway force for tighter zig-zag
          const swayForce = Math.sin(p.phase) * 0.0003; 
          // Lift/Drag effect: fall slower when "flat"
          const lift = Math.abs(Math.cos(p.phase)) * 0.00003; 
          
          Matter.Body.applyForce(p.body, p.body.position, {
            x: swayForce,
            y: -lift
          });

          // Tilting effect: subtle tilt based on sway direction
          const tilt = Math.sin(p.phase) * 0.3;
          Matter.Body.setAngle(p.body, tilt);
        }
        
        const currentScale = p.depthScale;
        const distanceToTarget = Math.max(0, particleData.targetY - position.y);
        
        // Render relative to viewport
        const renderX = position.x;
        const renderY = position.y - scrollY;
        const renderTargetY = particleData.targetY - scrollY;

        // Shadow logic
        const maxShadowDist = 200;
        const shadowAlpha = Math.max(0, 1 - (distanceToTarget / maxShadowDist)) * 0.1;
        const shadowScale = Math.max(0.2, 1 - (distanceToTarget / maxShadowDist)) * currentScale;
        
        if (distanceToTarget < maxShadowDist) {
          ctx.save();
          ctx.translate(renderX, renderTargetY);
          ctx.beginPath();
          ctx.ellipse(0, 0, 12 * shadowScale, 3 * shadowScale, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 47, 167, ${shadowAlpha})`;
          ctx.fill();
          ctx.restore();
        }

        // Paper Bit rendering
        const flipScale = p.isSettled ? 1.0 : Math.cos(p.phase);
        // Perspective flattening (elliptical shape)
        const perspectiveScaleY = p.isSettled ? 0.3 : Math.max(0.3, Math.min(1, distanceToTarget / 100));
        
        ctx.save();
        ctx.translate(renderX, renderY);
        // If settled, ignore the body's angle to ensure it's perfectly horizontal
        ctx.rotate(p.isSettled ? 0 : angle);
        ctx.scale(currentScale, currentScale);
        
        ctx.beginPath();
        // Paper shape: width is 12, height is flattened by perspective and flip
        ctx.ellipse(0, 0, 12, Math.abs(flipScale) * 12 * perspectiveScaleY, 0, 0, Math.PI * 2);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.isSettled ? 1 : 0.8 + Math.abs(flipScale) * 0.2;
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = p.isSettled ? 'rgba(0, 47, 167, 0.2)' : 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 1 / currentScale;
        ctx.stroke();
        
        ctx.restore();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
});

ConfettiPhysics.displayName = 'ConfettiPhysics';

export default ConfettiPhysics;
