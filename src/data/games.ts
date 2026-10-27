/**
 * 游戏展示页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/gamesConfig.ts 控制。
 *
 * 封面支持三种写法：
 * - src/assets 相对路径（如本文件所用，走 Astro 图片管线自动优化为 webp/avif）；
 * - /public 绝对路径（如 "/assets/games/xxx.webp"，原样输出）；
 * - 远程 URL（https://…）。
 *
 * 注：以下为演示条目——评分 / 时长 / 状态是占位数值，请按自己的实际情况调整；
 * 封面取自各游戏官方商店页或官网主视觉。
 */
import type { GameItem } from "@/types/gamesConfig";

export const gamesData: GameItem[] = [
    {
        id: "Deep Rock Galactic",
        name: "深岩银河",
        developer: "Ghost Ship Games",
        category: "co-op PvE shooter",
        status: "playing",
        cover: "assets/games/Deep-Rock-Galactic.jpg",
        icon: "material-symbols:explore-outline-rounded",
        rating: 4.8,
        hours: 1100,
        platform: "PC",
        year: "2020",
        tags: ["FPS", "co-op", "PVE"],
        description:
            "A cooperative first-person shooter where you and your team of dwarves mine precious resources from dangerous alien planets. Fight off hordes of hostile creatures while exploring procedurally generated caves.",
        link: "https://store.steampowered.com/app/548430",
        featured: true,
    },
    {
        id: "minecraft",
        name: "Minecraft",
        developer: "Mojang Studios",
        category: "sandbox",
        status: "playing",
        cover: "assets/games/minecraft-hero.jpg",
        icon: "material-symbols:widgets-rounded",
        rating: 5,
        platform: "PC",
        year: "2011",
        tags: ["Sandbox", "Survival", "Building"],
        description:
            "A blocky sandbox where you mine, craft and build across procedurally generated worlds. Survive the night, or just keep building — alone or with friends.",
        link: "https://www.minecraft.net/",
        featured: true,
    },
    {
        id: "Slay the Spire 2",
        name: "Slay the Spire 2",
        developer: "Mega Crit",
        category: "deck-building roguelike",
        status: "playing",
        cover: "assets/games/slay-the-spire-2.jpg",
        icon: "material-symbols:deck-rounded",
        rating: 4.0,
        hours: 320,
        platform: "PC",
        year: "2026",
        tags: ["Deck-building", "Roguelike", "Strategy"],
        description:
            "Slay the Spire 2 is a deck-building roguelike where you climb a mysterious spire, battling enemies and bosses while collecting cards to build your ultimate deck. Each run is unique, with new challenges and strategies to explore.",
        link: "https://store.steampowered.com/app/2868840",
        featured: false,
    },
    {
        id: "GTFO",
        name: "GTFO",
        developer: "10 Chambers",
        category: "co-op PvE shooter",
        status: "playing",
        cover: "assets/games/gtfo.jpg",
        icon: "material-symbols:explore-outline-rounded",
        rating: 4.2,
        hours: 100,
        platform: "PC",
        year: "2019",
        tags: ["FPS", "co-op", "PVE"],
        description:
            "GTFO is a hardcore cooperative first-person shooter where you and your team of prisoners must explore a terrifying underground complex filled with deadly creatures. Work together to complete objectives and survive the horrors that lurk in the shadows.",
        link: "https://store.steampowered.com/app/493520",
        featured: false,
    },
];
