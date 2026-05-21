// Animated canvas background — glowing node network
import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 60;
const MAX_LINK_DIST  = 160;
const NODE_COLOR     = "rgba(0,255,102,0.5)";
const LINE_COLOR     = "rgba(0,255,102,";

export default function CanvasBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 2 + 1,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      // Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_LINK_DIST) {
            const alpha = (1 - dist / MAX_LINK_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `${LINE_COLOR}${alpha})`;
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }

      // Dots
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLOR;
        ctx.shadowColor = "rgba(0,255,102,0.8)";
        ctx.shadowBlur  = 6;
        ctx.fill();
        ctx.shadowBlur  = 0;
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas-bg" />;
}
