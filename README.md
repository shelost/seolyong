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

## Goal (next)

- Add a small password-protected `/admin` editor that writes markdown files and commits to git (no external DB).
