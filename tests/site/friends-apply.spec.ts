import { expect, test } from "@playwright/test";
import {
	friendsConfig,
	resolveFriendsApply,
} from "../../src/config/friendsConfig";
import I18nKey from "../../src/i18n/i18nKey";
import { i18n } from "../../src/i18n/translation";

/**
 * 友链申请通道（FriendSection → FriendApplyDialog）。
 * 通道由 friendsConfig.apply 决定：未配置 repo/email 时入口不渲染，
 * 这组用例整体跳过，避免把「未开启」误判成回归。
 */
const apply = resolveFriendsApply(friendsConfig.apply);

test.describe("友链申请", () => {
	test.skip(!apply, "friends apply channel is not configured");

	test.beforeEach(async ({ page }) => {
		await page.goto("/friends/");
		// 等 client:visible 岛完成水合，否则按钮还没挂上事件
		await expect(page.locator(".friend-card").first()).toBeVisible();
	});

	test("入口按钮打开申请对话框，关闭后不留 DOM", async ({ page }) => {
		await expect(page.locator(".friend-apply-dialog")).toHaveCount(0);

		await page
			.getByRole("button", { name: i18n(I18nKey.friendsApply) })
			.click();

		const dialog = page.getByRole("dialog", {
			name: i18n(I18nKey.friendsApplyTitle),
		});
		await expect(dialog).toBeVisible();
		// 申请须知来自 friendsConfig.apply.notice（默认 $t:friendsApplyNotice）
		await expect(dialog).toContainText(
			i18n(I18nKey.friendsApplyNotice).split("\n")[0],
		);
		// 「我的站点信息」必须给出稳定公开头像地址，不能是 /@fs/ 或构建 hash
		const meAvatar = friendsConfig.apply?.me?.avatar;
		if (meAvatar) {
			await expect(dialog.locator(".friend-apply__site-body")).toContainText(
				meAvatar,
			);
		}

		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
	});

	test("非法地址阻止提交并提示错误", async ({ page }) => {
		await page
			.getByRole("button", { name: i18n(I18nKey.friendsApply) })
			.click();
		const dialog = page.getByRole("dialog");

		await dialog
			.getByLabel(i18n(I18nKey.friendsApplySiteName))
			.fill("Example Blog");
		await dialog
			.getByLabel(i18n(I18nKey.friendsApplySiteUrl))
			.fill("not a url");
		await dialog
			.getByLabel(i18n(I18nKey.friendsApplyDesc))
			.fill("A blog about things");

		await dialog
			.getByRole("button", { name: i18n(I18nKey.friendsApplyOpenGithub) })
			.click();

		await expect(
			dialog.getByText(i18n(I18nKey.friendsApplyErrUrl)),
		).toBeVisible();
		// 校验未通过时不会变成外链
		await expect(
			dialog.getByRole("link", { name: i18n(I18nKey.friendsApplyOpenGithub) }),
		).toHaveCount(0);
	});

	test("校验通过后生成预填 Issue 链接", async ({ page }) => {
		await page
			.getByRole("button", { name: i18n(I18nKey.friendsApply) })
			.click();
		const dialog = page.getByRole("dialog");

		await dialog
			.getByLabel(i18n(I18nKey.friendsApplySiteName))
			.fill("Example Blog");
		await dialog
			.getByLabel(i18n(I18nKey.friendsApplySiteUrl))
			.fill("example.com");
		await dialog
			.getByLabel(i18n(I18nKey.friendsApplyAvatar))
			.fill("https://example.com/avatar.png");
		await dialog
			.getByLabel(i18n(I18nKey.friendsApplyDesc))
			.fill("A blog about things");
		await dialog.getByLabel(i18n(I18nKey.friendsApplyTags)).fill("Blog, Tech");

		// Checkbox 的原生 input 被视觉隐藏，点可见文案（label 内）才稳定
		await dialog
			.getByText(i18n(I18nKey.friendsApplyReciprocal), { exact: true })
			.click();
		await dialog
			.getByText(i18n(I18nKey.friendsApplyOriginal), { exact: true })
			.click();
		await expect(
			dialog.getByRole("checkbox", {
				name: i18n(I18nKey.friendsApplyReciprocal),
			}),
		).toBeChecked();

		const submit = dialog.getByRole("link", {
			name: i18n(I18nKey.friendsApplyOpenGithub),
		});
		await expect(submit).toBeVisible();

		const href = await submit.getAttribute("href");
		expect(href).toBeTruthy();
		const url = new URL(href ?? "");
		expect(url.origin + url.pathname).toBe(
			`https://github.com/${apply?.repo}/issues/new`,
		);
		expect(url.searchParams.get("title")).toContain("Example Blog");
		const body = url.searchParams.get("body") ?? "";
		expect(body).toContain(
			`- ${i18n(I18nKey.friendsApplySiteName)}: Example Blog`,
		);
		// 补全协议
		expect(url.searchParams.get("body")).toContain("https://example.com/");

		// 邮件兜底：主题固定为「友链申请」，正文含联系方式
		const mail = dialog.getByRole("link", {
			name: i18n(I18nKey.friendsApplySendMail),
		});
		const mailHref = await mail.getAttribute("href");
		const mailUrl = new URL(mailHref ?? "");
		expect(mailUrl.protocol).toBe("mailto:");
		expect(decodeURIComponent(mailUrl.pathname)).toBe(apply?.email);
		expect(mailUrl.searchParams.get("subject")).toBe(
			i18n(I18nKey.friendsApplyTitle),
		);
	});
});
