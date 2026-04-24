# seolyong

A gentle notebook-style blog.

## Local dev

```bash
npm i
npm run dev -- --open
```

## Content

Posts live in:

- `src/lib/content/posts/*.md`

Each file uses simple frontmatter:

```md
---
title: "..."
date: "YYYY-MM-DD"
excerpt: "..." # optional
---

Body text...
```

## Admin (simple CMS)

- `/admin` login (password)
- `/admin/editor` basic editor

Set env var:

- `SEOLYONG_ADMIN_PASSWORD=...`

Note: on Vercel, writing files at runtime is ephemeral. Next step is GitHub commits from the server (or manual edits + redeploy).

