/**
 * 时间线页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/timelineConfig.ts 控制。
 */
import type { TimelineItem } from "@/types/timelineConfig";

export const timelineData: TimelineItem[] = [
    {
        title: "Computer Science & Cyber Security",
        date: "2020.09 – present",
        category: "education",
        subtitle: "University of Technology",
        location: "Changzhou, China",
        description:
            "Focused on computer systems, cyber security, and binary analysis.",
        highlights: [],
        tags: ["Computer Science", "Cyber Security", "PWN"],
        icon: "material-symbols:school-rounded",
    },
    {
        title: "Rebuild my blog using Shirone",
        date: "2026.10",
        category: "life",
        subtitle: "Further Step into Tech Writing",
        description:
            "Rebuilt my personal blog using Shirone, a modern static site generator, to enhance my tech writing and blogging experience.",
        tags: ["Blogging", "Writing", "Open Web"],
        icon: "material-symbols:edit-note-rounded",
    },
    {
        title: "Join the Cd1gger team",
        date: "2025.10",
        category: "work",
        subtitle: "Collaboration",
        description:
            "Joined the Cd1gger team to learn and work in PWN and collaborate with talented individuals.",
        tags: ["Team", "Collaboration", "CTF", "PWN"],
        icon: "material-symbols:group-rounded",
    },
];

/** 获取所有时间线数据列表 */
export function getTimelineList(): TimelineItem[] {
    return timelineData;
}
