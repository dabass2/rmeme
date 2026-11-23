# rmeme

- [`backend/`](backend): the rmeme API (Hono + Drizzle + SQLite), served at `api.rmeme.me`
- [`frontend/`](frontend): the rmeme website (TanStack Start + shadcn/ui), served at `rmeme.me`

## Deployment

Both apps run on the VPS defined in `dabass2/leinad-vps`.

Pushing to `main` builds and deploys whichever app changed. Its GitHub workflow publishes the image (`ghcr.io/dabass2/rmeme-backend` or `ghcr.io/dabass2/rmeme-frontend`) and then asks Watchtower on the VPS to pull it and restart that container. Pull requests only build the images, as a check.

The workflows need one repository secret, `WATCHTOWER_TOKEN`: the same token the other apps on the VPS use.
