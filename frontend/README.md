# rmeme frontend

The rmeme website: a random-meme viewer with voting, permalinks, and API docs. Built with [TanStack Start](https://tanstack.com/start), [shadcn/ui](https://ui.shadcn.com) and Tailwind CSS.

## Setup

```bash
cp .env.example .env
npm install
npm run dev   # http://localhost:3000
```

| Variable | Description | Default |
| --- | --- | --- |
| `RMEME_API_URL` | Base URL the server uses to call the backend | `https://api.rmeme.me` |
| `RMEME_PUBLIC_API_URL` | Base URL shown to visitors | `RMEME_API_URL` |
| `RMEME_API_KEY` | Key used for voting and `/m/:id` pages | |

All API calls go through TanStack Start server functions (`src/lib/api.ts`), so `RMEME_API_KEY` stays on the server and never reaches the browser.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Shows a random meme. Upvote, downvote, or skip to the next one (also with the ↑ ↓ → keys). The next meme is fetched in the background. |
| `/m/:id` | Permalink to a single meme |
| `/api` | API documentation |

## Production

```bash
npm run build
npm start      # serves .output/server/index.mjs
```

Or build the Docker image in this folder.

## Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Components live in `src/components/ui`.
