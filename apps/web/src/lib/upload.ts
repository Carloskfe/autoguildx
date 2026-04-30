import api from './api';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
]);

export function validateFileType(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

export async function uploadFile(file: File): Promise<string> {
  validateFileType(file);

  const { data } = await api.post<{ uploadUrl: string; publicUrl: string; key: string }>(
    '/upload/presign',
    { filename: file.name, contentType: file.type },
  );

  const { uploadUrl, publicUrl } = data;
  const isStub = uploadUrl.startsWith('https://stub-s3.local');

  if (!isStub) {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status}). Please try again.`);
    }
  }

  return publicUrl;
}
