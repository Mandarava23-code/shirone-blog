import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test as base } from "@playwright/test";

export { expect } from "@playwright/test";

export const test = base.extend<
	{ codePostPath: string },
	{ typographyPost: string }
>({
	typographyPost: [
		async ({}, use) => {
			const slug = `playwright-typography-${randomUUID()}`;
			const postFile = fileURLToPath(
				new URL(`../../src/content/posts/${slug}.md`, import.meta.url),
			);
			const content = await readFile(
				new URL("./typography.md", import.meta.url),
				"utf8",
			);
			await mkdir(dirname(postFile), { recursive: true });
			await writeFile(postFile, content, { flag: "wx" });
			try {
				await use(`/posts/${slug}/`);
			} finally {
				await rm(postFile, { force: true });
			}
		},
		{ scope: "worker" },
	],
	codePostPath: async ({ request, typographyPost }, use) => {
		await expect
			.poll(
				async () => {
					const response = await request.get(typographyPost);
					const status = response.status();
					await response.dispose();
					return status;
				},
				{ message: "Astro serves the temporary typography post", timeout: 15_000 },
			)
			.toBe(200);
		await use(typographyPost);
	},
});
