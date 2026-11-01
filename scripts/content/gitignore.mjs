/**
 * 内容仓自身 git 忽略规则（`.gitignore` / `.git/info/exclude`，含嵌套文件）。
 *
 * 物化与状态检查都是直接遍历内容仓工作区，git 忽略不会自动生效：
 * 被忽略的笔记一旦进入 `src/content/**`，就会触发 Astro 的 schema 校验错误。
 * 这里复用 git 自己的判定，供 `sync.mjs` 与 `status.mjs` 共用同一份语义。
 *
 * 约定：
 * - 只采纳内容仓内部的规则；仓库外的全局 `excludesFile` 不参与，避免误杀正文；
 * - 已被 git 跟踪的文件永远不会被判定为忽略（`git check-ignore` 默认行为），
 *   因此强制 `git add -f` 的内容仍然参与物化；
 * - 内容源是普通目录（没有 git）或 git 不可用时返回空集，行为与引入本模块前一致。
 *
 * 契约见 `docs/content-separation/README.md`「物化与 `.gitignore`」。
 */

import { execFileSync } from "node:child_process";
import { isAbsolute } from "node:path";

function isInsideWorkTree(sourceRoot) {
	try {
		const output = execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
			cwd: sourceRoot,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
		}).trim();
		return output === "true";
	} catch {
		// 普通本地目录同样是受支持的内容源：没有 git 就没有忽略语义。
		return false;
	}
}

/**
 * @param {string} sourceRoot 内容仓工作区根目录
 * @param {string} sourceDir 挂载点目录名（如 `content`）
 * @param {readonly string[]} relativePaths 挂载点内的相对路径（`/` 分隔）
 * @returns {Set<string>} 被忽略的 `<sourceDir>/<相对路径>` 集合
 */
export function collectGitIgnoredPaths(sourceRoot, sourceDir, relativePaths) {
	if (relativePaths.length === 0) return new Set();
	if (!isInsideWorkTree(sourceRoot)) return new Set();

	const repoRelativePaths = relativePaths.map(
		(relativePath) => `${sourceDir}/${relativePath}`,
	);

	let output = "";
	try {
		output = execFileSync("git", ["check-ignore", "-z", "-v", "--stdin"], {
			cwd: sourceRoot,
			input: repoRelativePaths.join("\0"),
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
			env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
		});
	} catch (error) {
		// 没有被忽略的路径时 git 以 1 退出；其他失败同样按「不忽略」处理，不能阻塞构建。
		output = typeof error.stdout === "string" ? error.stdout : "";
	}

	const fields = output.split("\0");
	const ignored = new Set();
	// `-v -z` 每条命中输出四段：规则来源文件、行号、规则、路径。
	for (let index = 0; index + 3 < fields.length; index += 4) {
		const source = fields[index];
		const pathname = fields[index + 3];
		if (!source || !pathname) continue;
		// 仓库外（如用户全局 excludesFile）的规则不参与物化判定。
		if (isAbsolute(source)) continue;
		ignored.add(pathname);
	}
	return ignored;
}
