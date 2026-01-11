import React, { useEffect, useRef } from "react";

type Rgb = { r: number; g: number; b: number };

const DEFAULT_COLOR_A: Rgb = { r: 29, g: 185, b: 84 };
const DEFAULT_COLOR_B: Rgb = { r: 181, g: 140, b: 255 };
const DEFAULT_COLOR_DARK: Rgb = { r: 255, g: 255, b: 255 };

const parseHex = (value: string): Rgb | null => {
  const hex = value.replace("#", "").trim();
  if (hex.length !== 6) return null;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
};

const parseRgb = (value: string): Rgb | null => {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1]
    .split(",")
    .map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
};

const readCssColor = (name: string, fallback: Rgb): Rgb => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return parseHex(value) || parseRgb(value) || fallback;
};

export default function ParticleBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let colorA = DEFAULT_COLOR_A;
    let colorB = DEFAULT_COLOR_B;
    let isDark = false;
    const pointer = { x: 0, y: 0, active: false };

    const updateColors = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      isDark = theme === "dark";
      if (isDark) {
        colorA = DEFAULT_COLOR_DARK;
        colorB = DEFAULT_COLOR_DARK;
      } else {
        colorA = readCssColor("--accent", DEFAULT_COLOR_A);
        colorB = colorA;
      }
    };

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: 1 + Math.random() * 1.8,
    }));

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const maxDistance = Math.min(width, height) * 0.22;
      const maxDistanceSq = maxDistance * maxDistance;
      const influenceRadius = Math.min(width, height) * 0.18;
      const influenceRadiusSq = influenceRadius * influenceRadius;

      for (const particle of particles) {
        particle.x += particle.vx / width;
        particle.y += particle.vy / height;

        if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
        if (particle.y < 0 || particle.y > 1) particle.vy *= -1;

        particle.x = Math.max(0, Math.min(1, particle.x));
        particle.y = Math.max(0, Math.min(1, particle.y));

        if (pointer.active) {
          const px = particle.x * width;
          const py = particle.y * height;
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < influenceRadiusSq && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / influenceRadius) * 0.45;
            particle.vx += (dx / dist) * (force / width);
            particle.vy += (dy / dist) * (force / height);
          }
        }
      }

      for (let i = 0; i < particles.length; i += 1) {
        const p1 = particles[i];
        const x1 = p1.x * width;
        const y1 = p1.y * height;

        for (let j = i + 1; j < particles.length; j += 1) {
          const p2 = particles[j];
          const dx = x1 - p2.x * width;
          const dy = y1 - p2.y * height;
          const distSq = dx * dx + dy * dy;
          if (distSq > maxDistanceSq) continue;
          const t = 1 - distSq / maxDistanceSq;
          const alpha = (isDark ? 0.18 : 0.32) * t;
          const mix = t * 0.65;
          const r = Math.round(colorA.r * (1 - mix) + colorB.r * mix);
          const g = Math.round(colorA.g * (1 - mix) + colorB.g * mix);
          const b = Math.round(colorA.b * (1 - mix) + colorB.b * mix);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      }

      for (const particle of particles) {
        const x = particle.x * width;
        const y = particle.y * height;
        const glowMix = 0.45;
        const r = Math.round(colorA.r * (1 - glowMix) + colorB.r * glowMix);
        const g = Math.round(colorA.g * (1 - glowMix) + colorB.g * glowMix);
        const b = Math.round(colorA.b * (1 - glowMix) + colorB.b * glowMix);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${isDark ? 0.55 : 0.85})`;
        ctx.beginPath();
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointer.active) {
        for (const particle of particles) {
          const x = particle.x * width;
          const y = particle.y * height;
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > influenceRadiusSq) continue;
          const t = 1 - distSq / influenceRadiusSq;
          const alpha = (isDark ? 0.22 : 0.36) * t;
          ctx.strokeStyle = `rgba(${colorA.r}, ${colorA.g}, ${colorA.b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }

      animationId = window.requestAnimationFrame(draw);
    };

    updateColors();
    resize();
    draw();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });

    const handlePointerMove = (event: MouseEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const handlePointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}
