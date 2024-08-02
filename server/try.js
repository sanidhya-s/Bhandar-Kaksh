const express = require('express');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables from .env file
dotenv.config();

const app = express();
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const bucketName = process.env.S3_BUCKET_NAME;

// Middleware
app.use(bodyParser.json());

// Route to generate presigned POST data
app.post('/generate_presigned_post', (req, res) => {
  const fileName = req.body.file_name;

  if (!bucketName || !fileName) {
    return res.status(400).json({ error: 'Bucket name and file name are required' });
  }

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 3600, // Expiry time in seconds
    Conditions: [
      { acl: 'public-read' },
      ['content-length-range', 0, 10485760], // Limit file size to 10MB
    ],
  };

  s3.createPresignedPost(params, (err, data) => {
    if (err) {
      console.error('Error generating presigned post:', err);
      return res.status(500).json({ error: 'Failed to generate presigned POST' });
    }

    res.json(data);
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
