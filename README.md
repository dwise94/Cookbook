# Cookbook

Shareable cookbooks with two link types: **contribute** (view + submit) and **read-only** (view only). Only the cookbook owner has an account.

## Features

- **Create a cookbook** – Username, password, and cookbook name; get contribute + read-only links with QR codes.
- **Contribute link** – Guests enter a display name and submit recipes (no account).
- **Read-only link** – Browse and search recipes only.
- **Admin** – Password-protected: rename cookbook, edit/delete recipes, copy edit links for submitters, block users by name.
- **Edit links** – Per-recipe token links; admin can copy and send them anytime.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` if needed (`DATABASE_URL="file:./dev.db"`).
3. `npx prisma generate`
4. `npx prisma db push`
5. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` – Development server
- `npm run build` / `npm start` – Production
- `npm run db:push` – Apply schema
- `npm run db:studio` – Inspect data

## Tech

Next.js 14, React 18, Tailwind, Prisma + SQLite, bcryptjs, jose, qrcode.react
