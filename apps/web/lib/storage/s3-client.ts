// AWS S3 Client Configuration
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration
const S3_CONFIG = {
  region: process.env.AWS_REGION || 'ap-southeast-1',
  bucket: process.env.AWS_S3_BUCKET || 'dafc-otb-platform',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// Initialize S3 Client
let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_CONFIG.region,
      credentials: S3_CONFIG.accessKeyId && S3_CONFIG.secretAccessKey
        ? {
            accessKeyId: S3_CONFIG.accessKeyId,
            secretAccessKey: S3_CONFIG.secretAccessKey,
          }
        : undefined,
    });
  }
  return s3Client;
}

export function getS3Bucket(): string {
  return S3_CONFIG.bucket;
}

export function getS3Region(): string {
  return S3_CONFIG.region;
}

// File path helpers
export function getUploadPath(category: string, filename: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `uploads/${category}/${year}/${month}/${Date.now()}-${filename}`;
}

export function getExportPath(type: string, filename: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `exports/${type}/${year}/${month}/${filename}`;
}

// Generate presigned URL for upload
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// Generate presigned URL for download
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// Upload file directly
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<void> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await client.send(command);
}

// Delete file
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
  });

  await client.send(command);
}

// List files in a prefix
export async function listFiles(prefix: string, maxKeys: number = 100): Promise<{
  files: { key: string; size: number; lastModified: Date }[];
  isTruncated: boolean;
}> {
  const client = getS3Client();
  const command = new ListObjectsV2Command({
    Bucket: S3_CONFIG.bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);

  return {
    files: (response.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    })),
    isTruncated: response.IsTruncated || false,
  };
}

// Check if S3 is configured
export function isS3Configured(): boolean {
  return !!(S3_CONFIG.accessKeyId && S3_CONFIG.secretAccessKey && S3_CONFIG.bucket);
}
