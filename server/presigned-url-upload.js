import { fileURLToPath } from "url";
import { promisify } from "util";
import { readFile as readFileCallback } from "fs";
import https from "https";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
dotenv.config();

const readFile = promisify(readFileCallback);

const createPresignedUrlWithClient = ({ region, bucket, key }) => {
  const client = new S3Client({ region });
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

function put(url, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method: "PUT", headers: { "Content-Length": data.length } },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve(responseBody);
        });
      },
    );
    req.on("error", (err) => {
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

/* async function uploadData(FILE_PATH) {

  try {
    const clientUrl = await createPresignedUrlWithClient({
      region: process.env.S3_BUCKET_NAME,
      bucket: BUCKET,
      key: KEY,
    });

    // Read the file
    const fileData = await readFile(FILE_PATH);

    console.log("Calling PUT using presigned URL with client");
    await put(clientUrl, fileData);

    console.log("\nDone. Check your S3 console.");
  } catch (err) {
    console.error(err);
  }

} */

export const main = async () => {
  const REGION = "ap-south-1";
  const BUCKET = "sani-store";
  const KEY = "server.js";
  const FILE_PATH = "./server.js";

  try {

    const clientUrl = await createPresignedUrlWithClient({
      region: REGION,
      bucket: BUCKET,
      key: KEY,
    });

    // Read the file
    const fileData = await readFile(FILE_PATH);

    console.log("Calling PUT using presigned URL with client");
    await put(clientUrl, fileData);

    console.log("\nDone. Check your S3 console.");
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
