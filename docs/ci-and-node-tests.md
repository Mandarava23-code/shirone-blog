# CI and Node Test Contract

This project runs unit tests directly with Node. CI uses Node 22 and Node 24. Astro/Vite supplies TypeScript, aliases, and extension resolution during development, but `node --test` does not; code loaded by tests must work in both environments.

## Runtime boundaries

- Do not make a pure Node test path import a TypeScript module containing a runtime `enum`. Node's strip-only TypeScript loader does not support `enum`.
- When a Node test needs enum-shaped keys, expose string keys through an `.mjs` runtime bridge and keep the TypeScript declaration in a matching `.d.mts` file.
- TypeScript files loaded directly by Node must use explicit `.ts` extensions for relative imports. Do not rely on Vite aliases such as `@/`.
- User-facing copy must still go through `i18n()` and the `I18nKey` registry. A runtime bridge changes loading only; it must not duplicate translations or bypass the ten locale modules.

## Local validation order

After changing Markdown processing, i18n modules, or test loading paths, run:

```powershell
pnpm.cmd exec biome ci ./src
npx.cmd astro check
pnpm.cmd check:manifest
node --test "tests/**/*.test.mjs"
git diff --check
```

Do not run `astro check` in parallel with content-sync tests. Astro check triggers content synchronization, while `tests/content/*` uses temporary repository fixtures; concurrent runs can cause false failures such as empty stderr. Run the complete unit suite separately.

## GitHub Actions diagnosis

Inspect the run summary first, then the failed job logs:

```powershell
gh run view <run-id> --json status,conclusion,headSha,jobs,url
gh run view <run-id> --job <job-id> --log-failed
```

Reproduce the failed step locally with the same Node major version and command. Keep build, diagnostics, and unit-test failures separate; change implementation only when the failure reproduces in an isolated run.

## Before committing

- Review `git diff` and confirm locale files contain only required import or formatting changes.
- Stage paths explicitly. Never use `git add -A`, which can include `Shirone-Content/`, temporary fixtures, or build output.
- Use a conventional commit such as `fix(markdown): support direct Node markdown tests`.

## Sample content fixtures

The blog does not publish the upstream sample articles, but most site specs still
navigate to their stable routes (`/posts/guide/`, `/series/markdown-syntax-guide/`,
and so on). Those articles, series, and include snippets live under
`tests/fixtures/content/` and are materialized by `tests/fixtures/setup-content.ts`
before the suite runs; `tests/fixtures/teardown-content.ts` removes exactly the
entries it created. The node include tests read the snippet straight from
`tests/fixtures/content/snippets/`, so they do not depend on materialization.

- Existing files are never overwritten, so a real post with the same slug wins.
- The marker `src/content/.playwright-content-fixtures.json` records what to remove and
  is ignored by Git. Materialized content is removed at teardown; if a run crashes, the
  files stay visible in `git status` (a later run still cleans them through the marker).
- If a run is forcibly terminated, the next run cleans the recorded leftovers before
  copying again. Deleting `src/content/.playwright-content-fixtures.json` is safe when
  no Playwright process is running.
- Fixtures are never part of `pnpm build`: teardown removes them when the suite ends.

When removing sample articles permanently, move them out of `src/content/` and into
`tests/fixtures/content/` instead of deleting the routes the suite depends on. Also
remove their paths from the Markdown manifest's `docs` arrays; keep existing
documentation references and syntax entries, and use `docs: []` when no separate
usage document remains. The manifest validator continues to check every declared path.

## Style regression fixtures

The font and inline-code emphasis tests use `tests/fixtures/typography.md`,
independently of the blog's published posts. The shared Playwright fixture creates
a uniquely named draft under `src/content/posts/`, waits for Astro to serve it,
and removes it during worker teardown. It uses the existing Playwright web server
and covers both direct loads and Swup navigation.

Temporary files match `src/content/posts/playwright-typography-*.md` and are
ignored by Git. If a test process is forcibly terminated, remove only those
temporary files before the next run. They are drafts and are excluded from
production post routes.

Run the CI style fragment with:

```powershell
pnpm.cmd exec playwright test tests/site/fonts.spec.ts tests/site/inline-code-emphasis.spec.ts
```
