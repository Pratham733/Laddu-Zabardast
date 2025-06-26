import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const runtime = 'nodejs';

function bufferToStream(buffer: Buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
}

export async function POST(request: Request) {
  try {
    // Debug: Log all request headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Received request headers:', headers);

    let formData: FormData;
    try {
      formData = await request.formData();
      
      // Debug: Log form data entries
      console.log('Form data entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? 
          `File(${value.name}, ${value.type}, ${value.size} bytes)` : 
          value
        );
      }
      
    } catch (error) {
      console.error('Error parsing form data:', error);
      return NextResponse.json(
        { 
          error: 'Failed to parse form data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Get file from form data
    const file = formData.get('file'); 20
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file uploaded or invalid file data' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }    // Process the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = bufferToStream(buffer);

    try {
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'products',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          }
        );

        stream.pipe(uploadStream);
      });

      return NextResponse.json({
        url: result.secure_url,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file to Cloudinary' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error during upload:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
