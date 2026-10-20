# Focus Ecommerce

Focus Ecommerce is a full-stack e-commerce project composed of a Next.js frontend and a NestJS backend. It includes user authentication, role-based access control, product catalog management, and inventory tracking with PostgreSQL as the persistence layer.

The project is organized as a monorepo, with separate application folders for the client and API, plus Docker and CI/CD configuration for deployment automation.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: TypeORM
- Authentication: JWT via Passport and Nest JWT
- Customer social sign-in: Google OAuth 2.0
- Testing: Jest (API), Vitest (frontend)
- Containerization: Docker and Docker Compose
- CI/CD: GitHub Actions
- Registry: GitHub Container Registry (GHCR)

## Project Structure

```text
focus-ecommerce/
├── api/                     # NestJS backend
│   ├── src/                 # Application source code
│   ├── package.json         # API scripts and dependencies
│   ├── Dockerfile           # API container image
│   └── README.md            # Backend-specific documentation
├── web/                     # Next.js frontend
│   ├── app/                 # App Router pages and layout
│   ├── package.json         # Web scripts and dependencies
│   ├── Dockerfile           # Frontend container image
│   └── README.md            # Frontend-specific documentation
├── .github/workflows/       # CI/CD pipeline definitions
├── docker-compose.yml       # Local multi-container environment
├── .env.example             # Example environment file
├── .gitignore               # Git ignore rules
└── README.md                # Project overview
```

## Core Features

- User registration and login
- JWT authentication
- Role-based authorization (`admin` and `customer`; legacy web role storage remains `user`)
- Product CRUD operations
- Product stock management
- Stock movement records for entries, adjustments, and withdrawals
- Product and user modules organized in a modular backend architecture
- Dockerized local environment for faster onboarding
- Automated pipelines for validation and image publishing

## How It Works

### Frontend
The frontend is built with Next.js and serves the customer/admin experience, including navigation, login, registration, and product management screens.

### Backend
The backend is built with NestJS and exposes REST endpoints for authentication and product operations. It uses TypeORM to integrate with PostgreSQL and applies validation and access guards to sensitive routes.

### Authentication and Authorization
The API issues JWT tokens after login. Protected routes use a guard to validate the token and a role guard to restrict access based on user privileges.

### Inventory Flow
Products have a stock value and stock movement history. Stock mutations are recorded in a dedicated table so changes can be traced and audited.

### Admin Seed
On startup, the API checks for `ADMIN_EMAIL` and `ADMIN_PASSWORD` and automatically creates the default admin user if they are defined.

## Branch Strategy

This project currently follows a simple branch flow:

- `main`: stable branch, usually used for production-ready or release code
- `dev`: active development branch used for integration and ongoing work

The GitHub Actions workflow is configured to trigger on pushes to the `dev` branch.

## CI/CD and Automation

The workflow file is located at:

```text
.github/workflows/deploy.dev.yml
```

### Pipeline behavior

When a push occurs on `dev`, the pipeline runs the following stages:

1. `test-api`
   - Checks out the repository
   - Sets up Node.js
   - Installs API dependencies with `npm ci`
   - Runs API tests with `npm test -- --runInBand`

2. `test-web`
   - Checks out the repository
   - Sets up Node.js
   - Installs frontend dependencies with `npm ci`
   - Runs frontend tests with `npm test`

3. `build-and-push`
   - Runs only after both test jobs pass
   - Builds a Docker image for each app (`api` and `web`)
   - Logs into GitHub Container Registry using a GitHub token
   - Pushes the corresponding images to GHCR

### GHCR image naming

The workflow publishes images with the following pattern:

- `ghcr.io/gabs-bertolini/focus-api:dev`
- `ghcr.io/gabs-bertolini/focus-web:dev`

These images are then used by the Docker Compose deployment stack.

## Container and Deployment Setup

The root `docker-compose.yml` defines the local deployment environment:

- `web`: frontend container
- `api`: backend container
- `postgres`: PostgreSQL database

### Ports

- Frontend: `http://localhost:46464`
- API: `http://localhost:45454`
- PostgreSQL: internal service only, exposed through the container network

### Environment variables

Create a `.env` file from `.env.example` and fill in the required values:

```env
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=ecommerce
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=3600
FRONTEND_URL=http://localhost:46464
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_CALLBACK_URL=http://localhost:46464/api/auth/google/callback
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
```

Register the exact `GOOGLE_CALLBACK_URL` value as an authorized redirect URI
for the Google OAuth 2.0 Web application. For a standalone local Next.js server
on port `3000`, use `FRONTEND_URL=http://localhost:3000` and
`GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback`. The Google
client secret is read only by the API and must not use a `NEXT_PUBLIC_` prefix.

Google sign-in is customer-only. It requires a verified Google email, links an
existing customer by email, and rejects existing admin accounts. The API places
its JWT in an HttpOnly, SameSite=Lax cookie (Secure in production). Password
login continues to return `access_token` in the response and remains compatible
with existing Bearer/localStorage clients.

### Database migrations

The API currently synchronizes the schema automatically outside production;
production has synchronization disabled. Migration commands run from `api/`:

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate -- src/database/migrations/DescribeChange
```

The initial baseline migration creates current tables only when missing, so it
can establish migration history on databases previously managed by
`synchronize`. The following Google-account migration adds `googleId` and makes
password hashes nullable. The baseline rollback intentionally does not drop
existing tables. Reverting the Google-account migration refuses to make
passwords non-null while Google-only accounts remain.

For deployment, take a database backup and run `npm run migration:run` once as a
release step against the production database before starting/replacing API
instances. For the current Compose deployment, this can be an operator-run
one-off command such as `docker compose run --rm api npm run migration:run`.
Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`
directly in the API runtime environment as part of deployment: the current
Compose file does not forward these new variables from the root `.env`. CI/CD
and Compose are intentionally unchanged.

## Running the Project Locally

### Option 1: Using Docker Compose

From the project root:

```bash
cp .env.example .env

docker compose up --build
```

This will start the frontend, backend, and PostgreSQL services together.

### Option 2: Running API and Web separately

#### API

```bash
cd api
npm install
npm run start:dev
```

The API runs on port `3001` by default.

#### Web

```bash
cd web
npm install
npm run dev
```

The frontend runs on port `3000` in development mode.

## Tests

### API tests

```bash
cd api
npm test -- --runInBand
```

### Frontend tests

```bash
cd web
npm test
```

The CI pipeline runs these validations automatically before building and pushing images.

## Production Notes

- The API reads environment variables through `@nestjs/config`
- The frontend uses the configured `API_URL` in Docker Compose
- `FRONTEND_URL` is used for CORS configuration in the backend
- Sensitive configuration should never be committed directly to the repository

## Useful Commands

### API

```bash
cd api
npm install
npm run build
npm run start
npm run start:dev
npm test
```

### Web

```bash
cd web
npm install
npm run build
npm run dev
npm run test
npm run lint
```

## Summary

Focus Ecommerce combines modern frontend and backend technologies with a containerized deployment workflow and automated CI/CD. It is a practical project for demonstrating skills in full-stack development, authentication, ecommerce flows, Docker usage, GitHub Actions automation, and DevOps-oriented deployment practices.
