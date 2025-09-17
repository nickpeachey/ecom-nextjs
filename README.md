# Ecom – Next.js + Prisma (MongoDB)

Minimal e-commerce starter built with Next.js App Router, TypeScript, Prisma, and MongoDB.

Features:
- Products, categories, cart scaffolding
- Seed script generates 20 categories and 1000 products
- Faceted filters on Home: category, price, brand, color, size
- Tailwind-styled filter UI (checkboxes, sliders)

## Prerequisites
- Node.js 18+ (recommended 20). If you don't have Node, on macOS you can install via Homebrew and nvm:

   ```sh
   brew install nvm
   mkdir -p ~/.nvm
   echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
   echo 'source "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
   source ~/.zshrc
   nvm install 20
   nvm use 20
   ```

- MongoDB connection string

## Setup
1. Automated (recommended)

   Run the one-shot local setup which will start Dockerized MongoDB, create/update `.env`, install dependencies, generate/push Prisma, and seed:

   ```sh
   npm run setup
   # then start the dev server
   npm run dev
   ```

   Or use the VS Code task: Run Task → "Setup+Dev".

2. Manual: copy env file and add your MongoDB URL
   
   ```sh
   cp .env.example .env
   # edit .env and set DATABASE_URL
   ```

3. Install dependencies
   
   ```sh
   npm install
   ```

4. Generate Prisma Client and push schema
   
   ```sh
   npm run prisma:generate
   npm run prisma:push
   ```

5. Seed sample data (optional)
   
   ```sh
   npm run seed
   ```

   The seed is idempotent and will upsert 1000 products with:
   - Random brand (e.g., Acme, Globex, Umbrella, ...)
   - Color options (e.g., black, white, red, blue, ...)
   - Size options (XS-XXL)

6. Run the dev server
   
   ```sh
   npm run dev
   ```

   ## Run MongoDB locally with Docker

   We provide a Docker setup for local MongoDB.

   1. Start MongoDB

      ```sh
      docker compose up -d --build
      ```

   2. Use this DATABASE_URL for local development in `.env` (replica set enabled, no auth). The host port is configurable via `MONGODB_PORT` (defaults to 27017):

      ```
      # optional override; must match docker-compose port mapping
      MONGODB_PORT=27017
      DATABASE_URL="mongodb://localhost:${MONGODB_PORT}/ecom?replicaSet=rs0"
      ```

   3. After MongoDB is up, (re)generate Prisma Client and push the schema (rs may need a few seconds to initialize):

      ```sh
      npm run prisma:generate
      npm run prisma:push
      npm run seed # optional
      ```

   ## Run without MongoDB (mock mode)

   If you want to explore the UI without a database, enable mock mode:

   1. In `.env` set:

      ```
      MOCK_DATA=1
      ```

   2. Start the dev server:

      ```sh
      npm run dev
      ```

   This will render a couple of sample products without hitting the database. Filters UI will show mock facet options. API routes for cart/products still require a DB and may return errors in mock mode.

## Scripts
- dev – start Next.js dev server
- build – build the app (generates Prisma client first)
- start – start production server
- prisma:generate – generate Prisma client
- prisma:push – push Prisma schema to database
- prisma:studio – open Prisma Studio
- seed – run seed script

## Notes
- API routes are under `app/api/*`
- Prisma schema is in `prisma/schema.prisma`
- Data helpers in `lib/`
- UI components in `components/`
