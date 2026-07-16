import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

function shouldServeInline(contentType: string): boolean {
  return (
    (contentType.startsWith("image/") && contentType !== "image/svg+xml") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/")
  );
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false
): Promise<{ uploadUrl: string; cloudStoragePath: string }> {
  const s3 = createS3Client();
  const { bucketName, folderPrefix } = getBucketConfig();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const cloudStoragePath = isPublic
    ? `${folderPrefix}public/uploads/${Date.now()}-${safeName}`
    : `${folderPrefix}uploads/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { uploadUrl, cloudStoragePath };
}

export async function getFileUrl(
  cloudStoragePath: string,
  contentType: string,
  isPublic = false
): Promise<string> {
  const { bucketName } = getBucketConfig();
  const region = process.env.AWS_REGION ?? "us-west-2";
  if (isPublic) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloudStoragePath}`;
  }
  const s3 = createS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ResponseContentDisposition: shouldServeInline(contentType)
      ? "inline"
      : "attachment",
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteFile(cloudStoragePath: string): Promise<void> {
  const s3 = createS3Client();
  const { bucketName } = getBucketConfig();
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: cloudStoragePath })
  );
}

// Resolve a stored image reference to a usable URL.
// - Local seed paths (start with "/" or "http") are returned as-is.
// - Otherwise treated as a public cloudStoragePath and built into an S3 public URL.
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const { bucketName } = getBucketConfig();
  const region = process.env.AWS_REGION ?? "us-west-2";
  return `https://${bucketName}.s3.${region}.amazonaws.com/${path}`;
}
