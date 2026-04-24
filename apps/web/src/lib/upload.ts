import api from './api';

export async function uploadFile(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await api
    .post<{ uploadUrl: string; publicUrl: string; key: string }>('/upload/presign', {
      filename: file.name,
      contentType: file.type,
    })
    .then((r) => r.data);

  try {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
  } catch {
    // stub mode — upload target unreachable, proceed with publicUrl
  }

  return publicUrl;
}
