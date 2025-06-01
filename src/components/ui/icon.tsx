'use client';

import { type SVGProps } from 'react'
import * as icons from 'lucide-react'

export type IconName = keyof typeof icons;

export interface IconProps extends SVGProps<SVGSVGElement> {
  icon: IconName;
  className?: string;
  size?: number | string;
}

const IconComponent = ({ icon, className, size = 24, ...props }: IconProps) => {
  // Get the icon component from lucide-react
  const LucideIcon = icons[icon] as React.FC<SVGProps<SVGSVGElement> & { size?: number | string }>
  return <LucideIcon className={className} size={size} {...props} />
}

// Export the Icon component
export { IconComponent as Icon }

// End of file
