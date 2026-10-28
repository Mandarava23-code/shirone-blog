import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Materialize the sample content that the Playwright suite was written against.
 *
 * The blog itself no longer ships `src/content/posts/*` sample articles. Tests
 * still need deterministic routes such as `/posts/guide/` and
 * `/series/markdown-syntax-guide/`, so the fixtures live under
 * `tests/fixtures/content/` and are copied into the real content tree for the
 * duration of a test run.
 *
 * A marker file records only the entries this helper created. Teardown removes
 * exactly those entries, so real posts and series are never deleted. Existing
 * files are skipped (and never recorded), so a user-authored post with the same
 * slug wins over the fixture.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FIXTURES = path.join(ROOT, "tests", "fixtures", "content");
const CONTENT = path.join(ROOT, "src", "content");
const MARKER = path.join(CONTENT, ".playwright-content-fixtures.json");
const MOUNTS = ["posts", "series", "snippets"] as const;

interface Marker {
	version: 1;
	paths: string[];
}

async function readMarker(): Promise<string[]> {
	if (!existsSync(MARKER)) return [];
	try {
		const parsed = JSON.parse(await readFile(MARKER, "utf8")) as Marker;
		return parsed.version === 1 && Array.isArray(parsed.paths)
			? parsed.paths.filter((entry) => typeof entry === "string")
			: [];
	} catch {
		return [];
	}
}

async function removeRecorded(paths: readonly string[]): Promise<void> {
	for (const relative of paths) {
		const absolute = path.resolve(CONTENT, relative);
		if (!absolute.startsWith(CONTENT + path.sep)) continue;
		await rm(absolute, { recursive: true, force: true });
	}
}

/** Remove fixtures left behind by a previous (possibly crashed) run. */
export async function cleanupContentFixtures(): Promise<void> {
	await removeRecorded(await readMarker());
	await rm(MARKER, { force: true });
}

/** Copy the fixture content into `src/content/` and record what was created. */
export async function materializeContentFixtures(): Promise<string[]> {
	await cleanupContentFixtures();

	const created: string[] = [];
	for (const mount of MOUNTS) {
		const source = path.join(FIXTURES, mount);
		if (!existsSync(source)) continue;
		const destination = path.join(CONTENT, mount);
		await mkdir(destination, { recursive: true });

		for (const entry of await readdir(source)) {
			const from = path.join(source, entry);
			const to = path.join(destination, entry);
			if (existsSync(to)) continue;
			await cp(from, to, { recursive: true, force: false, errorOnExist: true });
			created.push(path.relative(CONTENT, to).replaceAll("\\", "/"));
		}
	}

	await writeFile(
		MARKER,
		`${JSON.stringify({ version: 1, paths: created }, null, 2)}\n`,
		"utf8",
	);
	return created;
}
