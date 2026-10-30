import { test as base, expect } from "@playwright/test";

export { expect } from "@playwright/test";

/**
 * The typography specs only need any served post page that owns
 * `.markdown-content`; they inject their own probes into it.
 *
 * `/posts/guide/` is materialized by globalSetup, which also waits until Astro
 * serves it (replaying the copy if the content watcher missed the initial
 * events). Writing a throwaway post during the run was flaky: the watcher
 * occasionally missed that post's `add` event and the route stayed 404 for the
 * whole poll (the loader only re-reads entries it already tracks).
 */
export const test = base.extend<{ codePostPath: string }>({
	codePostPath: async ({ request }, use) => {
		const path = "/posts/guide/";
		await expect
			.poll(
				async () => {
					const response = await request.get(path);
					const status = response.status();
					await response.dispose();
					return status;
				},
				{ message: "Astro serves the guide fixture post", timeout: 30_000 },
			)
			.toBe(200);
		await use(path);
	},
});
