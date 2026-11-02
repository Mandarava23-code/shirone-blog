import { expect, test } from "@playwright/test";
import { friendsConfig } from "../../src/config/friendsConfig";
import { getFriendsList } from "../../src/data/friends";
import I18nKey from "../../src/i18n/i18nKey";
import { resolveI18nText } from "../../src/utils/i18n-utils";

/**
 * 友链页功能锁定（pages/friends.astro -> organisms/FriendSection.svelte，client:visible）。
 * 视觉约束对齐站点设计语言：PageHeader 页内大标题（装饰图标 + 右侧动作区）、
 * 胶囊搜索条、官方 Chips 筛选原子、PostCard 风格卡片（hover 箭头 + #tag 弱文本标签）、
 * 筛选状态 URL 同步（?q= / ?tag=）。
 *
 * 断言全部从 src/data/friends.ts 与配置推导，换数据后不需要改测试。
 */
const friends = getFriendsList();
const FRIEND_COUNT = friends.length;
const first = friends[0];
const pageTitle = resolveI18nText(friendsConfig.title, I18nKey.friends);
const pageSubtitle = resolveI18nText(
	friendsConfig.description,
	I18nKey.friendsBanner,
);
const tagNames = Array.from(
	new Set(friends.flatMap((friend) => friend.tags)),
).sort();
const tagFilteredCount = (tag: string) =>
	friends.filter((friend) => friend.tags.includes(tag)).length;

test.describe("友链页", () => {
	test.skip(FRIEND_COUNT === 0, "src/data/friends.ts 没有友链数据");

	test.beforeEach(async ({ page }) => {
		await page.goto("/friends/");
		await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
	});

	test("渲染友链卡片（整卡可点，标题 / 描述 / 标签）", async ({ page }) => {
		const card = page.locator(".friend-card").first();
		await expect(card).toHaveAttribute("href", first.siteurl);
		await expect(card).toHaveAttribute("target", "_blank");
		await expect(card).toContainText(first.title);
		await expect(card).toContainText(first.desc);
		if (first.tags.length > 0) {
			await expect(card.locator(".friend-card__tag").first()).toHaveText(
				`#${first.tags[0]}`,
			);
		}
	});

	test("使用站点统一的友链视觉结构", async ({ page }) => {
		// PageHeader 封装的大标题（带装饰图标）
		await expect(page.locator(".page-header")).toHaveCount(1);
		await expect(page.locator(".page-header__title")).toHaveText(pageTitle);
		await expect(page.locator(".page-header__icon svg")).toHaveCount(1);
		// PostCard 式箭头（chevron，hover 右滑）
		await expect(page.locator(".friend-card__arrow")).toHaveCount(FRIEND_COUNT);
		// 官方 Chips 原子（filter 形态）承担标签筛选，数量来自数据里的标签去重
		await expect(
			page.locator(".friend-section__chips .m3-chip--filter"),
		).toHaveCount(tagNames.length);
		// 换链说明为 PageHeader 副标题
		await expect(page.locator(".page-header__subtitle")).toHaveText(
			pageSubtitle,
		);
	});

	test("筛选状态同步到 URL（?q= / ?tag=）", async ({ page }) => {
		test.skip(tagNames.length === 0, "当前数据没有标签可筛选");

		await page.locator(".friend-section__search input").fill(first.title);
		await expect(page).toHaveURL(/[?&]q=/);

		await page.getByRole("button", { name: tagNames[0], exact: true }).click();
		await expect(page).toHaveURL(/[?&]tag=/);

		await page.locator(".friend-section__search input").fill("");
		await expect(page).toHaveURL(/[?&]tag=/);
	});

	test("单选标签筛选（再点取消恢复全部，aria-pressed 同步）", async ({
		page,
	}) => {
		test.skip(tagNames.length === 0, "当前数据没有标签可筛选");

		const tag = tagNames[0];
		const chip = page.getByRole("button", { name: tag, exact: true });
		await chip.click();
		await expect(chip).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator(".friend-card")).toHaveCount(
			tagFilteredCount(tag),
		);
		await chip.click();
		await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
		await expect(chip).toHaveAttribute("aria-pressed", "false");
	});

	test("搜索过滤 + 空态", async ({ page }) => {
		await page.locator(".friend-section__search input").fill(first.title);
		await expect(
			page.getByText(first.title, { exact: true }).first(),
		).toBeVisible();

		await page.locator(".friend-section__search input").fill("no such site");
		await expect(page.locator(".friend-section__empty")).toBeVisible();
	});
});

test.describe("友链页 Swup 导航", () => {
	test.use({ viewport: { width: 1280, height: 900 } });

	test("重复进入后保持组件样式和加载指示器居中", async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });

		for (let visit = 0; visit < 3; visit++) {
			await page.locator('#top-row a[href="/friends/"]').click();
			await expect(page).toHaveURL(/\/friends\/$/);
			const list = page.locator(".friend-section__list");
			await expect(page.locator(".friend-card")).toHaveCount(FRIEND_COUNT);
			await expect(list).toHaveCSS("display", "grid");
			await expect(list).toHaveCSS("gap", "16px");
			await expect(list).toHaveCSS(
				"grid-template-columns",
				/\d+(\.\d+)?px \d+(\.\d+)?px/,
			);

			if (tagNames.length > 0) {
				const chip = page.getByRole("button", {
					name: tagNames[0],
					exact: true,
				});
				await chip.click();
				// 加载过渡只有几百毫秒：一次性取回几何信息，避免分步断言错过窗口
				const handle = await page.waitForFunction(
					() => {
						const loading = document.querySelector(".friend-section__loading");
						const indicator = loading?.querySelector(".m3-loading");
						if (!loading || !indicator) return null;
						const a = loading.getBoundingClientRect();
						const b = indicator.getBoundingClientRect();
						return {
							width: Math.round(b.width),
							height: Math.round(b.height),
							centerGap: Math.abs(a.x + a.width / 2 - (b.x + b.width / 2)),
						};
					},
					null,
					{ timeout: 3000, polling: 50 },
				);
				const metrics = (await handle.jsonValue()) as {
					width: number;
					height: number;
					centerGap: number;
				};
				expect(metrics.width).toBe(64);
				expect(metrics.height).toBe(64);
				expect(metrics.centerGap).toBeLessThanOrEqual(1);
			}

			await page.locator('#top-row a[data-nav-key="home"]').click();
			await expect(page).toHaveURL(/\/$/);
		}
	});
});
