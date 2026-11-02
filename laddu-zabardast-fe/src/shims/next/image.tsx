// src/shims/next/image.tsx
import React from "react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
  fill?: boolean;
  unoptimized?: boolean;
}

export default function Image({ priority, fill, unoptimized, className, style, ...props }: ImageProps) {
  const fillStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        objectFit: 'cover',
      }
    : {};

  return (
    <img
      className={className}
      style={{ ...fillStyle, ...style }}
      {...props}
    />
  );
}
