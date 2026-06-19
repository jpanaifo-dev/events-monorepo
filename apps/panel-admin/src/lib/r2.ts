import { S3Client } from '@aws-sdk/client-s3'

declare const process: any;

function cleanEnvVar(val?: string): string {
    if (!val) return ''
    return val.replace(/^['"]|['"]$/g, '').trim()
}

const accountId = cleanEnvVar(process.env.CLOUDFLARE_R2_ACCOUNT_ID)
const accessKeyId = cleanEnvVar(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID)
const secretAccessKey = cleanEnvVar(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY)
const bucketName = cleanEnvVar(process.env.CLOUDFLARE_R2_BUCKET_NAME)
const publicUrl = cleanEnvVar(process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL)

if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('Cloudflare R2 credentials are missing or empty.')
}

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    },
    requestChecksumCalculation: 'WHEN_REQUIRED'
})

export const R2_BUCKET_NAME = bucketName
export const R2_PUBLIC_URL = publicUrl

