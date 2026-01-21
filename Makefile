.PHONY: help dev prod prod-full build up down restart logs clean seed migrate backup restore

# Default target
help:
	@echo "EvalEase Docker Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make prod         - Start production environment (basic)"
	@echo "  make prod-full    - Start production with Nginx"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View application logs"
	@echo "  make logs-all     - View all service logs"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make seed         - Seed database with data"
	@echo "  make migrate      - Run database migrations"
	@echo "  make backup       - Backup database"
	@echo "  make shell        - Access application shell"
	@echo "  make mysql        - Access MySQL shell"
	@echo "  make status       - Show service status"

# Development
dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Access at: http://localhost:3000"

# Production (basic)
prod:
	docker-compose up -d
	@echo "Production environment started!"
	@echo "Access at: http://localhost:3000"

# Production (with Nginx)
prod-full:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment with Nginx started!"
	@echo "Access at: http://localhost"

# Build images
build:
	docker-compose build --no-cache

# Start services
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f app

logs-all:
	docker-compose logs -f

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Database operations
seed:
	docker-compose exec app npm run seed:excel

migrate:
	docker-compose exec app npx drizzle-kit push

backup:
	@mkdir -p backups
	docker-compose exec -T mysql mysqldump -u evalease_user -p$(DATABASE_PASSWORD) evalease | gzip > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "Backup created in backups/ directory"

restore:
	@read -p "Enter backup file path: " filepath; \
	gunzip < $$filepath | docker-compose exec -T mysql mysql -u evalease_user -p evalease

# Shell access
shell:
	docker-compose exec app sh

mysql:
	docker-compose exec mysql mysql -u evalease_user -p

# Status
status:
	docker-compose ps

# Health check
health:
	@curl -s http://localhost:3000/api/health | python -m json.tool || echo "Service not available"

# Update application
update:
	git pull
	docker-compose build app
	docker-compose up -d
	docker-compose exec app npx drizzle-kit push
	@echo "Application updated!"
