import { getCloudflareContext } from '@opennextjs/cloudflare'

function getR2() {
  const { env } = getCloudflareContext()
  if (!env.R2) throw new Error('R2 binding is not configured')
  return env.R2
}

function shouldServeInline(contentType: string): boolean {
  return (
    (contentType.startsWith('image/') && contentType !== 'image/svg+xml') ||
    contentType.startsWith('video/') ||
    contentType.startsWith('audio/')
  )
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false
): Promise<{ uploadUrl: string; cloudStoragePath: string }> {
  const r2 = getR2()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const cloudStoragePath = isPublic
    ? `public/uploads/${Date.now()}-${safeName}`
    : `uploads/${Date.now()}-${safeName}`

  const key = cloudStoragePath
  // R2 does not provide presigned URLs without an API token; instead we return
  // a direct upload URL handled by the Worker. For simplicity we generate a
  // public URL and rely on the app uploading through our API route which calls
  // put() directly. We return the path and a public URL placeholder.
  const publicUrl = `${getPublicBase()}/${key}`
  return { uploadUrl: publicUrl, cloudStoragePath: key }
}

export async function getFileUrl(
  cloudStoragePath: string,
  contentType: string,
  isPublic = false
): Promise<string> {
  return `${getPublicBase()}/${cloudStoragePath}`
}

export async function putFile(
  cloudStoragePath: string,
  body: ArrayBuffer | Uint8Array | string,
  contentType: string
): Promise<void> {
  const r2 = getR2()
  await r2.put(cloudStoragePath, body, { httpMetadata: { contentType } })
}

export async function deleteFile(cloudStoragePath: string): Promise<void> {
  const r2 = getR2()
  await r2.delete(cloudStoragePath)
}

function getPublicBase(): string {
  const { env } = getCloudflareContext()
  // R2 public bucket URL (set in wrangler custom_domain or use the default dev URL)
  return (
    (env as Record<string, string>).R2_PUBLIC_URL ||
    'https://pub-placeholder.r2.cloudflarestorage.com'
  )
}

// Resolve a stored image reference to a usable URL.
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('/')) return path
  return `${getPublicBase()}/${path}`
}
