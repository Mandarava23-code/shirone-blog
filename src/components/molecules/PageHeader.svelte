<script lang="ts">
/**
 * 页内大标题（可复用）：装饰图标 + 标题 + 可选副标题。
 * 前置装饰：大号 primary 线性图标直接置于标题前，无容器、无额外装饰，
 * 与站内线性图标语言统一。
 */
import Icon from "@iconify/svelte";

let {
	title = "",
	subtitle = "",
	icon = "",
	actions,
	class: className = "",
}: {
	title: string;
	subtitle?: string;
	/** 标题左侧装饰图标（Iconify 名） */
	icon?: string;
	/** 标题行右侧动作区（如页面级主操作按钮） */
	actions?: import("svelte").Snippet;
	class?: string;
} = $props();
</script>

<div class="page-header {className}">
	<div class="page-header__main">
		<div class="page-header__title-row">
			{#if icon}
				<span class="page-header__icon" aria-hidden="true">
					<Icon {icon} />
				</span>
			{/if}
			<h1 class="page-header__title">{title}</h1>
		</div>
		{#if subtitle}
			<p class="page-header__subtitle">{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="page-header__actions">{@render actions()}</div>
	{/if}
</div>

<style lang="stylus">
.page-header
	display: flex
	align-items: flex-start
	justify-content: space-between
	gap: 1rem
	margin-bottom: 1.5rem

	&__main
		min-width: 0

	&__actions
		display: flex
		flex-shrink: 0
		align-items: center
		padding-top: 0.25rem

	&__title-row
		display: flex
		align-items: center
		gap: 0.75rem

	&__icon
		display: inline-flex
		flex-shrink: 0
		color: var(--primary)
		> :global(svg)
			width: 2rem
			height: 2rem

	&__title
		margin: 0
		color: var(--on-surface)
		font: var(--m3e-type-headline-medium)
		font-weight: 700
		line-height: 1.2

	&__subtitle
		margin: 0.375rem 0 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-medium)
		line-height: 1.5
</style>
