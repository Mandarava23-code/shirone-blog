import {
	cleanupContentFixtures,
	materializeContentFixtures,
} from "./content-fixture-utils";

// Must use the same host as `webServer.url` / `use.baseURL` in
// playwright.config.ts. Hardcoding 127.0.0.1 while the dev server may listen on
// `localhost` (which can resolve to ::1) makes every request fail at connection
// time, so globalSetup can only ever time out.
const CONTENT_ROUTES = [
	"http://localhost:4321/posts/guide/",
	"http://localhost:4321/series/markdown-syntax-guide/",
];
const TIMEOUT_MS = 60_000;
const RETRY_INTERVAL_MS = 500;
/** Give the dev server a moment to finish wiring its content watcher. */
const WATCHER_SETTLE_MS = 1_000;
/** Replay the copy once if the initial `add` events were missed. */
const REMATERIALIZE_AFTER_MS = 10_000;

async function isServed(route: string): Promise<boolean> {
	try {
		const response = await fetch(route);
		await response.body?.cancel();
		return response.ok;
	} catch {
		// The dev server may still be starting; retry until the deadline.
		return false;
	}
}

async function allRoutesServed(): Promise<boolean> {
	for (const route of CONTENT_ROUTES) {
		if (!(await isServed(route))) return false;
	}
	return true;
}

export default async function setup(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, WATCHER_SETTLE_MS));
	await materializeContentFixtures();

	const startedAt = Date.now();
	const deadline = startedAt + TIMEOUT_MS;
	let replayed = false;

	while (Date.now() < deadline) {
		if (await allRoutesServed()) return;

		if (!replayed && Date.now() - startedAt >= REMATERIALIZE_AFTER_MS) {
			// The content layer occasionally misses the first `add` events when
			// files appear right after the dev server becomes reachable. Removing
			// and copying the fixtures again once the server is warm replays them
			// as `unlink` + `add` events the watcher now observes.
			await cleanupContentFixtures();
			await materializeContentFixtures();
			replayed = true;
		}

		await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
	}

	const missing: string[] = [];
	for (const route of CONTENT_ROUTES) {
		if (!(await isServed(route))) missing.push(route);
	}
	throw new Error(
		`Timed out waiting for ${missing.join(", ")} after materializing Playwright content fixtures.`,
	);
}
