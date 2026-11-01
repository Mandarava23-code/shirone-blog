# Playwright content fixtures

These files are the upstream sample articles and include snippet that the site
spec suite navigates to (`/posts/guide/`, `/posts/admonitions/`, and so on).
They are **not** published by the blog: `src/content/posts` and
`src/content/snippets` are kept free of sample content.

<!-- 系列（series）功能已停用（2026-11）：原样例系列实体已改名为
     series/markdown-syntax-guide.md.disabled，/series/<slug>/ 路由不再生成。 -->

`tests/fixtures/setup-content.ts` copies each mount into `src/content/` before
the Playwright run and records the created entries in
`src/content/.playwright-content-fixtures.json`; `teardown-content.ts` removes
exactly those entries afterwards. Existing files are never overwritten, and
`git status` stays clean because the materialized paths are ignored.

The fixtures were recovered from commit `e0fbfe27a` (the last commit before the
sample articles were removed). If a spec depends on a new route, add the source
file here rather than restoring it under `src/content/`.
