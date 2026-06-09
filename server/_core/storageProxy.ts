import type { Express } from "express";
import { ENV } from "./env";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  return new S3Client({
    region: ENV.awsRegion || "auto",
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
    ...(ENV.awsEndpointUrl ? { endpoint: ENV.awsEndpointUrl } : {}),
  });
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.s3BucketName) {
      res.status(500).send("Storage not configured");
      return;
    }

    try {
      const s3 = getS3Client();
      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: ENV.s3BucketName, Key: key }),
        { expiresIn: 3600 },
      );
      res.set("Cache-Control", "no-store");
      res.redirect(307, signedUrl);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage error");
    }
  });
}
