# EvalEase Docker Setup

Quick reference guide for Docker deployment.

## Quick Start

### 1. Setup Environment
```bash
cp .env.docker .env
# Edit .env with your values
nano .env
```

### 2. Deploy
```bash
# Using the quick deploy script (recommended)
chmod +x deploy.sh
./deploy.sh

# OR manually with docker-compose
docker-compose up -d
```

### 3. Run Migrations
```bash
docker-compose exec app npx drizzle-kit push
```

### 4. Access Application
- **Local:** http://localhost:3000
- **Production:** http://your-server-ip:3000

## Docker Compose Files

| File | Purpose | Use Case |
|------|---------|----------|
| `docker-compose.yml` | Basic production setup | Simple deployments |
| `docker-compose.prod.yml` | Production with Nginx & monitoring | Full production deployments |
| `docker-compose.dev.yml` | Development with hot reload | Local development |

## Common Commands

### Service Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart app

# View logs
docker-compose logs -f app

# Check status
docker-compose ps
```

### Database Operations
```bash
# Access MySQL
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
# Seed data
docker-compose exec app npm run seed:excel

# Access app shell
docker-compose exec app sh

# View logs
docker-compose logs -f app

# Rebuild and restart
docker-compose up -d --build
```

## Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### AWS EC2
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone <repository-url>
cd EvalEase
chmod +x deploy.sh
./deploy.sh
```

### With Nginx (Recommended)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

Required variables in `.env`:

```env
DATABASE_HOST=mysql
DATABASE_USER=evalease_user
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=evalease
DATABASE_ROOT_PASSWORD=your-root-password

NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://your-domain.com
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

## Troubleshooting

### Database connection fails
```bash
docker-compose logs mysql
docker-compose restart mysql
```

### Application won't start
```bash
docker-compose logs app
docker-compose down && docker-compose up -d --build
```

### Port already in use
Change `APP_PORT` in `.env` file.

## Monitoring

View real-time stats:
```bash
docker stats
```

Check health:
```bash
curl http://localhost:3000/api/health
```

## Backup & Recovery

### Automated Backup
Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mysql mysqldump -u evalease_user -p$DATABASE_PASSWORD evalease | gzip > backup_$DATE.sql.gz
```

### Restore
```bash
gunzip < backup_XXXXXXXX.sql.gz | docker-compose exec -T mysql mysql -u evalease_user -p evalease
```

## Security Notes

1. Change all default passwords
2. Use strong NEXTAUTH_SECRET
3. Enable firewall on production servers
4. Use HTTPS in production (setup SSL)
5. Regular database backups

## Support

For detailed documentation, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [README.md](README.md) - Application documentation

For issues:
```bash
# Check logs
docker-compose logs -f

# Check health
curl http://localhost:3000/api/health

# Verify environment
docker-compose config
```
