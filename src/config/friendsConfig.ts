import type {
	FriendsApplyConfig,
	FriendsConfig,
} from "../types/friendsConfig.ts";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 解析并校验友链申请配置。未启用、缺少通道或参数非法时返回 null，
 * 消费方据此完全不渲染入口（零额外负担）。
 *
 * repo 必须形如 "owner/repo"：拼进 `https://github.com/<repo>/issues/new`，
 * 放任任意字符串会变成可注入的外链。
 */
export interface ResolvedFriendsApply {
	repo: string;
	email: string;
	labels: string[];
	requireReciprocal: boolean;
}

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveFriendsApply(
	config: FriendsApplyConfig | undefined,
): ResolvedFriendsApply | null {
	if (!config?.enable) {
		return null;
	}

	const repo = config.repo?.trim() ?? "";
	const email = config.email?.trim() ?? "";
	if (!repo && !email) {
		return null;
	}
	if (repo && !REPO_PATTERN.test(repo)) {
		return null;
	}
	if (email && !EMAIL_PATTERN.test(email)) {
		return null;
	}

	return {
		repo,
		email,
		labels: (config.labels ?? []).map((label) => label.trim()).filter(Boolean),
		requireReciprocal: config.requireReciprocal ?? true,
	};
}

export const friendsConfig: FriendsConfig = withUserConfig("friends", {
	enable: true,
	title: "$t:friends",
	description: "欢迎交换友链，期待与您相遇！",
	apply: {
		// 静态站点没有服务端：申请经预填 Issue / 邮件送出，审核后手动写入 src/data/friends.ts。
		// repo 与 email 都留空时入口不渲染；配一个即可开启。
		enable: true,
		repo: "Mandarava23-code/blog-friend-links",
		email: "c60253258@163.com",
		labels: ["friend-link"],
		requireReciprocal: true,
		notice: "$t:friendsApplyNotice",
		// 「我的站点信息」卡片：头像用图床上的稳定地址（构建产物带 hash，重建后会失效）
		me: {
			avatar: "https://img.mandarava23.top/file/1793630543876_avatar.webp",
		},
	},
});
