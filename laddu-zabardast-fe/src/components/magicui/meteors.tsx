"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

function getMeteorStyle(angle: number, minDelay: number, maxDelay: number, minDuration: number, maxDuration: number) {
  // Diagonal movement: angle in degrees, negative for top-left to bottom-right
  const rad = (angle * Math.PI) / 180;
  const distance = 700; // px, how far the meteor travels
  const dx = Math.cos(rad) * distance;
  const dy = Math.sin(rad) * distance;
  return {
    "--angle": `${angle}deg`,
    top: "-5%",
    left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)` ,
    animationDelay: Math.random() * (maxDelay - minDelay) + minDelay + "s",
    animationDuration:
      Math.floor(Math.random() * (maxDuration - minDuration) + minDuration) +
      "s",
    "--dx": `${dx}px`,
    "--dy": `${dy}px`,
  } as React.CSSProperties;
}

export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) => {
  const [meteors, setMeteors] = useState(
    () => Array.from({ length: number }, (_, i) => ({ id: i, style: getMeteorStyle(angle, minDelay, maxDelay, minDuration, maxDuration), key: Math.random() }))
  );

  // Respawn meteor after animation ends
  const handleAnimationEnd = (idx: number) => {
    setMeteors((prev) => {
      const newArr = [...prev];
      newArr[idx] = {
        id: prev[idx].id,
        style: getMeteorStyle(angle, minDelay, maxDelay, minDuration, maxDuration),
        key: Math.random(),
      };
      return newArr;
    });
  };

  useEffect(() => {
    // If number prop changes, update meteors
    setMeteors(Array.from({ length: number }, (_, i) => ({ id: i, style: getMeteorStyle(angle, minDelay, maxDelay, minDuration, maxDuration), key: Math.random() })));
    // eslint-disable-next-line
  }, [number, angle, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <>
      {meteors.map((meteor, idx) => (
        <span
          key={meteor.key}
          style={meteor.style}
          className={cn(
            "pointer-events-none absolute size-0.5 animate-meteor-diag rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]",
            className,
          )}
          onAnimationEnd={() => handleAnimationEnd(idx)}
        >
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-zinc-500 to-transparent" />
        </span>
      ))}
    </>
  );
};

export function MeteorDemo() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border">
      <Meteors number={30} />
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-5xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10 px-4 py-2">
        Meteors
      </span>
    </div>
  );
}
