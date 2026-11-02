import assert from "node:assert/strict";
import test from "node:test";
import { resolveFriendsApply } from "../src/config/friendsConfig.ts";
import {
	buildApplyBody,
	buildIssueUrl,
	buildMailtoUrl,
	buildSiteInfoText,
	normalizeSiteUrl,
	normalizeTags,
	validateFriendApply,
} from "../src/utils/friends-apply.ts";

const labels = {
	heading: "Friend link application",
	siteName: "Site name",
	siteUrl: "Site URL",
	avatar: "Avatar URL",
	desc: "Description",
	tags: "Tags",
	reciprocal: "Linked back",
	contact: "Contact",
	yes: "Yes",
	no: "No",
	empty: "Not provided",
};

const site = {
	name: "Example Blog",
	url: "https://example.com/",
	avatar: "https://example.com/avatar.png",
	desc: "A blog about things",
};

const draft = {
	title: "Example Blog",
	siteUrl: "https://example.com/",
	avatar: "https://example.com/avatar.png",
	desc: "A blog about things",
	tags: ["Blog", "Tech"],
	contact: "me@example.com",
	reciprocal: true,
	original: true,
};

test("normalizeSiteUrl 补全协议并拒绝危险地址", () => {
	assert.equal(normalizeSiteUrl("example.com"), "https://example.com/");
	assert.equal(
		normalizeSiteUrl("http://example.com/post"),
		"http://example.com/post",
	);
	assert.equal(
		normalizeSiteUrl("https://example.com/#section"),
		"https://example.com/",
	);

	assert.equal(normalizeSiteUrl(""), null);
	assert.equal(normalizeSiteUrl("javascript:alert(1)"), null);
	assert.equal(normalizeSiteUrl("localhost:4321"), null);
	assert.equal(normalizeSiteUrl("127.0.0.1"), null);
	assert.equal(normalizeSiteUrl("https://user:pass@example.com"), null);
	assert.equal(normalizeSiteUrl("ftp://example.com"), null);
	assert.equal(normalizeSiteUrl("https://example"), null);
});

test("normalizeTags 去重、去井号并限制数量", () => {
	assert.deepEqual(normalizeTags("Blog, Tech"), ["Blog", "Tech"]);
	assert.deepEqual(normalizeTags("Blog，Tech，blog"), ["Blog", "Tech"]);
	assert.deepEqual(normalizeTags("#Blog #Tech"), ["Blog", "Tech"]);
	assert.deepEqual(normalizeTags("a,b,c,d"), ["a", "b", "c"]);
	assert.deepEqual(normalizeTags("   "), []);
});

test("validateFriendApply 逐项校验", () => {
	assert.deepEqual(
		validateFriendApply(draft, { requireReciprocal: true }),
		[],
	);

	assert.deepEqual(
		validateFriendApply({ ...draft, title: "" }, { requireReciprocal: true }),
		["title"],
	);
	assert.deepEqual(
		validateFriendApply(
			{ ...draft, title: "x".repeat(41) },
			{ requireReciprocal: true },
		),
		["title"],
	);
	assert.deepEqual(
		validateFriendApply(
			{ ...draft, siteUrl: "not a url" },
			{ requireReciprocal: true },
		),
		["siteUrl"],
	);
	assert.deepEqual(
		validateFriendApply({ ...draft, avatar: "javascript:1" }, {
			requireReciprocal: true,
		}),
		["avatar"],
	);
	assert.deepEqual(
		validateFriendApply(
			{ ...draft, desc: "x".repeat(81) },
			{ requireReciprocal: true },
		),
		["desc"],
	);
	assert.deepEqual(
		validateFriendApply({ ...draft, reciprocal: false }, {
			requireReciprocal: true,
		}),
		["agree"],
	);
	// 不要求互链时，只勾「原创合规」即可通过
	assert.deepEqual(
		validateFriendApply({ ...draft, reciprocal: false }, {
			requireReciprocal: false,
		}),
		[],
	);
	assert.deepEqual(
		validateFriendApply({ ...draft, original: false }, {
			requireReciprocal: true,
		}),
		["agree"],
	);
});

test("buildApplyBody 输出结构化 Markdown，联系方式按通道取舍", () => {
	const issueBody = buildApplyBody(draft, labels, false);
	assert.match(issueBody, /^### Friend link application/m);
	assert.match(issueBody, /- Site name: Example Blog/);
	assert.match(issueBody, /- Site URL: https:\/\/example\.com\//);
	assert.match(issueBody, /- Tags: #Blog #Tech/);
	assert.match(issueBody, /- Linked back: Yes/);
	assert.ok(!issueBody.includes("me@example.com"));

	const mailBody = buildApplyBody(draft, labels, true);
	assert.match(mailBody, /- Contact: me@example\.com/);
});

test("buildApplyBody 对空字段使用占位文案", () => {
	const body = buildApplyBody(
		{ ...draft, avatar: "", tags: [] },
		labels,
		false,
	);
	assert.match(body, /- Avatar URL: Not provided/);
	assert.match(body, /- Tags: Not provided/);
});

test("buildSiteInfoText 输出可复制的本站信息", () => {
	assert.equal(
		buildSiteInfoText(site, labels),
		"- Site name: Example Blog\n- Site URL: https://example.com/\n- Avatar URL: https://example.com/avatar.png\n- Description: A blog about things",
	);
});

test("buildIssueUrl 编码标题正文并附带标签", () => {
	const url = buildIssueUrl(
		"owner/repo",
		"Friend link application: Example",
		"line1\nline2",
		["friend-link", "apply"],
	);
	assert.ok(url.startsWith("https://github.com/owner/repo/issues/new?"));
	const params = new URL(url).searchParams;
	assert.equal(params.get("title"), "Friend link application: Example");
	assert.equal(params.get("body"), "line1\nline2");
	assert.equal(params.get("labels"), "friend-link,apply");
});

test("buildIssueUrl 无标签时不写 labels 参数", () => {
	const params = new URL(
		buildIssueUrl("owner/repo", "t", "b", []),
	).searchParams;
	assert.equal(params.get("labels"), null);
});

test("buildMailtoUrl 编码主题与正文", () => {
	const url = buildMailtoUrl("me@example.com", "标题", "正文\n第二行");
	assert.ok(url.startsWith("mailto:me@example.com?"));
	const params = new URL(url).searchParams;
	assert.equal(params.get("subject"), "标题");
	assert.equal(params.get("body"), "正文\n第二行");
});

test("resolveFriendsApply 决定入口是否出现", () => {
	assert.equal(resolveFriendsApply(undefined), null);
	assert.equal(resolveFriendsApply({ enable: false }), null);
	assert.equal(resolveFriendsApply({ enable: true }), null);
	assert.equal(
		resolveFriendsApply({ enable: true, repo: "not a repo" }),
		null,
	);
	assert.equal(
		resolveFriendsApply({ enable: true, email: "not-an-email" }),
		null,
	);

	assert.deepEqual(
		resolveFriendsApply({
			enable: true,
			repo: " owner/repo ",
			email: " me@example.com ",
			labels: [" friend-link ", ""],
		}),
		{
			repo: "owner/repo",
			email: "me@example.com",
			labels: ["friend-link"],
			requireReciprocal: true,
		},
	);
	assert.equal(
		resolveFriendsApply({ enable: true, email: "me@example.com" })?.repo,
		"",
	);
});
