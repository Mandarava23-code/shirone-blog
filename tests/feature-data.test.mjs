import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	filterByDisabledKeys,
	resolveDevicesData,
	resolveProjectsData,
	resolveSkillsData,
	resolveTimelineData,
} from "../src/utils/feature-data.ts";

describe("Feature Data & Resolver Tests", () => {
	it("filterByDisabledKeys correctly filters items by key/id/name/title", () => {
		const items = [
			{ key: "item-1", name: "One" },
			{ key: "item-2", name: "Two" },
			{ key: "item-3", name: "Three" },
		];

		const filtered = filterByDisabledKeys(items, ["item-2"]);
		assert.equal(filtered.length, 2);
		assert.deepEqual(
			filtered.map((i) => i.key),
			["item-1", "item-3"],
		);
	});

	it("resolveProjectsData applies disabledKeys correctly", () => {
		const items = [
			{ key: "keep", name: "Keep" },
			{ key: "drop", name: "Drop" },
		];
		const resolved = resolveProjectsData(
			{ enable: true, categories: [], disabledKeys: ["drop"] },
			items,
		);
		assert.deepEqual(
			resolved.map((project) => project.key),
			["keep"],
		);
	});

	it("resolveSkillsData applies disabledNames correctly", () => {
		const items = [
			{ name: "TypeScript" },
			{ name: "PHP" },
			{ name: "Rust" },
		];
		const resolved = resolveSkillsData(
			{ enable: true, categories: [], disabledNames: ["PHP"] },
			items,
		);
		assert.deepEqual(
			resolved.map((skill) => skill.name),
			["TypeScript", "Rust"],
		);
	});

	it("resolveTimelineData applies disabledTitles and order correctly", () => {
		const items = [
			{ title: "Senior Frontend Engineer", date: "2024.06 - Present" },
			{ title: "Computer Science & Engineering Degree", date: "2020.09 - 2024.06" },
			{ title: "First Internship", date: "2019.06 - 2019.09" },
		];
		const resolved = resolveTimelineData(
			{
				enable: true,
				categories: [],
				order: "asc",
				disabledTitles: ["Senior Frontend Engineer"],
			},
			items,
		);
		assert.deepEqual(
			resolved.map((item) => item.title),
			["First Internship", "Computer Science & Engineering Degree"],
		);
	});

	it("resolveTimelineData sorts correctly by date in desc and asc order", () => {
		const customItems = [
			{ title: "Old", date: "2021.05" },
			{ title: "Recent", date: "2024.10" },
			{ title: "Present", date: "2025.01 - Present" },
			{ title: "Middle", date: "2023.01" },
		];
		const descRes = resolveTimelineData({ order: "desc" }, customItems);
		assert.deepEqual(
			descRes.map((i) => i.title),
			["Present", "Recent", "Middle", "Old"],
		);

		const ascRes = resolveTimelineData({ order: "asc" }, customItems);
		assert.deepEqual(
			ascRes.map((i) => i.title),
			["Old", "Middle", "Recent", "Present"],
		);
	});

	it("resolveDevicesData applies disabledIds correctly", () => {
		const items = [
			{ id: "keep", name: "Keep" },
			{ id: "drop", name: "Drop" },
		];
		const resolved = resolveDevicesData(
			{ enable: true, categories: [], disabledIds: ["drop"] },
			items,
		);
		assert.deepEqual(
			resolved.map((device) => device.id),
			["keep"],
		);
	});
});
