import type { AnnouncementConfig } from "@/types/announcementConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 公告栏配置
 * 组件显示由 sidebarConfig 统一控制
 */
export const announcementConfig: AnnouncementConfig = withUserConfig(
    "announcement",
    {
        title: "待办", // 公告标题，填空使用 i18n 字符串 Key.announcement
        content:
            "1.安装libc-searcher<br/>2.剩余文章信息补全<br/>3.制作友链申请功能", // 公告内容
        closable: true, // 允许用户关闭公告
        link: {
            enable: true, // 启用链接
            text: "GitHub", // 链接文本
            url: "https://github.com/Mandarava23-code/shirone-blog", // 链接 URL
            external: true, // 外部链接
        },
    },
);
