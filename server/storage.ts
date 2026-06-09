import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getS3Client() {
  if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.s3BucketName) {
    throw new Error(
      "Storage config missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME",
    );
  }
  return new S3Client({
    region: ENV.awsRegion || "auto",
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
    ...(ENV.awsEndpointUrl ? { endpoint: ENV.awsEndpointUrl } : {}),
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const s3 = getS3Client();
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as Uint8Array);

  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.s3BucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const s3 = getS3Client();
  const key = normalizeKey(relKey);
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: ENV.s3BucketName, Key: key }), {
    expiresIn: 3600,
  });
}
