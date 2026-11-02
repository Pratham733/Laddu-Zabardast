import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  name?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  type?: string;
  placeholder?: string;
}

declare module 'react' {
  interface JSX {
    IntrinsicElements: { input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> }
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, name, value, onChange, placeholder, ...props }, ref) => {
    return React.createElement('input', {
      type,
      name,
      value,
      onChange,
      placeholder,
      className: cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ref,
      ...props
    });
  }
)
Input.displayName = "Input"

export { Input }
