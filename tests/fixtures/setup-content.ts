import { materializeContentFixtures } from "./content-fixture-utils";

const CONTENT_ROUTES = [
	"http://127.0.0.1:4321/posts/guide/",
	"http://127.0.0.1:4321/series/markdown-syntax-guide/",
];
const TIMEOUT_MS = 60_000;

async function waitForContent(): Promise<void> {
	const deadline = Date.now() + TIMEOUT_MS;
	for (const route of CONTENT_ROUTES) {
		while (Date.now() < deadline) {
			try {
				const response = await fetch(route);
				await response.body?.cancel();
				if (response.ok) break;
			} catch {
				// The dev server may still be starting; retry until the deadline.
			}
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
		if (Date.now() >= deadline) {
			throw new Error(
				`Timed out waiting for ${route} after materializing Playwright content fixtures.`,
			);
		}
	}
}

export default async function setup(): Promise<void> {
	await materializeContentFixtures();
	await waitForContent();
}
