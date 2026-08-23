# API Documentation Portal — Architecture & Component Design

## 1. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Static export, file-based routing, MDX built-in |
| Content | **MDX + gray-matter** | Author API docs in MDX; frontmatter for metadata |
| OpenAPI | **redocly/cli + @redocly/openapi-core** | Parse & bundle OpenAPI 3.x specs into JSON at build |
| API Renderer | **redoc** (React wrapper) | Interactive API reference from OpenAPI schemas |
| Styling | **Tailwind CSS + shadcn/ui** | Consistent design system, dark mode |
| Search | **Pagefind** | Zero-config static search, works at build time |
| Deploy | **Vercel / S3 + CloudFront** | Fully static export, no server needed |
| CI | **GitHub Actions** | Validate specs, lint MDX, rebuild on merge |

## 2. Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (nav + sidebar + footer)
│   ├── page.tsx                # Landing / index
│   ├── docs/
│   │   └── [slug]/
│   │       └── page.tsx        # Dynamic MDX page renderer
│   ├── api-reference/
│   │   └── [service]/
│   │       └── page.tsx        # Redoc API reference per service
│   └── runbooks/
│       └── [slug]/
│           └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Breadcrumbs.tsx
│   ├── mdx/
│   │   ├── Callout.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── EndpointBadge.tsx
│   │   ├── ApiLink.tsx         # Auto-links to OpenAPI operationId
│   │   └── TabbedCode.tsx      # cURL / Python / JS tabs
│   └── api/
│       └── RedocProvider.tsx
├── content/
│   ├── guides/                 # Integration guides (MDX)
│   ├── runbooks/               # Operational runbooks (MDX)
│   └── changelog/              # Release notes (MDX)
├── openapi/
│   ├── auth.yaml
│   ├── metrics.yaml
│   ├── monitoring.yaml
│   └── dashboards.yaml
├── lib/
│   ├── openapi.ts              # Parse specs, extract operationIds, build index
│   ├── content.ts              # MDX loader, frontmatter parsing
│   └── navigation.ts           # Generate sidebar tree from content + specs
└── styles/
    └── globals.css
```

## 3. Build Pipeline

```
┌──────────────┐    ┌───────────────────┐    ┌──────────────────────┐
│  OpenAPI YAML │───▶│  redocly bundle   │───▶│  /api-reference/     │
│  (4 services) │    │  + JSON output    │    │  [service]/page.tsx  │
└──────────────┘    └───────────────────┘    └──────────────────────┘
                                                      │
┌──────────────┐    ┌───────────────────┐             │
│  MDX content │───▶│  next-mdx-remote  │─────────────┼──▶ Static HTML
│  guides etc. │    │  + frontmatter    │             │    (next export)
└──────────────┘    └───────────────────┘             │
                                                      │
┌──────────────┐    ┌───────────────────┐             │
│  lib/openapi │───▶│  operationId map  │─────────────┘
│  .ts parser  │    │  → href linking   │
└──────────────┘    └───────────────────┘
```

1. **Spec Bundle Step** (pre-build): `redocly bundle` each YAML → single JSON artifact in `public/api/`.
2. **Index Step** (build): `lib/openapi.ts` reads all bundled JSON, extracts `{ service, operationId, method, path }`, writes `operation-index.json`.
3. **MDX Compile Step** (build): Custom `ApiLink` component resolves `operationId` → `/api-reference/{service}#operationId` at render time.
4. **Static Export**: `next build && next export` produces fully static site.

## 4. Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Navbar  [Logo] [Docs▾] [API Ref] [Runbooks] [🔍]  │
├────────────┬────────────────────────────────────────┤
│            │  Breadcrumbs: Docs > Auth > JWT Flow   │
│  Sidebar   │────────────────────────────────────────│
│            │                                        │
│ ▸ Getting  │  # JWT Authentication Flow            │
│   Started  │                                        │
│ ▸ Auth     │  Overview text in MDX...               │
│   └ JWT    │                                        │
│   └ API Keys│  ┌──────────────────────────────┐    │
│ ▸ Metrics  │  │  EndpointBadge GET /v1/token  │    │
│ ▸ Monitor  │  │  → links to Redoc section     │    │
│ ▸ Dashboard│  └──────────────────────────────┘    │
│            │                                        │
│ ──────     │  ```bash tab=cURL                     │
│ API Ref    │  curl -X POST /v1/token ...           │
│ ▸ Auth     │  ```                                  │
│ ▸ Metrics  │                                        │
│ ▸ Monitor  │  <Callout type=warning>               │
│ ▸ Dashboard│  Token expires in 3600s               │
│            │  </Callout>                            │
│ ──────     │                                        │
│ Runbooks   │  ─────────────────────────────────    │
│ ▸ Incident │  ← Prev          Next →               │
│ ▸ On-Call  │                                        │
├────────────┴────────────────────────────────────────┤
│  Footer  [GitHub] [Status] [Support]                │
└─────────────────────────────────────────────────────┘
```

## 5. Navigation Structure

Top-level nav items (Navbar):
- **Docs** → `/docs/[slug]` (guides, ordered by frontmatter `order`)
- **API Reference** → `/api-reference/[service]` (one page per OpenAPI spec)
- **Runbooks** → `/runbooks/[slug]` (operational procedures)

Sidebar is **context-aware**:
- Under `/docs/*` → shows guide hierarchy from frontmatter
- Under `/api-reference/*` → shows service list + tag groups parsed from OpenAPI `tags`
- Under `/runbooks/*` → shows runbook categories

`lib/navigation.ts` generates sidebar config at build from:
1. `content/**/page.mdx` frontmatter (`title`, `order`, `category`, `parent`)
2. `openapi/*.yaml` parsed `info.title` + `tags[]`

## 6. Component Tree

```
<RootLayout>
├── <Navbar>
│   ├── <Logo />
│   ├── <NavLinks />              // Docs | API Ref | Runbooks
│   ├── <VersionSelector />       // multi-version spec support
│   └── <SearchToggle />          // opens Pagefind overlay
├── <PageContainer>
│   ├── <Sidebar>
│   │   ├── <SidebarSection>      // collapsible group
│   │   │   └── <SidebarLink />   // active-state highlight
│   │   └── ...sections
│   └── <MainContent>
│       ├── <Breadcrumbs />
│       ├── <MDXProvider>         // maps MDX components
│       │   ├── <Callout />
│       │   ├── <CodeBlock />
│       │   ├── <EndpointBadge />
│       │   ├── <ApiLink />       // auto-links to OpenAPI op
│       │   ├── <TabbedCode />
│       │   └── ...standard MDX
│       └── <PageNav />           // prev / next links
├── <Footer />
└── <SearchOverlay />             // Pagefind modal
```

For API Reference pages, `<MainContent>` renders:

```
<MainContent>
├── <Breadcrumbs />
├── <RedocProvider specUrl="/api/auth.json" />
└── <PageNav />
</MainContent>
```

## 7. Auto-Linking Strategy

The `ApiLink` component bridges MDX prose to OpenAPI operations:

```tsx
// Usage in MDX: <ApiLink service="auth" operationId="createToken" />
// Resolves to:  /api-reference/auth#operation/createToken
```

`lib/openapi.ts` builds a lookup map at build time:

```ts
type OpIndex = Record<string, { service: string; method: string; path: string }>;
// key = "auth.createToken" → { service: "auth", method: "POST", path: "/v1/token" }
```

This ensures that any mention of an API operation in guides or runbooks automatically links to its canonical reference, and broken links fail the build.

## 8. Theming & Dark Mode

- Tailwind `darkMode: "class"` on `<html>`.
- All components use semantic tokens (`bg-surface`, `text-primary`).
- Redoc themed via `redocOptions.theme` to match portal palette.

## 9. Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 |
| First Contentful Paint | < 1.0s |
| Total page weight | < 200 KB (excl. images) |
| Search index | < 500 KB |

Achieved via: static export, no client JS for content pages, Redoc lazy-loaded per service page, Pagefind lightweight index.

## 10. Future Extensions

- **Versioning**: `/api-reference/auth/v2/` with per-version OpenAPI specs
- **Try-it Console**: Replace Redoc with SwaggerUI or custom fetch wrapper
- **Interactive Examples**: Sandpack-based runnable code blocks
- **Spec Diffing**: Visual changelog when OpenAPI specs change between versions