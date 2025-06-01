import type { HTMLAttributes } from 'react'

export interface LucideProps extends HTMLAttributes<SVGElement> {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
}

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}
