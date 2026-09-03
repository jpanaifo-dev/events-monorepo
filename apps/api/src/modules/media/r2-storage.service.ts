import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class R2StorageService {
  private readonly bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  private readonly publicBaseUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  private readonly client?: S3Client;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    if (accountId && accessKeyId && secretAccessKey && this.bucket && this.publicBaseUrl) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  private assertConfigured() {
    if (!this.client || !this.bucket || !this.publicBaseUrl) {
      throw new ServiceUnavailableException('El almacenamiento multimedia no está configurado en el servidor.');
    }
  }

  async upload(key: string, file: Express.Multer.File) {
    this.assertConfigured();
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/') && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten imágenes, videos o documentos PDF.');
    }
    await this.client!.send(new PutObjectCommand({ Bucket: this.bucket!, Key: key, Body: file.buffer, ContentType: file.mimetype }));
    return `${this.publicBaseUrl}/${key}`;
  }

  async remove(key: string) {
    this.assertConfigured();
    await this.client!.send(new DeleteObjectCommand({ Bucket: this.bucket!, Key: key }));
  }
}
