import { ImageResponse } from 'next/server';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/x-icon';

export default async function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="16" fill="black"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-family="Arial">L</text>
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    }
  );
}
