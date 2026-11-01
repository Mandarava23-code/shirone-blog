import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Post schema — used by both source repo (inline) and package mode users
 * (inline in their `src/content.config.ts`).
 */
export const postSchema: z.ZodType = z.object({
	title: z.string(),
	published: z.date(),
	publishedAt: z.date().optional(),
	updated: z.date().optional(),
	updatedAt: z.date().optional(),
	pinned: z.boolean().optional().default(false),
	draft: z.boolean().optional().default(false),
	comment: z.boolean().optional().default(true),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),
	// 系列（series）功能已停用（2026-11）：文章 frontmatter 的系列字段保留如下，
	// 恢复时取消注释即可（旧内容里的 series/seriesOrder 会被 schema 忽略，不报错）
	// /** Series slug the post belongs to (empty = none; single series per post). */
	// series: z
	// 	.string()
	// 	.optional()
	// 	.default("")
	// 	.transform((value) => value.trim()),
	// /** Position inside the series; falls back to publication order when absent. */
	// seriesOrder: z.number().int().optional(),
	lang: z.string().optional().default(""),

	/* Post encryption */
	encrypted: z.boolean().optional().default(false),
	password: z
		.union([z.string(), z.number()])
		.transform((v) => String(v))
		.optional(),
	passwordHint: z.string().optional().default(""),
	hideHomeContent: z.boolean().optional().default(true),

	/* Post alias & custom permalink */
	alias: z.string().optional(),
	permalink: z.string().optional(),

	/* For internal use */
	prevUrl: z.string().optional(),
	nextUrl: z.string().optional(),
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});

/** Schema for the short-form "moments" timeline. */
export const momentSchema: z.ZodType = z.object({
	published: z.date(),
	pinned: z.boolean().optional().default(false),
	location: z.string().optional().default(""),
	/** Mood icon (Iconify name, e.g. `material-symbols:sentiment-excited-outline-rounded`). */
	mood: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	images: z
		.array(
			z.object({
				src: z.string(),
				alt: z.string().optional().default(""),
			}),
		)
		.optional()
		.default([]),
	draft: z.boolean().optional().default(false),
});

/** Schema for free-form spec pages (currently just `about.md`). */
export const specSchema: z.ZodType = z.object({});

// 系列（series）功能已停用（2026-11）：系列集合 schema 保留如下，恢复时取消注释。
// 原 `src/integration/collections.manifest.json` 条目（JSON 无法写注释，故备份在此）：
//   { "key": "series", "pattern": "**/*.md", "schema": "seriesSchema" }
// /**
//  * Schema for series entities. Each entry is one series; the Markdown body is
//  * the optional overview rendered on the series page.
//  */
// export const seriesSchema: z.ZodType = z.object({
// 	title: z.string(),
// 	status: z.enum(["ongoing", "completed"]).optional().default("ongoing"),
// 	defaultCategory: z.string().optional().default(""),
// });

/**
 * Helper to create a collection definition with the standard glob loader.
 * Package mode users can import this if they need custom paths.
 */
export function createCollection(
	key: "posts" | "moments" | "spec",
	base: string,
): ReturnType<typeof defineCollection> {
	const loaders = {
		posts: glob({ base: `${base}/posts`, pattern: "**/*.{md,mdx}" }),
		moments: glob({ base: `${base}/moments`, pattern: "**/*.md" }),
		spec: glob({ base: `${base}/spec`, pattern: "**/*.{md,mdx}" }),
		// 系列（series）功能已停用（2026-11）
		// series: glob({ base: `${base}/series`, pattern: "**/*.md" }),
	};
	const schemas = {
		posts: postSchema,
		moments: momentSchema,
		spec: specSchema,
		// 系列（series）功能已停用（2026-11）
		// series: seriesSchema,
	};
	return defineCollection({
		loader: loaders[key],
		schema: schemas[key],
	});
}
