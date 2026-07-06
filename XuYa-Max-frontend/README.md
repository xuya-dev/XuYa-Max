# XuYa-Max Frontend

Frontend for XuYa-Max admin system. Built with Vue 3 + Element Plus, fully integrated with the XuYa-Max backend. Vue 3.5 + TypeScript 6 + Vite 8 + Element Plus 2.14 + Tailwind CSS 4.

## Tech Stack

| Tech | Version |
|---|---|
| Vue | 3.5 |
| TypeScript | 6.0 |
| Vite (Rolldown) | 8.1 |
| Element Plus | 2.14 |
| Pinia | 3.0 |
| Tailwind CSS | 4.1 |
| vue-router | 5.1 (hash mode) |
| vue-i18n | 11.4 |
| @vueuse/core | 14.3 |
| ECharts | 6.1 |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server (port 3006, proxies to backend 8080)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm serve
```

Default account: `admin` / `admin123`

## Environment Variables

Key env files (in project root):

| File | Purpose |
|---|---|
| `.env` | Common (version, port, access mode, client id, encrypt keys) |
| `.env.development` | Dev (`VITE_API_URL=/dev-api`, proxy to `localhost:8080`) |
| `.env.production` | Production (`VITE_API_URL=/prod-api`) |

Important variables:
- `VITE_ACCESS_MODE = backend` — menus fetched from backend `/system/menu/getRouters`
- `VITE_APP_CLIENT_ID` — PC client id (matches backend `sys_client` table)
- `VITE_APP_ENCRYPT = true` — API encryption (AES+RSA), must match backend `api-decrypt.enabled`
- `VITE_APP_MESSAGE_ENABLED = true` — SSE real-time messaging

## Project Structure

```
src/
├── api/                # API layer (mirrors backend Controllers)
├── views/              # Pages (system / monitor / dashboard / auth)
├── components/core/    # Reusable components (ArtTable / ArtSearchBar / ArtDictTag ...)
├── hooks/core/         # Hooks (useTable / useDict / useCommon)
├── store/modules/      # Pinia stores (user / menu / setting / worktab / message)
├── utils/              # Utilities (http / xuya-max / sanitize / ossContent / crypto)
├── router/             # Router config + guards (hash mode)
├── directives/         # Permission directives (v-auth / v-roles)
└── locales/            # i18n (zh / en)
```

## Key Conventions

- **useTable + ArtTable + ArtSearchBar** — standard CRUD page pattern
- **request() auto-unwraps** `res.data.data` — API functions return business data directly
- **ArtDictTag** — dictionary rendering (via `useDict`)
- **v-auth** — button-level permission (`v-hasPermi` is an alias)
- **sanitizeHtml** — required for any `v-html` (prevents stored XSS)
- **resolveOssContent** — resolves `oss://{ossId}` placeholders in rich text to presigned URLs

## Deployment

Build output supports **subdirectory deployment** (hash routing + relative asset paths):

```nginx
location /xuya/ {
    alias /path/to/dist/;
}
location /prod-api/ {
    proxy_pass http://backend:8080/;
    proxy_buffering off;  # required for SSE
}
```

Access via `http://xxx.com/xuya/index.html#/dashboard/console`.

## License

MIT
