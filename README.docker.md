# Docker Setup Guide

This project uses Docker Compose to run the entire application stack with three isolated containers:
- **Frontend** (React + Vite)
- **Backend** (Bun + Hono)
- **Database** (PostgreSQL)

## Architecture

All services run in isolated containers and communicate through a Docker network called `claud-network`:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │    Backend      │      │   PostgreSQL    │
│   (port 5173)   │────▶│   (port 3000)   │─────▶│   (port 5432)   │
│   React + Vite  │      │   Bun + Hono    │      │   Database      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2

## Quick Start

1. **Start all containers:**
   ```bash
   docker compose up -d
   ```

2. **Check container status:**
   ```bash
   docker compose ps
   ```

3. **View logs:**
   ```bash
   # All containers
   docker compose logs -f
   
   # Specific container
   docker compose logs -f frontend
   docker compose logs -f backend
   docker compose logs -f postgres
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Backend Health: http://localhost:3000/api/health
   - PostgreSQL: localhost:5432

5. **Stop all containers:**
   ```bash
   docker compose down
   ```

6. **Stop and remove volumes (clean slate):**
   ```bash
   docker compose down -v
   ```

## Hot Reloading / Development

Both frontend and backend support hot reloading:

- **Frontend**: Changes to files in `./frontend/` are automatically detected by Vite
- **Backend**: Changes to files in `./backend/` trigger automatic restart with `bun --hot`

The source code is mounted as volumes, so you can edit files on your host machine and see changes reflected immediately in the containers.

## Environment Variables

### Backend
- `PORT`: Server port (default: 3000)
- `DB_HOST`: PostgreSQL host (default: postgres)
- `DB_NAME`: Database name (default: claud)
- `DB_USER`: Database user (default: claud)
- `DB_PASSWORD`: Database password (default: claud_password)
- `DB_PORT`: Database port (default: 5432)

### Frontend
- `VITE_API_URL`: Backend API URL (default: http://backend:3000)

### PostgreSQL
- `POSTGRES_USER`: Database user (default: claud)
- `POSTGRES_PASSWORD`: Database password (default: claud_password)
- `POSTGRES_DB`: Database name (default: claud)

## Container Details

### Frontend Container (`claud-frontend`)
- **Base Image**: oven/bun:1
- **Working Directory**: /claud
- **Exposed Port**: 5173
- **Volume Mounts**:
  - `./frontend/:/claud` - Source code
  - `/claud/node_modules` - Anonymous volume for node_modules
- **Command**: `bun install && bun run dev --host`

### Backend Container (`claud-backend`)
- **Base Image**: oven/bun:1
- **Working Directory**: /claud
- **Exposed Port**: 3000
- **Volume Mounts**:
  - `./backend/:/claud` - Source code
  - `/claud/node_modules` - Anonymous volume for node_modules
- **Command**: `bun install && bun run dev`
- **Depends On**: postgres

### PostgreSQL Container (`claud-postgres`)
- **Base Image**: postgres:16-alpine
- **Exposed Port**: 5432
- **Volume Mounts**:
  - `postgres_data:/var/lib/postgresql/data` - Persistent database storage
- **Health Check**: `pg_isready -U claud` every 10s

## Networking

All containers are connected to the `claud-network` bridge network. This allows:
- Frontend to access backend via `http://backend:3000`
- Backend to access database via `postgres:5432`
- Inter-container communication using service names as hostnames

## Volumes

### Named Volumes
- `postgres_data`: Persists PostgreSQL data across container restarts

### Bind Mounts
- `./frontend/:/claud`: Frontend source code
- `./backend/:/claud`: Backend source code

### Anonymous Volumes
- `/claud/node_modules`: Prevents overwriting container's node_modules with host's

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs <service-name>

# Rebuild containers
docker compose up -d --build
```

### Port already in use
```bash
# Check what's using the port
sudo lsof -i :5173  # or :3000 or :5432

# Stop the conflicting process or change port in docker-compose.yaml
```

### Database connection issues
```bash
# Check if postgres is healthy
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Test connection from backend
docker exec claud-backend sh -c "bun -e \"const res = await fetch('http://backend:3000/api/health'); console.log(await res.text());\""
```

### Hot reload not working
- Ensure volumes are mounted correctly: `docker compose config`
- Check file permissions on host
- Try rebuilding: `docker compose up -d --build`

### Reset everything
```bash
# Stop containers, remove volumes, and start fresh
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Development Workflow

1. **Make code changes** on your host machine in `frontend/` or `backend/`
2. **Changes are detected** automatically by the containers
3. **Application reloads** without manual intervention
4. **View logs** if needed: `docker compose logs -f`
5. **Commit changes** using git as usual

## Production Considerations

For production deployment, consider:
- Using production builds (not dev servers)
- Setting secure passwords via environment variables
- Using Docker secrets for sensitive data
- Implementing proper health checks
- Setting up reverse proxy (nginx/traefik)
- Using production-grade PostgreSQL configuration
- Implementing backup strategies for database
