# EvalEase Docker Deployment Guide

This guide covers deploying EvalEase using Docker on AWS EC2, VPS, or any Linux server.

## Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- At least 2GB RAM
- 10GB free disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EvalEase
```

### 2. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.docker .env
```

Edit `.env` and update the following **critical** values:

```env
# IMPORTANT: Change these in production
NEXTAUTH_SECRET=generate-a-strong-random-secret-here
DATABASE_PASSWORD=strong-database-password
DATABASE_ROOT_PASSWORD=strong-root-password
NEXTAUTH_URL=https://your-domain.com
```

**Generate a secure NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Run Database Migrations

```bash
# Wait for database to be ready (30-60 seconds)
sleep 60

# Run migrations
docker-compose exec app npx drizzle-kit push
```

### 5. Seed Initial Data (Optional)

```bash
# Seed from Excel files
docker-compose exec app npm run seed:excel

# Or use custom seed script
docker-compose exec app npm run seed
```

### 6. Access the Application

Open your browser and navigate to:
- **Local:** http://localhost:3000
- **Production:** http://your-server-ip:3000

## AWS EC2 Deployment

### Step 1: Launch EC2 Instance

1. Choose **Ubuntu 22.04 LTS** or **Amazon Linux 2023**
2. Instance type: **t3.medium** (2 vCPU, 4GB RAM) minimum
3. Configure security group:
   - SSH (22) - Your IP only
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (3000) - 0.0.0.0/0 (temporary, use nginx later)

### Step 2: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: Install Docker

**For Ubuntu:**

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

**For Amazon Linux 2023:**

```bash
# Update packages
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Clone and Deploy

```bash
# Clone repository
git clone <repository-url>
cd EvalEase

# Configure environment
cp .env.docker .env
nano .env  # Edit with your values

# Generate secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env

# Set your domain
echo "NEXTAUTH_URL=http://$(curl -s ifconfig.me):3000" >> .env

# Deploy
docker-compose up -d

# Wait and run migrations
sleep 60
docker-compose exec app npx drizzle-kit push
```

### Step 5: Setup Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo apt install nginx -y  # Ubuntu
# OR
sudo yum install nginx -y  # Amazon Linux

# Create Nginx config
sudo nano /etc/nginx/sites-available/evalease
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
# Ubuntu
sudo ln -s /etc/nginx/sites-available/evalease /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Amazon Linux
sudo mv /etc/nginx/sites-available/evalease /etc/nginx/conf.d/evalease.conf
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Docker Commands Reference

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f mysql

# Check service health
docker-compose ps
```

### Database Operations

```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u evalease_user -p

# Backup database
docker-compose exec mysql mysqldump -u evalease_user -p evalease > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u evalease_user -p evalease < backup.sql

# Run migrations
docker-compose exec app npx drizzle-kit push
```

### Application Operations

```bash
# Run seed scripts
docker-compose exec app npm run seed:excel

# Access app shell
docker-compose exec app sh

# View app logs
docker-compose logs -f app

# Restart app only
docker-compose restart app
```

### Maintenance

```bash
# Update application
git pull
docker-compose build app
docker-compose up -d

# Clean up unused images
docker system prune -a

# View disk usage
docker system df
```

## Monitoring and Troubleshooting

### Check Service Status

```bash
# All services
docker-compose ps

# Detailed info
docker inspect evalease-app
docker inspect evalease-mysql
```

### View Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df
```

### Common Issues

**1. Database connection fails:**

```bash
# Check if MySQL is healthy
docker-compose ps
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Wait 30 seconds and try again
```

**2. Application won't start:**

```bash
# Check logs
docker-compose logs app

# Rebuild and restart
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
```

**3. Port already in use:**

```bash
# Change port in .env
APP_PORT=3001

# Restart
docker-compose up -d
```

## Security Best Practices

1. **Change all default passwords** in `.env`
2. **Use strong NEXTAUTH_SECRET** (32+ characters)
3. **Limit EC2 security group** to specific IPs when possible
4. **Enable SSL/HTTPS** with Let's Encrypt
5. **Regular backups** of database
6. **Keep Docker images updated:**

```bash
docker-compose pull
docker-compose up -d
```

## Backup and Recovery

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T mysql mysqldump -u evalease_user -p$DATABASE_PASSWORD evalease | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup data directory
tar -czf $BACKUP_DIR/data_backup_$DATE.tar.gz ./data

# Keep only last 7 backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:

```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Performance Tuning

### For Production:

Edit `docker-compose.yml` and add resource limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
  
  mysql:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Support

For issues or questions:
- Check application logs: `docker-compose logs -f`
- Check system resources: `docker stats`
- Verify environment variables: `docker-compose config`

## License

See LICENSE file in the repository.
