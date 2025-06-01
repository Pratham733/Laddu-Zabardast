import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    // Generate a unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `profile_${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    // Save to public/images/
    const savePath = path.join(process.cwd(), 'public', 'images', filename);
    await fs.writeFile(savePath, buffer);
    // Return the public URL
    const url = `/images/${filename}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
  }
}