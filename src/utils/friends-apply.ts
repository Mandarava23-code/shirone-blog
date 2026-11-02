/**
 * 友链申请纯函数层：URL 归一化、表单校验、Issue / 邮件 / 复制文本拼装。
 *
 * 与组件解耦的原因：这些逻辑要能单测，且不允许在 Svelte 组件里零散拼字符串
 * （编码、长度、协议白名单都容易漏）。所有用户可见文案由调用方以 labels 传入，
 * 本模块不直接依赖 i18n。
 */

/** 表单字段标识；校验失败时组件据此映射本地化错误文案 */
export type FriendApplyField =
	| "title"
	| "siteUrl"
	| "avatar"
	| "desc"
	| "agree";

export interface FriendApplyDraft {
	title: string;
	siteUrl: string;
	avatar: string;
	desc: string;
	tags: string[];
	contact: string;
	/** 已添加本站友链 */
	reciprocal: boolean;
	/** 内容原创且合规 */
	original: boolean;
}

export interface FriendApplyRules {
	requireReciprocal: boolean;
}

export interface FriendApplySiteInfo {
	name: string;
	url: string;
	avatar: string;
	desc: string;
}

/** 文案由调用方从 i18n 注入，保证 10 个语言包同一套占位语义 */
export interface FriendApplyTextLabels {
	heading: string;
	siteName: string;
	siteUrl: string;
	avatar: string;
	desc: string;
	tags: string;
	reciprocal: string;
	contact: string;
	yes: string;
	no: string;
	empty: string;
}

export const FRIEND_APPLY_TITLE_MAX: number = 40;
export const FRIEND_APPLY_DESC_MAX: number = 80;
export const FRIEND_APPLY_TAGS_MAX: number = 3;

const HOST_WITH_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * 归一化站点地址：补 https://、拒绝非 http(s)、拒绝 localhost / 内网风格主机名。
 * 返回规范化后的 URL，无法接受时返回 null。
 */
export function normalizeSiteUrl(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const candidate = HOST_WITH_SCHEME.test(trimmed)
		? trimmed
		: `https://${trimmed}`;

	let url: URL;
	try {
		url = new URL(candidate);
	} catch {
		return null;
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") return null;
	if (url.username || url.password) return null;

	const host = url.hostname.toLowerCase();
	if (!host.includes(".") || host.endsWith(".")) return null;
	if (host === "localhost" || host.endsWith(".localhost")) return null;
	if (IPV4_HOST.test(host)) return null;

	url.hash = "";
	return url.toString();
}

/** 解析逗号/空格分隔的标签文本，去重、去 #、限长 */
export function normalizeTags(input: string[] | string): string[] {
	const parts = (Array.isArray(input) ? input : input.split(/[,，\s]+/))
		.map((part) => part.trim().replace(/^#+/, ""))
		.filter(Boolean);

	const seen = new Set<string>();
	const tags: string[] = [];
	for (const tag of parts) {
		const key = tag.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		tags.push(tag.slice(0, 24));
		if (tags.length >= FRIEND_APPLY_TAGS_MAX) break;
	}
	return tags;
}

/** 返回所有未通过校验的字段（空数组表示可以提交） */
export function validateFriendApply(
	draft: FriendApplyDraft,
	rules: FriendApplyRules,
): FriendApplyField[] {
	const errors: FriendApplyField[] = [];

	const title = draft.title.trim();
	if (title.length === 0 || title.length > FRIEND_APPLY_TITLE_MAX) {
		errors.push("title");
	}

	if (!normalizeSiteUrl(draft.siteUrl)) {
		errors.push("siteUrl");
	}

	const avatar = draft.avatar.trim();
	if (avatar && !normalizeSiteUrl(avatar)) {
		errors.push("avatar");
	}

	const desc = draft.desc.trim();
	if (desc.length === 0 || desc.length > FRIEND_APPLY_DESC_MAX) {
		errors.push("desc");
	}

	const needsReciprocal = rules.requireReciprocal && !draft.reciprocal;
	if (needsReciprocal || !draft.original) {
		errors.push("agree");
	}

	return errors;
}

/** 组装 Markdown 正文；GitHub Issue 与邮件共用（邮件不写联系方式以外的差异） */
export function buildApplyBody(
	draft: FriendApplyDraft,
	labels: FriendApplyTextLabels,
	includeContact: boolean,
): string {
	const url = normalizeSiteUrl(draft.siteUrl) ?? draft.siteUrl.trim();
	const tags =
		draft.tags.length > 0
			? draft.tags.map((tag) => `#${tag}`).join(" ")
			: labels.empty;

	const lines: string[] = [
		`### ${labels.heading}`,
		"",
		`- ${labels.siteName}: ${draft.title.trim()}`,
		`- ${labels.siteUrl}: ${url}`,
		`- ${labels.avatar}: ${draft.avatar.trim() || labels.empty}`,
		`- ${labels.desc}: ${draft.desc.trim()}`,
		`- ${labels.tags}: ${tags}`,
		`- ${labels.reciprocal}: ${draft.reciprocal ? labels.yes : labels.no}`,
	];

	const contact = draft.contact.trim();
	if (includeContact && contact) {
		lines.push(`- ${labels.contact}: ${contact}`);
	}

	return lines.join("\n");
}

/** 我的站点信息文本，供申请者复制到自己站点 */
export function buildSiteInfoText(
	site: FriendApplySiteInfo,
	labels: FriendApplyTextLabels,
): string {
	return [
		`- ${labels.siteName}: ${site.name}`,
		`- ${labels.siteUrl}: ${site.url}`,
		`- ${labels.avatar}: ${site.avatar || labels.empty}`,
		`- ${labels.desc}: ${site.desc || labels.empty}`,
	].join("\n");
}

/** 预填 GitHub 新建 Issue 的地址；repo 必须是 "owner/repo" */
export function buildIssueUrl(
	repo: string,
	title: string,
	body: string,
	labels: string[],
): string {
	const params = new URLSearchParams({ title, body });
	if (labels.length > 0) {
		params.set("labels", labels.join(","));
	}
	return `https://github.com/${repo}/issues/new?${params.toString()}`;
}

/** mailto 兜底通道 */
export function buildMailtoUrl(
	email: string,
	subject: string,
	body: string,
): string {
	const params = new URLSearchParams({ subject, body });
	return `mailto:${email}?${params.toString()}`;
}
