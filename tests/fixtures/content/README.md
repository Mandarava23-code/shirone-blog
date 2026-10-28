# Playwright content fixtures

These files are the upstream sample articles, series, and include snippet that the
site spec suite navigates to (`/posts/guide/`, `/posts/admonitions/`,
`/series/markdown-syntax-guide/`, and so on). They are **not** published by the
blog: `src/content/posts`, `src/content/series`, and `src/content/snippets` are
kept free of sample content.

`tests/fixtures/setup-content.ts` copies each mount into `src/content/` before
the Playwright run and records the created entries in
`src/content/.playwright-content-fixtures.json`; `teardown-content.ts` removes
exactly those entries afterwards. Existing files are never overwritten, and
`git status` stays clean because the materialized paths are ignored.

The fixtures were recovered from commit `e0fbfe27a` (the last commit before the
sample articles were removed). If a spec depends on a new route, add the source
file here rather than restoring it under `src/content/`.
