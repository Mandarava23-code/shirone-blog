import { defineConfig } from "@playwright/test";

/**
 * 组件质量专项 — Playwright 配置
 * 说明：测试针对 Astro 开发服务器上的 atoms-*-test 页面（组件库验证页）。
 * 复用系统 Chrome（channel: chrome），避免额外下载浏览器。
 */
export default defineConfig({
	testDir: "./tests",
	// Playwright specs are `.spec.ts`; `tests/**/*.test.mjs` are node:test files
	// run by `node --test` and must not be collected as Playwright tests.
	testMatch: "**/*.spec.ts",
	timeout: 30_000,
	expect: { timeout: 5_000 },
	// Sample posts/series live under tests/fixtures/content and are copied into
	// src/content only while the suite runs; teardown removes them again.
	globalSetup: "./tests/fixtures/setup-content.ts",
	globalTeardown: "./tests/fixtures/teardown-content.ts",
	// 截图命名去掉平台/项目后缀（-win32），且随 spec 文件旁存放
	snapshotPathTemplate:
		"{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: "http://localhost:4321",
		channel: "chrome",
		viewport: { width: 1280, height: 900 },
		trace: "retain-on-failure",
	},
	webServer: {
		command:
			process.platform === "win32"
				? "pnpm.cmd astro dev --port 4321 --host"
				: "pnpm astro dev --port 4321 --host",
		url: "http://localhost:4321",
		reuseExistingServer: true,
		timeout: 120_000,
		env: {
			ASTRO_DEV_BACKGROUND: "false",
			// Astro derives `import.meta.env.PROD` from NODE_ENV. Inheriting
			// `production` from the caller silently turns the dev server into a
			// production build, which hides draft posts — and the fixtures rely
			// on drafts being served.
			NODE_ENV: "development",
		},
	},
});
