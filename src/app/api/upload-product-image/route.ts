import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs'; // Ensure Node.js runtime for file system access

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `product_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const dir = path.join(process.cwd(), 'public/images/products');
  const filePath = path.join(dir, filename);

  // Ensure the directory exists
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/images/products/${filename}` });
}
