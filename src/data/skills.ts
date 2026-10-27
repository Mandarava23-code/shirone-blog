/**
 * 技能页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/skillsConfig.ts 控制。
 */
import type { SkillItem } from "@/types/skillsConfig";

export const skillsData: SkillItem[] = [
    {
        name: "Python",
        description: "Scripting, data wrangling, and service automation.",
        icon: "simple-icons:python",
        category: "backend",
        level: "beginner",
    },
    {
        name: "Assembly",
        description:
            "Low-level programming for performance-critical applications.",
        icon: "simple-icons:assemblyscript",
        category: "backend",
        level: "advanced",
    },
    {
        name: "C",
        description: "Low-level systems work close to the runtime.",
        icon: "simple-icons:c",
        category: "backend",
        level: "intermediate",
    },
];

/** 获取所有技能数据列表 */
export function getSkillsList(): SkillItem[] {
    return skillsData;
}
