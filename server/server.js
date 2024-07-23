require('dotenv').config();
const express = require('express');
const upload = require('./multerConfig');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ fileUrl: req.file.location });
});

app.get('/files/:key', (req, res) => {
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.params.key
  };

  s3.getObject(s3Params, (err, data) => {
    if (err) return res.status(500).json(err);
    res.attachment(req.params.key);
    res.send(data.Body);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
