// multerConfig.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3Client = require('./config');

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
});

module.exports = upload;
