# rmeme backend

API for getting a random meme. Built with [Hono](https://hono.dev) on Node, using Drizzle ORM with SQLite (libsql).

## Setup

```bash
npm install
npm run db:push   # create/update ./rmeme.db from the schema
npm run dev       # http://localhost:9000
```

Configuration is read from `.env.rmeme`:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | `9000` |
| `DATABASE_URL` | libsql database URL | `file:./rmeme.db` |
| `FILE_STORE_BASE_PATH` | Directory uploaded memes are written to | |
| `HOSTED_FILE_BASE_PATH` | Public base URL memes are served from | |

## Endpoints

API docs (Swagger UI) are served at `/docs`, and the OpenAPI spec at `/openapi.json`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | | Health check |
| GET | `/rmeme` | | Random meme |
| GET | `/rmeme/total` | | Total number of memes |
| POST | `/meme` | ✓ | Upload a meme from a URL (`{ "url": "..." }`) |
| GET | `/meme/:id` | ✓ | Get a meme by ID (negative IDs count back from the newest) |
| PUT | `/meme/:id` | ✓ | Add votes to a meme (`{ "votes": 1 }`) |
| DELETE | `/meme/:id` | ✓ | Delete a meme |

Authenticated routes need an `x-api-key` header. Each key has a daily request limit; the remaining count is returned in the `x-rate-limit` response header.
