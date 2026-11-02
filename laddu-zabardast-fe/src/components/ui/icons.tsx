'use client';

import { forwardRef, type SVGProps } from 'react';
import * as icons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: keyof typeof icons;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(({ icon, ...props }, ref) => {
  const IconComponent = icons[icon] as LucideIcon;
  return <IconComponent ref={ref} {...props} />;
});
