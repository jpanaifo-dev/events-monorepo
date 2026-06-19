import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2"

/**
 * Uploads a file to Cloudflare R2.
 * @param file The file object from browser.
 * @param folder The folder in the bucket (e.g. "organizations").
 * @param identifier A unique identifier prefix (e.g. "org-slug-logo").
 * @returns The public URL of the uploaded file.
 */
export async function uploadToR2(
  file: File,
  folder: string = "general",
  identifier: string = "file"
): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2 bucket name is not configured.")
  }

  // Generate a safe unique key: {folder}/{identifier}-{timestamp}-{filename}
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const key = `${folder}/${identifier}-${Date.now()}-${cleanFileName}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: file.type,
  })

  await r2Client.send(command)

  // Construct the public URL
  const baseUrl = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL
  return `${baseUrl}/${key}`
}

/**
 * Deletes a file from Cloudflare R2 if it belongs to our R2 bucket.
 * @param url The public URL of the file.
 */
export async function deleteFromR2(url: string): Promise<void> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2 bucket name is not configured.")
  }

  const baseUrl = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL
  
  // Verify that the URL belongs to our bucket
  if (!url.startsWith(baseUrl)) {
    console.warn("Skipping R2 deletion: URL does not match R2 public URL prefix.", url)
    return
  }

  // Extract key
  const key = url.replace(`${baseUrl}/`, "")

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}
