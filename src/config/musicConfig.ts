import { musicTracks } from "../data/music.ts";
import type {
    MetingMusicConfig,
    MusicConfig,
    MusicProvider,
    PlaybackMode,
    TrackDescriptor,
} from "../types/musicConfig.ts";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 侧栏音乐配置单一真源。
 * 遵循「零额外负担」原则：禁用时不产生任何网络请求与额外 DOM。
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 【四种工作模式（Provider）使用指南】
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. "local"（本地独立模式，默认）：
 *    - 数据源：src/data/music.ts
 *    - 特点：零外部 API 依赖，首屏毫秒级就绪，静态打包直出，断网也能正常播放。
 *    - 示例：
 *      provider: "local"
 *
 * 2. "custom"（自定义列表模式）：
 *    - 数据源：直接在 tracks 字段显式传入曲目数组（支持外链音频与封面）
 *    - 特点：灵活自定义，无需修改通用数据文件。
 *    - 示例：
 *      provider: "custom",
 *      tracks: [
 *        { id: "song-1", title: "Song", artist: "Artist", source: "https://.../a.mp3", cover: "https://.../c.jpg" }
 *      ]
 *
 * 3. "meting"（云端歌单模式）：
 *    - 数据源：Meting API 远端歌单（网易云 / QQ音乐 / 酷狗等）
 *    - 特点：客户端异步按需拉取，海量曲库与封面自动解析。
 *    - 可选 `preload: "metadata"`：组件进入视口即预取歌单元数据（不含音频流），
 *      首屏直接显示第一首曲目；默认 "none"（不预取，交互后才请求）。
 *    - 示例：
 *      provider: "meting",
 *      meting: { server: "netease", type: "playlist", id: "14164869977" }
 *
 * 4. "mixed"（混合增强模式，推荐）：
 *    - 数据源：本地曲目（src/data/music.ts）+ Meting API 远端歌单自动合并
 *    - 特点：首屏立即可播本地音乐，后台无感拉取远端歌单并在就绪后无缝扩容；
 *            若遇断网或云端接口故障，自动静默降级为本地曲目播放，绝不报红破版。
 *    - 示例：
 *      provider: "mixed",
 *      meting: { server: "netease", type: "playlist", id: "14164869977" }
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const musicConfig: MusicConfig = withUserConfig("music", {
    enable: true,
    provider: "mixed",
    tracks: [
        {
            id: "luna-ignition",
            title: "イグニッション",
            artist: "*Luna, ゆある, ねんね",
            cover: "/assets/music/cover/luna-ignition.webp",
            source: "/assets/music/url/＊Luna,ゆある,ねんね - イグニッション.mp3",
            duration: 215,
        },
        {
            id: "aimer-ref-rain",
            title: "Ref:rain",
            artist: "Aimer",
            cover: "/assets/music/cover/aimer-ref-rain.webp",
            source: "/assets/music/url/Aimer - Ref：rain.mp3",
            duration: 290,
        },
        {
            id: "aimer-kataomoi",
            title: "カタオモイ",
            artist: "Aimer",
            cover: "/assets/music/cover/aimer-kataomoi.webp",
            source: "/assets/music/url/Aimer - カタオモイ.mp3",
            duration: 208,
        },
        {
            id: "ayane-gomenne",
            title: "ごめんね",
            artist: "AYANE",
            cover: "/assets/music/cover/ayane-gomenne.webp",
            source: "/assets/music/url/AYANE - ごめんね.mp3",
            duration: 176,
        },
        {
            id: "ciel-kuuchuu-sanpo",
            title: "空中散歩",
            artist: "CIEL",
            cover: "/assets/music/cover/ciel-kuuchuu-sanpo.webp",
            source: "/assets/music/url/CIEL - 空中散歩.mp3",
            duration: 162,
        },
        {
            id: "claris-hitorigoto",
            title: "ヒトリゴト",
            artist: "ClariS",
            cover: "/assets/music/cover/claris-hitorigoto.webp",
            source: "/assets/music/url/ClariS - ヒトリゴト.mp3",
            duration: 233,
        },
        {
            id: "noriken-dream-away",
            title: "Dream Away (feat. Yukacco)",
            artist: "DJ Noriken, DJ Genki, Yukacco",
            cover: "/assets/music/cover/noriken-dream-away.webp",
            source: "/assets/music/url/DJ Noriken,DJ Genki,Yukacco - Dream Away (feat. Yukacco).mp3",
            duration: 235,
        },
        {
            id: "f777-airborne-robots",
            title: "Airborne Robots",
            artist: "F-777",
            cover: "/assets/music/cover/f777-airborne-robots.webp",
            source: "/assets/music/url/F-777 - Airborne Robots.mp3",
            duration: 271,
        },
        {
            id: "guiano-iichatta",
            title: "言っちゃいけないことばっか浮かぶよな",
            artist: "Guiano, 理芽",
            cover: "/assets/music/cover/guiano-iichatta.webp",
            source: "/assets/music/url/Guiano,理芽 - 言っちゃいけないことばっか浮かぶよな.mp3",
            duration: 201,
        },
        {
            id: "r906-sajinoro",
            title: "匙ノ咒 (feat. 初音ミク)",
            artist: "r-906, 初音ミク",
            cover: "/assets/music/cover/r906-sajinoro.webp",
            source: "/assets/music/url/r-906,初音ミク - 匙ノ咒 (feat. 初音ミク).mp3",
            duration: 269,
        },
        {
            id: "rj-pasin-sample-this",
            title: "Sample this",
            artist: "RJ Pasin",
            cover: "/assets/music/cover/rj-pasin-sample-this.webp",
            source: "/assets/music/url/RJ Pasin - Sample this.mp3",
            duration: 102,
        },
        {
            id: "sasakure-kumonoito",
            title: "蜘蛛糸モノポリー",
            artist: "sasakure.UK, 初音ミク",
            cover: "/assets/music/cover/sasakure-kumonoito.webp",
            source: "/assets/music/url/sasakure.UK,初音ミク - 蜘蛛糸モノポリー.mp3",
            duration: 275,
        },
        {
            id: "tak-numb-numb",
            title: "numb numb (feat. Hatsune Miku, Kasane Teto)",
            artist: "TAK, 初音ミク, 重音テト",
            cover: "/assets/music/cover/tak-numb-numb.webp",
            source: "/assets/music/url/TAK,初音ミク,重音テト - numb numb (feat. Hatsune Miku, Kasane Teto).mp3",
            duration: 167,
        },
        {
            id: "vaundy-tokyo-flash",
            title: "東京フラッシュ",
            artist: "Vaundy",
            cover: "/assets/music/cover/vaundy-tokyo-flash.webp",
            source: "/assets/music/url/Vaundy - 東京フラッシュ.mp3",
            duration: 259,
        },
        {
            id: "zutomayo-byoushin-wo-kamu",
            title: "秒針を噛む",
            artist: "ずっと真夜中でいいのに。",
            cover: "/assets/music/cover/zutomayo-byoushin-wo-kamu.webp",
            source: "/assets/music/url/ずっと真夜中でいいのに。 - 秒針を噛む.mp3",
            duration: 259,
        },
        {
            id: "nanatsukaze-saisei",
            title: "再生",
            artist: "ナナツカゼ, PIKASONIC, なこたんまる",
            cover: "/assets/music/cover/nanatsukaze-saisei.webp",
            source: "/assets/music/url/ナナツカゼ,PIKASONIC,なこたんまる - 再生.mp3",
            duration: 161,
        },
        {
            id: "hatena-unmei-no-furi",
            title: "運命のふりをして",
            artist: "はてなぷれいりすと, nyamura",
            cover: "/assets/music/cover/hatena-unmei-no-furi.webp",
            source: "/assets/music/url/はてなぷれいりすと,nyamura - 運命のふりをして.mp3",
            duration: 181,
        },
        {
            id: "policepikadery-cyan-blue",
            title: "シアンブルー (feat. 初音ミク)",
            artist: "ポリスピカデリー, 初音ミク",
            cover: "/assets/music/cover/policepikadery-cyan-blue.webp",
            source: "/assets/music/url/ポリスピカデリー,初音ミク - シアンブルー (feat. 初音ミク).mp3",
            duration: 175,
        },
        {
            id: "mary-alice-in-reitouko",
            title: "Alice in 冷凍庫",
            artist: "めありー, Orangestar",
            cover: "/assets/music/cover/mary-alice-in-reitouko.webp",
            source: "/assets/music/url/めありー,Orangestar - Alice in 冷凍庫.mp3",
            duration: 342,
        },
        {
            id: "yorushika-rubato",
            title: "ルバート",
            artist: "ヨルシカ",
            cover: "/assets/music/cover/yorushika-rubato.webp",
            source: "/assets/music/url/ヨルシカ - ルバート.mp3",
            duration: 231,
        },
        {
            id: "abuse-shinainaru",
            title: "親愛なるあなたは火葬",
            artist: "虻瀬",
            cover: "/assets/music/cover/abuse-shinainaru.webp",
            source: "/assets/music/url/虻瀬 - 親愛なるあなたは火葬.mp3",
            duration: 257,
        },
        {
            id: "utada-come-back-to-me",
            title: "Come Back To Me",
            artist: "宇多田ヒカル",
            cover: "/assets/music/cover/utada-come-back-to-me.webp",
            source: "/assets/music/url/宇多田ヒカル - Come Back To Me.mp3",
            duration: 238,
        },
        {
            id: "kubo-minase-more-one-night",
            title: "More One Night",
            artist: "久保ユリカ, 水瀬いのり",
            cover: "/assets/music/cover/kubo-minase-more-one-night.webp",
            source: "/assets/music/url/久保ユリカ,水瀬いのり - More One Night.mp3",
            duration: 218,
        },
        {
            id: "tsukino-dohna-dohna",
            title: "ドーナドーナのうた",
            artist: "月乃",
            cover: "/assets/music/cover/tsukino-dohna-dohna.webp",
            source: "/assets/music/url/月乃 - ドーナドーナのうた.mp3",
            duration: 235,
        },
        {
            id: "okawari-speed-of-light",
            title: "Speed of Light",
            artist: "塞壬唱片-MSR, DJ OKAWARI, 二宮愛",
            cover: "/assets/music/cover/okawari-speed-of-light.webp",
            source: "/assets/music/url/塞壬唱片-MSR,DJ OKAWARI,二宮愛 - Speed of Light.mp3",
            duration: 246,
        },
        {
            id: "songbai-jinchunwu",
            title: "浸春芜",
            artist: "塞壬唱片-MSR, 宋柏, 十音, 解伟苓",
            cover: "/assets/music/cover/songbai-jinchunwu.webp",
            source: "/assets/music/url/塞壬唱片-MSR,宋柏,十音 - 浸春芜.mp3",
            duration: 223,
        },
        {
            id: "shioreira-hare-no-hi",
            title: "ハレの日に - From THE FIRST TAKE",
            artist: "汐れいら",
            cover: "/assets/music/cover/shioreira-hare-no-hi.webp",
            source: "/assets/music/url/汐れいら - ハレの日に - From THE FIRST TAKE.mp3",
            duration: 293,
        },
        {
            id: "akari-renai-nou",
            title: "恋愛脳",
            artist: "七音阿卡莉",
            cover: "/assets/music/cover/akari-renai-nou.webp",
            source: "/assets/music/url/七音阿卡莉 - 恋愛脳.mp3",
            duration: 192,
        },
        {
            id: "rsd-teikoku-shoujo",
            title: "帝国少女",
            artist: "初音ミク, R Sound Design",
            cover: "/assets/music/cover/rsd-teikoku-shoujo.webp",
            source: "/assets/music/url/初音ミク,R Sound Design - 帝国少女.mp3",
            duration: 254,
        },
        {
            id: "hoshimachi-bibideba",
            title: "ビビデバ",
            artist: "星街すいせい",
            cover: "/assets/music/cover/hoshimachi-bibideba.webp",
            source: "/assets/music/url/星街すいせい - ビビデバ.mp3",
            duration: 165,
        },
        {
            id: "jiegewu-chunfeng",
            title: "春风十里报新年",
            artist: "接个吻，开一枪, 火鸡, 吕口口, Lambert凌杰, 杨胖雨",
            cover: "/assets/music/cover/jiegewu-chunfeng.webp",
            source: "/assets/music/url/接个吻，开一枪,火鸡,吕口口 - 春风十里报新年.mp3",
            duration: 210,
        },
        {
            id: "yanagimami-hikari-hanate",
            title: "光放て！",
            artist: "柳麻美",
            cover: "/assets/music/cover/yanagimami-hikari-hanate.webp",
            source: "/assets/music/url/柳麻美 - 光放て！.mp3",
            duration: 232,
        },
        {
            id: "suzumi-ao-no-onkai",
            title: "蒼の音階",
            artist: "涼海ネモ",
            cover: "/assets/music/cover/suzumi-ao-no-onkai.webp",
            source: "/assets/music/url/涼海ネモ - 蒼の音階.mp3",
            duration: 152,
        },
        {
            id: "natsume-kitsuneame",
            title: "狐雨",
            artist: "棗いつき",
            cover: "/assets/music/cover/natsume-kitsuneame.webp",
            source: "/assets/music/url/棗いつき - 狐雨.mp3",
            duration: 210,
        },
        {
            id: "touyama-yokatta",
            title: "よかった。",
            artist: "當山みれい",
            cover: "/assets/music/cover/touyama-yokatta.webp",
            source: "/assets/music/url/當山みれい - よかった。.mp3",
            duration: 263,
        },
    ],
    // meting: {
    //     server: "netease",
    //     type: "playlist",
    //     id: "14164869977",
    //     // 进入视口时预取歌单元数据（仅元信息，不预取音频流）：
    //     // "metadata"（取）| "none"（默认，不取；交互后才请求，卡片显示「尚未请求」占位）
    //     preload: "none",
    // },
    defaultVolume: 0.7,
    defaultMode: "sequence",
});

export interface ResolvedMusicOptions {
    readonly provider: MusicProvider;
    readonly playlist: readonly TrackDescriptor[];
    readonly meting?: MetingMusicConfig;
    readonly defaultVolume: number;
    readonly defaultMode: PlaybackMode;
}

const ABSOLUTE_MEDIA_SOURCE = /^(?:https?:)?\/\//i;
const UNSAFE_SCHEME = /^[a-z][a-z\d+.-]*:/i;

function normalizeMediaSource(value: string): string | null {
    const source = value.trim();
    if (!source) return null;
    if (ABSOLUTE_MEDIA_SOURCE.test(source) || source.startsWith("/")) {
        return source;
    }
    if (UNSAFE_SCHEME.test(source)) return null;
    return `/${source.replace(/^\.\//, "")}`;
}

function normalizeTrack(
    track: TrackDescriptor,
    usedIds: Set<string>,
): TrackDescriptor | null {
    const id = track.id.trim();
    const title = track.title.trim();
    const source = normalizeMediaSource(track.source);
    if (!id || !title || !source || usedIds.has(id)) return null;

    usedIds.add(id);
    const artist = track.artist?.trim() || undefined;
    const cover = track.cover
        ? (normalizeMediaSource(track.cover) ?? undefined)
        : undefined;
    const duration =
        typeof track.duration === "number" &&
        Number.isFinite(track.duration) &&
        track.duration > 0
            ? track.duration
            : undefined;

    return Object.freeze({ id, title, source, artist, cover, duration });
}

export function clampMusicVolume(value: number, fallback = 0.7): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(1, Math.max(0, value));
}

/** 补齐 meting 配置的默认值（如 preload 默认 "none"），让 ResolvedMusicOptions 自包含。 */
function resolveMetingConfig(
    meting: MetingMusicConfig | undefined,
): MetingMusicConfig | undefined {
    if (!meting) return meting;
    return Object.freeze({ ...meting, preload: meting.preload ?? "none" });
}

export function resolveMusicOptions(
    config: MusicConfig,
): ResolvedMusicOptions | null {
    if (!config.enable) return null;

    const provider: MusicProvider = config.provider ?? "local";

    if (provider === "meting") {
        const id = config.meting?.id?.trim();
        if (!id) return null;
        return Object.freeze({
            provider: "meting",
            playlist: Object.freeze([]),
            meting: resolveMetingConfig(config.meting),
            defaultVolume: clampMusicVolume(config.defaultVolume),
            defaultMode: config.defaultMode,
        });
    }

    let rawTracks: readonly TrackDescriptor[] = [];
    if (provider === "local" || provider === "mixed") {
        rawTracks = config.tracks ?? musicTracks;
    } else if (provider === "custom") {
        rawTracks = config.tracks ?? [];
    }

    const usedIds = new Set<string>();
    const playlist = rawTracks
        .map((track) => normalizeTrack(track, usedIds))
        .filter((track): track is TrackDescriptor => track !== null);

    if (provider === "mixed") {
        const metingId = config.meting?.id?.trim();
        if (playlist.length === 0 && !metingId) return null;
        return Object.freeze({
            provider: "mixed",
            playlist: Object.freeze(playlist),
            meting: resolveMetingConfig(config.meting),
            defaultVolume: clampMusicVolume(config.defaultVolume),
            defaultMode: config.defaultMode,
        });
    }

    if (playlist.length === 0) return null;

    return Object.freeze({
        provider,
        playlist: Object.freeze(playlist),
        defaultVolume: clampMusicVolume(config.defaultVolume),
        defaultMode: config.defaultMode,
    });
}
