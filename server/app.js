// import express from 'express';
// import './routes/S3Routes.js';
// const app = express();
// import dotenv from 'dotenv';
// import { upload } from './controllers/FilesController.js';
// const PORT = process.env.PORT || 3000;

// app.use('/s3', upload('/home/sanidhya/Downloads/Sanidhya_Soni_Resume.pdf'));

// app.listen(
//     PORT,
//     () => {
//         console.log(`Server is running on ${PORT}`)
//     }
// )

import express from 'express';
import S3Routes from './routes/S3Routes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/s3', S3Routes);

app.listen(
  PORT,
  () => {
    console.log(`Server is running on ${PORT}`);
  }
);
