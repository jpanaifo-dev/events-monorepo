import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2"

export type OrganizationAssetType =
  | "branding/logo"
  | "branding/cover"
  | "branding/favicon"
  | "events/cover"
  | "events/logo"
  | "events/media"
  | "profiles/avatar"
  | "certificates/background"

export interface OrganizationAssetTarget {
  organizationId: string
  type: OrganizationAssetType
  /** Required for assets owned by an event, profile, or certificate template. */
  resourceId?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Canonical R2 key layout. A tenant UUID is always the first namespace after
 * `organizations`, so files from distinct institutions cannot share a prefix.
 */
export function buildOrganizationAssetKey(target: OrganizationAssetTarget, file: File): string {
  if (!UUID_PATTERN.test(target.organizationId)) throw new Error("organizationId debe ser un UUID válido.")
  if (target.resourceId && !UUID_PATTERN.test(target.resourceId)) throw new Error("resourceId debe ser un UUID válido.")

  const [area, variant] = target.type.split("/")
  const scopedAreas = new Set(["events", "profiles", "certificates"])
  if (scopedAreas.has(area) && !target.resourceId) {
    throw new Error(`${target.type} requiere el UUID del recurso.`)
  }

  const resourceSegment = target.resourceId ? `/${target.resourceId}` : ""
  return `organizations/${target.organizationId}/${area}${resourceSegment}/${variant}/${crypto.randomUUID()}${getFileExtension(file)}`
}

/** Uploads an institution-scoped asset using the canonical R2 key layout. */
export async function uploadOrganizationAsset(file: File, target: OrganizationAssetTarget): Promise<string> {
  return uploadFileToR2(file, buildOrganizationAssetKey(target, file))
}

/**
 * Legacy upload function. Do not use it for new code: callers must use
 * uploadOrganizationAsset so the organization UUID is part of the key.
 */
export async function uploadToR2(
  file: File,
  folder: string = "general",
  _identifier: string = "file"
): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2 bucket name is not configured.")
  }

  // Use one UUID per object. The URL therefore contains the UUID of the exact
  // file that was uploaded, rather than an identifier supplied by the caller.
  const normalizedFolder = folder.replace(/^\/+|\/+$/g, "") || "general"
  const key = `${normalizedFolder}/${crypto.randomUUID()}${getFileExtension(file)}`

  return uploadFileToR2(file, key)
}

async function uploadFileToR2(file: File, key: string): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2 bucket name is not configured.")
  }

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

function getFileExtension(file: File): string {
  const fileNameExtension = file.name.match(/(\.[a-zA-Z0-9]{1,16})$/)?.[1]
  if (fileNameExtension) {
    return fileNameExtension.toLowerCase()
  }

  const extensionByMimeType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/webm": ".webm",
    "audio/mp4": ".m4a",
  }

  return extensionByMimeType[file.type.toLowerCase()] || ""
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
