// import s3Client from "../config/s3Config.js";
// import https from "https";
// import { fileURLToPath } from "url";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { PutObjectCommand } from "@aws-sdk/client-s3";

// const client = s3Client;

// const createPresignedUrlWithClient = ({ region, bucket, key }) => {
//   const command = new PutObjectCommand({ Bucket: bucket, Key: key });
//   return getSignedUrl(client, command, { expiresIn: 3600 });
// };

// import fs from 'fs';

// function put(url, filePath) {
//   return new Promise((resolve, reject) => {
//     const fileStream = fs.createReadStream(filePath);
//     const stat = fs.statSync(filePath);

//     const req = https.request(
//       url,
//       { method: "PUT", headers: { "Content-Length": stat.size } },
//       (res) => {
//         let responseBody = "";
//         res.on("data", (chunk) => {
//           responseBody += chunk;
//         });
//         res.on("end", () => {
//           resolve(responseBody);
//         });
//       },
//     );
//     req.on("error", (err) => {
//       reject(err);
//     });

//     fileStream.pipe(req);
//   });
// }

// // export const upload = async (filePath) => {
// //   try {
// //     // const filePath = './preSignedUrl.js';
// //     const clientUrl = await createPresignedUrlWithClient({
// //       region: process.env.AWS_REGION,
// //       bucket: process.env.S3_BUCKET_NAME,
// //       key: "Hehe",
// //     });
// //     console.log("Calling PUT using presigned URL with client");
// //     await put(clientUrl, filePath);

// //     console.log("\nDone. Check your S3 console.");
// //   } catch (err) {
// //     console.error(err);
// //   }
// // };

// export const upload = async (req, res) => {
//   try {
//     const { file } = req; // Access uploaded file from req object
//     const filePath = file.path; // Get the temporary file path

//     const clientUrl = await createPresignedUrlWithClient({
//       region: process.env.AWS_REGION,
//       bucket: process.env.S3_BUCKET_NAME,
//       key: file.originalname, // Use original name for clarity
//     });
//     console.log("Calling PUT using presigned URL with client");
//     await put(clientUrl, filePath);

//     console.log("\nDone. Check your S3 console.");
//     res.send({ message: 'File uploaded successfully!' }); // Send success response
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ message: 'Error uploading file' }); // Send error response
//   } finally {
//     // Clean up temporary file (optional)
//     try {
//       fs.unlinkSync(filePath);
//     } catch (err) {
//       console.error('Error deleting temporary file:', err);
//     }
//   }
// };

// // upload(filePath);










import s3Client from "../config/s3Config.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";

const client = s3Client;

const createPresignedUrlWithClient = async ({ region, bucket, key }) => {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

const put = (url, fileBuffer) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method: "PUT", headers: { "Content-Length": fileBuffer.length } },
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

    req.write(fileBuffer);
    req.end();
  });
}

export const upload = async (req, res) => {
  try {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      const fileBuffer = Buffer.concat(chunks);
      const filename = req.headers['x-filename']; // Get filename from header

      const clientUrl = await createPresignedUrlWithClient({
        region: process.env.AWS_REGION,
        bucket: process.env.S3_BUCKET_NAME,
        key: filename,
      });
      console.log("Calling PUT using presigned URL with client");
      await put(clientUrl, fileBuffer);

      console.log("\nDone. Check your S3 console.");
      res.send({ message: 'File uploaded successfully!' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error uploading file' });
  }
};
