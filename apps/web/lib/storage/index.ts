// Storage Module Index
export {
  getS3Client,
  getS3Bucket,
  getS3Region,
  getUploadPath,
  getExportPath,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  uploadFile,
  deleteFile,
  listFiles,
  isS3Configured,
} from './s3-client';

import { prisma } from '@/lib/prisma';
import { FileCategory } from '@prisma/client';
import { getS3Bucket, getS3Region, getUploadPath, generatePresignedUploadUrl, deleteFile as s3DeleteFile } from './s3-client';

// File upload service
export interface UploadRequest {
  filename: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  entityType?: string;
  entityId?: string;
  userId: string;
}

export interface UploadResponse {
  uploadUrl: string;
  fileId: string;
  key: string;
}

export async function createUploadRequest(request: UploadRequest): Promise<UploadResponse> {
  const key = getUploadPath(request.category.toLowerCase(), request.filename);

  // Generate presigned URL
  const uploadUrl = await generatePresignedUploadUrl(key, request.mimeType);

  // Create file record in database
  const file = await prisma.storedFile.create({
    data: {
      filename: key.split('/').pop() || request.filename,
      originalName: request.filename,
      mimeType: request.mimeType,
      size: request.size,
      bucket: getS3Bucket(),
      key,
      region: getS3Region(),
      category: request.category,
      entityType: request.entityType,
      entityId: request.entityId,
      uploadedById: request.userId,
    },
  });

  return {
    uploadUrl,
    fileId: file.id,
    key,
  };
}

// Get file by ID
export async function getFileById(fileId: string) {
  return prisma.storedFile.findUnique({
    where: { id: fileId },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

// Delete file (from S3 and database)
export async function deleteStoredFile(fileId: string): Promise<void> {
  const file = await prisma.storedFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error('File not found');
  }

  // Delete from S3
  await s3DeleteFile(file.key);

  // Delete from database
  await prisma.storedFile.delete({
    where: { id: fileId },
  });
}

// List files by entity
export async function getFilesByEntity(entityType: string, entityId: string) {
  return prisma.storedFile.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

// List files by user
export async function getFilesByUser(userId: string, limit: number = 50) {
  return prisma.storedFile.findMany({
    where: { uploadedById: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
