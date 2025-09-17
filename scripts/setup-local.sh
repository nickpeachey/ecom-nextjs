#!/usr/bin/env bash
set -euo pipefail

echo "==> Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

MONGODB_PORT_VALUE=${MONGODB_PORT:-27017}
echo "==> Starting MongoDB via docker compose (host port ${MONGODB_PORT_VALUE})"
MONGODB_PORT=${MONGODB_PORT_VALUE} docker compose up -d --build

echo "==> Waiting for MongoDB to be ready and initializing replica set if needed"
set +e
for i in {1..20}; do
  docker exec ecom-mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    break
  fi
  sleep 1
done

# Check rs status; if not initiated, initiate rs0
docker exec ecom-mongodb mongosh --quiet --eval "rs.status().ok" >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Initializing replica set rs0"
  # Use the container's internal port (27017). Host port mapping does not apply inside the container.
  docker exec ecom-mongodb mongosh --quiet --eval "rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]})" >/dev/null 2>&1
  # Wait a moment for primary election
  sleep 3
fi
set -e

echo "==> Ensuring .env exists"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if ! grep -q '^DATABASE_URL=' .env; then
  echo "DATABASE_URL=\"mongodb://localhost:${MONGODB_PORT_VALUE}/ecom?replicaSet=rs0\"" >> .env
  echo "Added local DATABASE_URL to .env"
fi

echo "==> Checking Node & npm"
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH. Please install Node.js (v20 recommended) and re-run." >&2
  exit 1
fi

echo "==> Installing dependencies"
npm install

echo "==> Generating Prisma Client"
npm run prisma:generate

echo "==> Pushing Prisma schema to DB"
npm run prisma:push

echo "==> Seeding sample data"
npm run seed || true

echo "==> Setup complete. Start the dev server with: npm run dev"
