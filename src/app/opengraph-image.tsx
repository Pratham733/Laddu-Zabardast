import { ImageResponse } from 'next/server';
 
export const runtime = 'edge';
 
export const alt = 'Laddu Zabardast - Authentic Indian Sweets & Pickles';
export const size = {
  width: 1200,
  height: 630,
};
 
export const contentType = 'image/png';
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #FFD700, #FFA500)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: '60px',
            fontWeight: 'bold',
            color: '#000',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          LADDU ZABARDAST
        </div>
        <div
          style={{
            fontSize: '32px',
            color: '#333',
            textAlign: 'center',
          }}
        >
          Authentic Indian Sweets & Pickles
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
