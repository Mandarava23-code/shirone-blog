<script lang="ts">
import Button from "@components/atoms/action/Button.svelte";
import Chips from "@components/atoms/action/Chips.svelte";
import TextField from "@components/atoms/input/TextField.svelte";
import Dialog from "@components/atoms/overlay/Dialog.svelte";
import Checkbox from "@components/atoms/selection/Checkbox.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import {
	buildApplyBody,
	buildIssueUrl,
	buildMailtoUrl,
	buildSiteInfoText,
	type FriendApplyDraft,
	type FriendApplyField,
	type FriendApplySiteInfo,
	type FriendApplyTextLabels,
	normalizeTags,
	validateFriendApply,
} from "@utils/friends-apply";
import { prefersReducedMotion } from "@utils/motion";
import { showSnackbar } from "@utils/snackbar";
import type { ResolvedFriendsApply } from "@/config/friendsConfig";

/**
 * 友链申请对话框：收集站点信息 → 预填 GitHub Issue（主通道）/ 邮件（兜底）。
 * 纯静态站点没有服务端，所有校验与 URL 拼装都在 `utils/friends-apply` 里完成。
 * 由 FriendSection 按需动态加载；关闭时通过 onclose 交还父组件卸载。
 */
let {
	apply,
	site,
	notice,
	onclose,
}: {
	apply: ResolvedFriendsApply;
	site: FriendApplySiteInfo;
	notice: string;
	onclose: () => void;
} = $props();

let open = $state(true);

$effect(() => {
	if (!open) onclose();
});

let title = $state("");
let siteUrl = $state("");
let avatar = $state("");
let desc = $state("");
let tagText = $state("");
let contact = $state("");
let reciprocal = $state(false);
let original = $state(false);
/** 提交过一次后才显示错误，避免打开就满屏红 */
let attempted = $state(false);

const tags = $derived(normalizeTags(tagText));

const draft = $derived.by(
	(): FriendApplyDraft => ({
		title,
		siteUrl,
		avatar,
		desc,
		tags,
		contact,
		reciprocal,
		original,
	}),
);

const labels = $derived({
	heading: i18n(I18nKey.friendsApplyTitle),
	siteName: i18n(I18nKey.friendsApplySiteName),
	siteUrl: i18n(I18nKey.friendsApplySiteUrl),
	avatar: i18n(I18nKey.friendsApplyAvatar),
	desc: i18n(I18nKey.friendsApplyDesc),
	tags: i18n(I18nKey.friendsApplyTags),
	reciprocal: i18n(I18nKey.friendsApplyReciprocal),
	contact: i18n(I18nKey.friendsApplyContact),
	yes: i18n(I18nKey.friendsApplyYes),
	no: i18n(I18nKey.friendsApplyNo),
	empty: i18n(I18nKey.friendsApplyEmpty),
}) satisfies FriendApplyTextLabels;

const errors = $derived(validateFriendApply(draft, apply));
const errorSet = $derived(new Set(errors));
const canSubmit = $derived(errors.length === 0);

const issueTitle = $derived(
	`${i18n(I18nKey.friendsApplyTitle)}: ${title.trim()}`,
);

const issueUrl = $derived(
	canSubmit && apply.repo
		? buildIssueUrl(
				apply.repo,
				issueTitle,
				buildApplyBody(draft, labels, false),
				apply.labels,
			)
		: undefined,
);

const mailUrl = $derived(
	canSubmit && apply.email
		? buildMailtoUrl(
				apply.email,
				// 邮件主题固定为「友链申请」（随站点语言本地化），便于邮箱侧过滤
				i18n(I18nKey.friendsApplyTitle),
				buildApplyBody(draft, labels, true),
			)
		: undefined,
);

const mailHint = $derived(
	i18n(I18nKey.friendsApplyMailHint).replace("{email}", apply.email),
);

const siteInfoText = $derived(buildSiteInfoText(site, labels));

const tagItems = $derived(tags.map((tag) => ({ value: tag, label: tag })));

const ERROR_KEYS: Record<FriendApplyField, I18nKey> = {
	title: I18nKey.friendsApplyErrTitle,
	siteUrl: I18nKey.friendsApplyErrUrl,
	avatar: I18nKey.friendsApplyErrAvatar,
	desc: I18nKey.friendsApplyErrDesc,
	agree: I18nKey.friendsApplyErrAgree,
};

function errorFor(field: FriendApplyField): string | undefined {
	if (!attempted || !errorSet.has(field)) return undefined;
	return i18n(ERROR_KEYS[field]);
}

function firstError(): string {
	const field = errors[0];
	return field ? i18n(ERROR_KEYS[field]) : "";
}

async function copyText(value: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(value);
		showSnackbar(i18n(I18nKey.copySuccess), {
			icon: "material-symbols:check-rounded",
		});
	} catch {
		showSnackbar(i18n(I18nKey.copyFailed));
	}
}

function copySiteInfo(): void {
	void copyText(siteInfoText);
}

function copyApplication(): void {
	void copyText(buildApplyBody(draft, labels, true));
}

/** mailto 可能被系统关联到没有邮件客户端的浏览器：给一条可复制的兜底路径 */
function onMailClick(): void {
	if (!mailUrl) {
		markInvalid();
		return;
	}
	showSnackbar(mailHint, {
		icon: "material-symbols:mail-outline-rounded",
		action: {
			label: i18n(I18nKey.friendsApplyCopyBody),
			onClick: copyApplication,
		},
	});
}

function markInvalid(): void {
	attempted = true;
	if (!canSubmit) {
		showSnackbar(firstError(), {
			icon: "material-symbols:error-outline-rounded",
		});
		revealFirstError();
	}
}

/** 内容区被隐藏滚动条后，校验失败要把用户滚到出错的字段 */
function revealFirstError(): void {
	const field = errors[0];
	if (!field) return;
	const id = field === "agree" ? "friend-apply-agree" : `friend-apply-${field}`;
	document.getElementById(id)?.scrollIntoView({
		block: "center",
		behavior: prefersReducedMotion() ? "auto" : "smooth",
	});
}

function handleSubmit(event: SubmitEvent): void {
	event.preventDefault();
	attempted = true;

	if (!canSubmit) {
		showSnackbar(firstError(), {
			icon: "material-symbols:error-outline-rounded",
		});
		revealFirstError();
		return;
	}

	// Enter 键提交时 href 已就绪，但表单提交不会跟随链接，这里补一次新标签打开
	if (issueUrl) {
		window.open(issueUrl, "_blank", "noopener,noreferrer");
		open = false;
	}
}
</script>

<Dialog
	bind:open
	title={i18n(I18nKey.friendsApplyTitle)}
	class="friend-apply-dialog"
>
	<form class="friend-apply" onsubmit={handleSubmit}>
		<div class="friend-apply__body">
			<p class="friend-apply__intro">{i18n(I18nKey.friendsApplyIntro)}</p>

		{#if notice}
			<p class="friend-apply__notice">{notice}</p>
		{/if}

		<section class="friend-apply__site">
			<div class="friend-apply__site-head">
				<span>{i18n(I18nKey.friendsApplyMyInfo)}</span>
				<Button
					variant="text"
					size="xsmall"
					icon="material-symbols:content-copy-rounded"
					label={i18n(I18nKey.friendsApplyCopyInfo)}
					onclick={copySiteInfo}
				/>
			</div>
			<pre class="friend-apply__site-body">{siteInfoText}</pre>
		</section>

		<div class="friend-apply__fields">
			<TextField
				id="friend-apply-title"
				label={i18n(I18nKey.friendsApplySiteName)}
				variant="outlined"
				bind:value={title}
				error={errorFor("title")}
			/>
			<TextField
				id="friend-apply-siteUrl"
				label={i18n(I18nKey.friendsApplySiteUrl)}
				variant="outlined"
				bind:value={siteUrl}
				error={errorFor("siteUrl")}
			/>
			<TextField
				id="friend-apply-avatar"
				label={i18n(I18nKey.friendsApplyAvatar)}
				variant="outlined"
				bind:value={avatar}
				error={errorFor("avatar")}
			/>
			<TextField
				id="friend-apply-desc"
				label={i18n(I18nKey.friendsApplyDesc)}
				variant="outlined"
				bind:value={desc}
				error={errorFor("desc")}
			/>

			<div class="friend-apply__tags friend-apply__wide">
				<TextField
					label={i18n(I18nKey.friendsApplyTags)}
					variant="outlined"
					bind:value={tagText}
				/>
				<span class="friend-apply__hint">
					{i18n(I18nKey.friendsApplyTagsHint)}
				</span>
				{#if tagItems.length > 0}
					<Chips items={tagItems} variant="assist" />
				{/if}
			</div>

			<div class="friend-apply__wide">
				<TextField
					label={i18n(I18nKey.friendsApplyContact)}
					variant="outlined"
					bind:value={contact}
				/>
			</div>
		</div>

		<div class="friend-apply__agree" id="friend-apply-agree">
			{#if apply.requireReciprocal}
				<Checkbox
					bind:checked={reciprocal}
					label={i18n(I18nKey.friendsApplyReciprocal)}
				/>
			{/if}
			<Checkbox
				bind:checked={original}
				label={i18n(I18nKey.friendsApplyOriginal)}
			/>
			{#if errorFor("agree")}
				<p class="friend-apply__error" role="alert">{errorFor("agree")}</p>
			{/if}
		</div>

		</div>

		<div class="friend-apply__footer">
			<p class="friend-apply__submit-hint">
				{i18n(I18nKey.friendsApplySubmitHint)}
			</p>
			<div class="friend-apply__actions">
				{#if apply.repo}
					<Button
						type="submit"
						variant="filled"
						icon="fa7-brands:github"
						label={i18n(I18nKey.friendsApplyOpenGithub)}
						href={issueUrl}
						target="_blank"
						rel="noopener noreferrer"
					/>
				{/if}
				{#if apply.email}
					<Button
						variant="tonal"
						icon="material-symbols:mail-outline-rounded"
						label={i18n(I18nKey.friendsApplySendMail)}
						href={mailUrl}
						onclick={onMailClick}
					/>
				{/if}
				<Button
					variant="text"
					icon="material-symbols:content-copy-rounded"
					label={i18n(I18nKey.friendsApplyCopyBody)}
					onclick={copyApplication}
				/>
			</div>
		</div>
	</form>
</Dialog>

<style lang="stylus">
:global(.friend-apply-dialog)
	display: flex
	flex-direction: column
	width: min(calc(100vw - 3rem), 40rem)
	/* Stylus 的 min() 会把 92vh/54rem 当数字比较，必须用 unquote 保留 CSS 函数 */
	max-height: unquote("min(92vh, 54rem)")
	/* overflow: clip 而不是 hidden：hidden 仍可被焦点滚动，勾选复选框时
	   浏览器会把隐藏 input 滚进视野，把整个对话框顶上去、标题消失 */
	overflow: hidden
	overflow: clip

/* 对话框只负责定高，滚动交给表单，避免内外两层滚动条 */
:global(.friend-apply-dialog .m3-dialog__header)
	flex: none

:global(.friend-apply-dialog .m3-dialog__content)
	display: flex
	flex-direction: column
	flex: 1 1 auto
	min-height: 0
	overflow: hidden

.friend-apply
	display: flex
	flex-direction: column
	gap: 0.75rem
	min-height: 0
	overflow: hidden

	/* 只有内容区滚动，操作区固定在底部，不会出现滑到底一片空白 */
	&__body
		display: flex
		flex-direction: column
		gap: 1rem
		min-height: 0
		/* 视口高度扣掉标题栏、内边距与底部操作区，避免对话框自身再产生滚动；
		   极矮视口下保底 8rem，防止算出负值 */
		max-height: unquote("max(8rem, calc(92vh - 16rem))")
		overflow-y: auto
		overscroll-behavior: contain
		/* 隐藏原生滚动条，避免和站内圆角容器割裂 */
		scrollbar-width: none
		&::-webkit-scrollbar
			display: none

	&__intro
		margin: 0
		color: var(--on-surface-variant)

	&__notice
		margin: 0
		padding: 0.75rem 1rem
		border-radius: var(--shape-corner-m)
		background: var(--surface-container)
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.6
		white-space: pre-line

	&__site
		padding: 0.75rem 1rem
		border-radius: var(--shape-corner-m)
		background: var(--surface-container)
		border: 1px solid var(--outline-variant)

	&__site-head
		display: flex
		align-items: center
		justify-content: space-between
		gap: 0.5rem
		color: var(--on-surface)
		font: var(--m3e-type-title-small)

	&__site-body
		margin: 0.5rem 0 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		line-height: 1.6
		white-space: pre-wrap
		word-break: break-all

	&__fields
		display: grid
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 0.75rem 1rem

	@media (max-width: 30rem)
		&__fields
			grid-template-columns: 1fr

	&__wide
		grid-column: 1 / -1

	&__tags
		display: flex
		flex-direction: column
		gap: 0.5rem

	&__hint
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)

	&__agree
		display: flex
		flex-direction: column
		gap: 0.5rem

	&__error
		margin: 0
		color: var(--error)
		font: var(--m3e-type-body-small)

	&__submit-hint
		margin: 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)

	&__footer
		flex: none
		display: flex
		flex-direction: column
		gap: 0.75rem
		padding-top: 0.75rem
		border-top: 1px solid var(--outline-variant)

	&__actions
		display: flex
		flex-wrap: wrap
		justify-content: flex-end
		gap: 0.5rem
</style>
