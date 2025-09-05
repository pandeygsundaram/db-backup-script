const { spawn } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();

// Config
const DB_NAME = process.env.DB_NAME || 'your_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const S3_BUCKET = process.env.S3_BUCKET || 'your-bucket';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createBackup() {
  console.log('🚀 Starting backup...');
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `backup_${DB_NAME}_${timestamp}.sql`;
  
  // Create pg_dump
  const dump = spawn('pg_dump', ['-U', DB_USER, '-d', DB_NAME], {
    env: { ...process.env, PGPASSWORD: DB_PASSWORD }
  });
  
  const writeStream = fs.createWriteStream(filename);
  dump.stdout.pipe(writeStream);
  
  return new Promise((resolve, reject) => {
    dump.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dump created:', filename);
        resolve(filename);
      } else {
        reject(new Error(`pg_dump failed with code ${code}`));
      }
    });
  });
}

async function uploadToS3(filename) {
  console.log('📤 Uploading to S3...');
  
  const fileContent = fs.readFileSync(filename);
  const key = `backups/${filename}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileContent
  }));
  
  console.log('✅ Uploaded to S3:', key);
  
  // Clean up local file
  fs.unlinkSync(filename);
  console.log('🗑️ Local file deleted');
}

async function runBackup() {
  try {
    const filename = await createBackup();
    await uploadToS3(filename);
    console.log('🎉 Backup complete!');
  } catch (error) {
    console.log(error)
    console.error('❌ Backup failed:', error.message);
  }
}

// Run daily at 2 AM
cron.schedule('0 2 * * *', runBackup);

console.log('🕐 Backup service started - runs daily at 2 AM');

// Run immediately if MANUAL_BACKUP is set
if (process.env.MANUAL_BACKUP) {
  runBackup();
}