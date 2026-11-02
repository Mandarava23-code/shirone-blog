import type { PageMeta } from "./pageMeta.ts";

/**
 * 友链申请通道配置。
 *
 * 静态站点没有服务端，申请通过「预填 GitHub Issue」或「邮件」送出，
 * 审核通过后仍由站长手动写入 `src/data/friends.ts`。
 * `enable: false`（默认）时不渲染入口按钮与对话框，零请求、零 DOM。
 */
export interface FriendsApplyConfig {
	/** 申请通道总开关，默认 false */
	enable?: boolean;
	/** 接收申请的公开仓库，"owner/repo"；留空则只提供邮件通道 */
	repo?: string;
	/** 兜底邮箱；留空则只提供 GitHub 通道。与 repo 至少配置一个，否则入口不渲染 */
	email?: string;
	/** Issue 标签（需在仓库中已存在；对无写权限的申请者会被 GitHub 忽略） */
	labels?: string[];
	/** 是否要求申请者先添加本站友链（表单中必须勾选） */
	requireReciprocal?: boolean;
	/** 申请须知：字面量，或 "$t:<i18nKey>" 引用内置词条 */
	notice?: string;
	/** 覆盖「我的站点信息」卡片（默认取 siteConfig / profileConfig） */
	me?: FriendsApplySiteOverride;
}

/**
 * 「我的站点信息」卡片覆盖项。
 * 头像必须是**稳定的公开 URL**：构建产物带 hash，重建后旧链接会失效，
 * 而友链头像需要长期可访问，所以默认回退到 public 下的 favicon。
 */
export interface FriendsApplySiteOverride {
	name?: string;
	url?: string;
	avatar?: string;
	desc?: string;
}

export interface FriendsConfig extends PageMeta {
	apply?: FriendsApplyConfig;
}
