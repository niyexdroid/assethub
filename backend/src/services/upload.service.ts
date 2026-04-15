import { imagekit } from '../config/imagekit';
import { env } from '../config/env';

export type UploadFolder = 'properties' | 'avatars' | 'documents' | 'kyc';

export interface UploadResult {
  url:      string;   // full CDN URL
  fileId:   string;   // ImageKit file ID (for deletion)
  filePath: string;   // e.g. /properties/abc123.jpg
}

/**
 * Upload a single file buffer to ImageKit.
 * Returns the CDN URL, fileId, and filePath.
 */
export async function uploadFile(
  buffer:   Buffer,
  fileName: string,
  folder:   UploadFolder = 'properties',
): Promise<UploadResult> {
  const response = await imagekit.upload({
    file:              buffer.toString('base64'),
    fileName,
    folder:            `/${folder}`,
    useUniqueFileName: true,
    tags:              [folder],
  });

  return {
    url:      response.url,
    fileId:   response.fileId,
    filePath: response.filePath,
  };
}

/**
 * Delete a file from ImageKit by its fileId.
 */
export async function deleteFile(fileId: string): Promise<void> {
  await imagekit.deleteFile(fileId);
}

/**
 * Build a transformed URL — resize, WebP, quality.
 * Use on the frontend too via the URL endpoint directly.
 */
export function transformUrl(
  filePath: string,
  opts: { width?: number; height?: number; quality?: number } = {},
): string {
  const transforms: any[] = [{ format: 'webp', quality: String(opts.quality ?? 80) }];
  if (opts.width)  transforms[0].width  = String(opts.width);
  if (opts.height) transforms[0].height = String(opts.height);

  return imagekit.url({ path: filePath, transformation: transforms });
}
