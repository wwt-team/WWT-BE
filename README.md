# WWT-BE

NestJS backend for the WWT trading service.

## Stack

- NestJS
- TypeORM
- PostgreSQL (Supabase session pooler)
- JWT authentication
- Socket.IO chat
- PM2 + Nginx on EC2
- GitHub Actions CI/CD

## Local setup

```bash
pnpm install
pnpm build
pnpm test -- --runInBand
pnpm test:e2e --runInBand
```

Create `.env` from `.env.example` and fill the real secrets before running the app.

## Run

```bash
pnpm start:dev
```

Production entry:

```bash
pnpm build
node dist/main
```

## Test structure

- `pnpm test`
  - controller/service/common/spec tests
- `pnpm test:e2e`
  - HTTP-level end-to-end tests for:
    - auth
    - users
    - products
    - trade-requests
    - chats

## CI/CD

### CI

Workflow:

- `quality`
- `app-test`
- `common-test`
- `auth-test`
- `users-test`
- `products-test`
- `trade-requests-test`
- `chat-test`
- `e2e-test`

File:

- [.github/workflows/ci.yml](.github/workflows/ci.yml)

### CD

CI success on `main` triggers CD on the EC2 self-hosted runner.

Deploy sequence:

1. `git pull --ff-only origin main`
2. `pnpm install --frozen-lockfile`
3. `pnpm build`
4. `pm2 restart wwt-be`
5. `pm2 save`

Files:

- [.github/workflows/cd.yml](.github/workflows/cd.yml)
- [scripts/deploy.sh](scripts/deploy.sh)

## Rollback

Automatic rollback is built into the deploy script. If deploy fails after pull, the server resets to the pre-deploy commit and restarts PM2 again.

Manual rollback workflow:

- [.github/workflows/rollback.yml](.github/workflows/rollback.yml)

Manual rollback script:

- [scripts/rollback.sh](scripts/rollback.sh)

The rollback workflow can:

- use the previous successful deploy commit automatically
- or rollback to a specific commit SHA

## Ops docs

- [.agent/CD_설정.md](.agent/CD_설정.md)
- [.agent/Deploy_QA_체크리스트.md](.agent/Deploy_QA_체크리스트.md)
- [.agent/E2E_시나리오.md](.agent/E2E_시나리오.md)
- [.agent/TC_분류표.md](.agent/TC_분류표.md)
- [.agent/사용자관점_TC.md](.agent/사용자관점_TC.md)
