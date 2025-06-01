"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiFireworks() {
  useEffect(() => {
    // Only run on client and after DOM is ready
    if (typeof window === "undefined" || !document.body) return;
    // Dynamically create a canvas on top of all content
    let canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "2147483647";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2147483647 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          canvas.remove();
        }, 500);
        return;
      }
      const particleCount = 50 * (timeLeft / duration);
      myConfetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      myConfetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
    return () => {
      clearInterval(interval);
      canvas.remove();
    };
  }, []);
  return null;
}
