import type { HTMLAttributes, DetailedHTMLProps } from 'react';

export interface BaseProps {
  className?: string;
}

export interface ButtonProps extends BaseProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'link' | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface InputProps extends BaseProps {
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
}

export interface SelectProps extends BaseProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export interface RadioGroupProps extends BaseProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export interface RadioGroupItemProps extends BaseProps {
  value: string;
  id?: string;
}

export interface AvatarProps extends BaseProps {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export interface AvatarImageProps extends BaseProps {
  src?: string;
  alt?: string;
}

export interface TabsProps extends BaseProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

export interface TabsTriggerProps extends BaseProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface TabsContentProps extends BaseProps {
  value: string;
  forceMount?: boolean;
  children?: React.ReactNode;
}

export interface DialogProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export interface DialogContentProps extends BaseProps {
  forceMount?: boolean;
  children?: React.ReactNode;
}

export interface CardProps extends BaseProps {
  orientation?: 'horizontal' | 'vertical';
  children?: React.ReactNode;
}

export interface CardHeaderProps extends BaseProps {
  children?: React.ReactNode;
}

export interface CardTitleProps extends BaseProps {
  children?: React.ReactNode;
}

export interface CardContentProps extends BaseProps {
  children?: React.ReactNode;
}

export interface AlertProps extends BaseProps {
  variant?: 'default' | 'destructive';
  children?: React.ReactNode;
}

export interface LucideProps extends BaseProps {
  size?: number;
  color?: string;
  className?: string;
}

// Add React.JSX intrinsic element types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
      ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
    }
  }
}
