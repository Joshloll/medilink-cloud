# AWS Deployment Configuration for MediLink Cloud

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- Node.js 18+ installed
- PostgreSQL database (AWS RDS recommended)

## AWS Services Used
1. **EC2** - Application hosting
2. **RDS** - PostgreSQL database
3. **S3** - File storage for health records
4. **Elastic Load Balancer** - Load balancing
5. **CloudWatch** - Monitoring and logging
6. **Route 53** - DNS management (optional)

## Deployment Steps

### 1. Create RDS PostgreSQL Instance

```bash
# Create database instance
aws rds create-db-instance \
  --db-instance-identifier medilink-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --publicly-accessible

# Get database endpoint
aws rds describe-db-instances --db-instance-identifier medilink-db
```

### 2. Create S3 Bucket

```bash
# Create S3 bucket
aws s3 mb s3://medilink-cloud-storage --region us-east-1

# Set bucket policy for private access
aws s3api put-bucket-versioning \
  --bucket medilink-cloud-storage \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket medilink-cloud-storage \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3. Launch EC2 Instance

```bash
# Create security group
aws ec2 create-security-group \
  --group-name medilink-sg \
  --description "MediLink Cloud security group"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-name medilink-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name medilink-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name medilink-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-groups medilink-sg \
  --count 1
```

### 4. Configure EC2 Instance

SSH into your instance:

```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

Install dependencies:

```bash
# Update system
sudo yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo amazon-linux-extras install nginx1 -y
```

### 5. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/medilink-cloud.git
cd medilink-cloud

# Install backend dependencies
cd backend
npm install --production

# Create .env file
cat > .env << EOL
PORT=5000
NODE_ENV=production

DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=medilink_cloud
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=medilink-cloud-storage

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EOL

# Run database migrations
npm run migrate

# Start application with PM2
pm2 start server.js --name medilink-api
pm2 save
pm2 startup
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/conf.d/medilink.conf
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/ec2-user/medilink-cloud/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Start Nginx:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7. SSL Certificate (Optional but Recommended)

Install Certbot:

```bash
sudo yum install -y certbot python3-certbot-nginx
```

Get SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

### 8. CloudWatch Monitoring

Create CloudWatch log group:

```bash
aws logs create-log-group --log-group-name /medilink/application
```

Install CloudWatch agent:

```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

### 9. Backup Configuration

Create automated backup script:

```bash
cat > /home/ec2-user/backup.sh << 'EOL'
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H-%M)
BACKUP_DIR="/home/ec2-user/backups"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h your-rds-endpoint.rds.amazonaws.com \
  -U postgres \
  -d medilink_cloud \
  > $BACKUP_DIR/db-backup-$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/db-backup-$DATE.sql \
  s3://medilink-cloud-storage/backups/

# Remove old local backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOL

chmod +x /home/ec2-user/backup.sh
```

Add to crontab:

```bash
crontab -e
# Add: 0 2 * * * /home/ec2-user/backup.sh
```

## Environment Variables

Update frontend configuration:

```javascript
// frontend/js/config.js
const API_CONFIG = {
    BASE_URL: 'https://your-domain.com/api',
    // ... rest of config
};
```

## Security Checklist

- [ ] Database credentials stored in environment variables
- [ ] JWT secrets are randomly generated
- [ ] S3 bucket has encryption enabled
- [ ] EC2 security group allows only necessary ports
- [ ] SSL certificate installed
- [ ] Database backups automated
- [ ] CloudWatch monitoring enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured

## Scaling Considerations

1. **Horizontal Scaling**: Add more EC2 instances behind a load balancer
2. **Database**: Use RDS read replicas for read-heavy operations
3. **Caching**: Implement Redis for session management
4. **CDN**: Use CloudFront for static assets

## Monitoring

- CloudWatch Dashboards for metrics
- CloudWatch Alarms for critical issues
- PM2 monitoring for application health
- RDS monitoring for database performance

## Cost Optimization

- Use t3.micro instances (free tier eligible)
- Enable S3 lifecycle policies
- Use RDS reserved instances for production
- Enable CloudWatch log retention policies
