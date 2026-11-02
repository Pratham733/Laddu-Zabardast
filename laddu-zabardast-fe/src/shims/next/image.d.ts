declare module 'next/image' {
  import * as React from 'react';
  export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    priority?: boolean;
    fill?: boolean;
    unoptimized?: boolean;
  }
  const Image: React.FC<ImageProps>;
  export default Image;
}
