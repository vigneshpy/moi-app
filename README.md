# moi-app

Monorepo for the Moi app — mobile client and API.

## Structure

```
moi-app/
├── apps/
│   ├── api/      Express + TypeScript + MongoDB backend
│   └── mobile/   Expo React Native app (iOS, Android, web)
└── packages/     (shared code — reserved for future use)
```

## Prerequisites

- Node.js
- pnpm 10+

## Setup

```bash
pnpm install
```

## Development

```bash
# API
pnpm dev:api

# Mobile
pnpm dev:mobile
```

Or run directly inside a workspace:

```bash
pnpm --filter moi-app-api dev
pnpm --filter moi-app start
```

## History

This repo was created by merging two previous repos, both of which are now archived:
- `vigneshpy/moi-app-api` → `apps/api/`
- `vigneshpy/moi-app` → `apps/mobile/` (this repo, restructured)

Git history from both is preserved via `git subtree`.
