# PostgreSQL Backup to S3

Simple script that backs up your PostgreSQL database to S3 daily.

## Setup

1. **Install stuff:**
```bash
npm init -y
npm install @aws-sdk/client-s3 node-cron dotenv
sudo apt-get install postgresql-client
```

2. **Create `.env` file:**
```
DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=your_password
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
```

3. **Test it:**
```bash
MANUAL_BACKUP=true node index.js
```

4. **Run daily:**
```bash
pm2 start index.js --name backup
pm2 save
```

## That's it!

- Runs daily at 2 AM
- Saves backups to S3 like: `database-backups/2025/09/backup_mydb_2025-09-05.sql`
- Check logs: `pm2 logs backup`

## Common Issues

**"pg_dump failed"** = Wrong database name or password
**"AWS error"** = Wrong S3 bucket or AWS keys
**"Command not found"** = Install postgresql-client