import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ButtonHTMLAttributes, ImgHTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';

// Base Props
export interface BaseProps {
  className?: string;
}

// Button Props
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Input Props
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

// Label Props
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement>, VariantProps<any> {
  className?: string;
}

// Avatar Props
export interface AvatarProps extends HTMLAttributes<HTMLDivElement>, VariantProps<any> {
  className?: string;
}

export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  src?: string;
  alt?: string;
}

export interface AvatarFallbackProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// Card Props
export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<any> {
  className?: string;
}

// Icon Props
export interface LucideProps extends HTMLAttributes<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  color?: string;
  icon?: string;
  className?: string;
}
