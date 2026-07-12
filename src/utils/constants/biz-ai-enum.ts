/** AI 平台枚举 */
export const AiPlatformEnum = {
  TONG_YI: 'TongYi',
  YI_YAN: 'YiYan',
  DEEP_SEEK: 'DeepSeek',
  ZHI_PU: 'ZhiPu',
  XING_HUO: 'XingHuo',
  SILICON_FLOW: 'SiliconFlow',
  OPENAI: 'OpenAI',
  OLLAMA: 'Ollama',
  STABLE_DIFFUSION: 'StableDiffusion',
  MIDJOURNEY: 'Midjourney',
  SUNO: 'Suno',
} as const

/** AI 模型类型枚举 */
export const AiModelTypeEnum = {
  CHAT: 1,
  IMAGE: 2,
  VOICE: 3,
  VIDEO: 4,
  EMBEDDING: 5,
  RERANK: 6,
} as const

/** AI 图片状态枚举 */
export const AiImageStatusEnum = {
  IN_PROGRESS: 10,
  SUCCESS: 20,
  FAIL: 30,
} as const

/** AI 音乐状态枚举 */
export const AiMusicStatusEnum = {
  IN_PROGRESS: 10,
  SUCCESS: 20,
  FAIL: 30,
} as const

/** AI 音乐生成模式枚举 */
export const MusicGenerateModeEnum = {
  DESCRIPTION: 1,
  LYRIC: 2,
} as const

export type MusicGenerateMode = typeof MusicGenerateModeEnum[keyof typeof MusicGenerateModeEnum]

/** AI 写作类型枚举 */
export enum AiWriteTypeEnum {
  WRITING = 1,
  REPLY = 2,
}

/** AI 写作表单默认选项 */
export const AiWriteDefaultOptions = {
  length: 1,
  format: 1,
  tone: 1,
  language: 1,
}

/** 图片热词 */
export const ImageHotWords = ['中国旗袍', '古装美女', '卡通头像', '机甲战士', '童话小屋', '中国长城']

/** 图片英文热词 */
export const ImageHotEnglishWords = ['Chinese Cheongsam', 'Ancient Beauty', 'Cartoon Avatar', 'Mech Warrior', 'Fairy Tale Cottage', 'The Great Wall of China']

/** 图片模型选项 */
export interface ImageModelOption {
  key: string
  name: string
}

/** 图片尺寸选项 */
export interface ImageSizeOption {
  key: string
  name?: string
  width: string
  height: string
}

/** 其它图像平台 */
export const OtherPlatformList: ImageModelOption[] = [
  { key: AiPlatformEnum.TONG_YI, name: '通义万相' },
  { key: AiPlatformEnum.YI_YAN, name: '百度千帆' },
  { key: AiPlatformEnum.ZHI_PU, name: '智谱 AI' },
  { key: AiPlatformEnum.SILICON_FLOW, name: '硅基流动' },
]

/** DALL·E 模型 */
export const Dall3Models: ImageModelOption[] = [
  { key: 'dall-e-3', name: 'DALL·E 3' },
  { key: 'dall-e-2', name: 'DALL·E 2' },
]

/** DALL·E 风格 */
export const Dall3StyleList: ImageModelOption[] = [
  { key: 'vivid', name: '清晰' },
  { key: 'natural', name: '自然' },
]

/** DALL·E 尺寸 */
export const Dall3SizeList: ImageSizeOption[] = [
  { key: '1024x1024', name: '1:1', width: '1024', height: '1024' },
  { key: '1024x1792', name: '3:5', width: '1024', height: '1792' },
  { key: '1792x1024', name: '5:3', width: '1792', height: '1024' },
]

/** Midjourney 模型 */
export const MidjourneyModels: ImageModelOption[] = [
  { key: 'midjourney', name: 'MJ' },
  { key: 'niji', name: 'NIJI' },
]

/** Midjourney 尺寸 */
export const MidjourneySizeList: ImageSizeOption[] = [
  { key: '1:1', width: '1', height: '1' },
  { key: '3:4', width: '3', height: '4' },
  { key: '4:3', width: '4', height: '3' },
  { key: '9:16', width: '9', height: '16' },
  { key: '16:9', width: '16', height: '9' },
]

/** Midjourney 版本 */
export const MidjourneyVersions = [
  { label: 'v6.0', value: '6.0' },
  { label: 'v5.2', value: '5.2' },
  { label: 'v5.1', value: '5.1' },
  { label: 'v5.0', value: '5.0' },
  { label: 'v4.0', value: '4.0' },
]

/** Niji 版本 */
export const NijiVersionList = [
  { label: 'v5', value: '5' },
]

/** Stable Diffusion 采样方法 */
export const StableDiffusionSamplers: ImageModelOption[] = [
  { key: 'DDIM', name: 'DDIM' },
  { key: 'DDPM', name: 'DDPM' },
  { key: 'K_DPMPP_2M', name: 'K_DPMPP_2M' },
  { key: 'K_DPMPP_2S_ANCESTRAL', name: 'K_DPMPP_2S_ANCESTRAL' },
  { key: 'K_DPM_2', name: 'K_DPM_2' },
  { key: 'K_DPM_2_ANCESTRAL', name: 'K_DPM_2_ANCESTRAL' },
  { key: 'K_EULER', name: 'K_EULER' },
  { key: 'K_EULER_ANCESTRAL', name: 'K_EULER_ANCESTRAL' },
  { key: 'K_HEUN', name: 'K_HEUN' },
  { key: 'K_LMS', name: 'K_LMS' },
]

/** Stable Diffusion CLIP */
export const StableDiffusionClipGuidancePresets: ImageModelOption[] = [
  { key: 'NONE', name: 'NONE' },
  { key: 'FAST_BLUE', name: 'FAST_BLUE' },
  { key: 'FAST_GREEN', name: 'FAST_GREEN' },
  { key: 'SIMPLE', name: 'SIMPLE' },
  { key: 'SLOW', name: 'SLOW' },
  { key: 'SLOWER', name: 'SLOWER' },
  { key: 'SLOWEST', name: 'SLOWEST' },
]

/** Stable Diffusion 风格 */
export const StableDiffusionStylePresets: ImageModelOption[] = [
  { key: '3d-model', name: '3d-model' },
  { key: 'analog-film', name: 'analog-film' },
  { key: 'anime', name: 'anime' },
  { key: 'cinematic', name: 'cinematic' },
  { key: 'comic-book', name: 'comic-book' },
  { key: 'digital-art', name: 'digital-art' },
  { key: 'enhance', name: 'enhance' },
  { key: 'fantasy-art', name: 'fantasy-art' },
  { key: 'isometric', name: 'isometric' },
  { key: 'line-art', name: 'line-art' },
  { key: 'low-poly', name: 'low-poly' },
  { key: 'modeling-compound', name: 'modeling-compound' },
  { key: 'neon-punk', name: 'neon-punk' },
  { key: 'origami', name: 'origami' },
  { key: 'photographic', name: 'photographic' },
  { key: 'pixel-art', name: 'pixel-art' },
  { key: 'tile-texture', name: 'tile-texture' },
]

/** 思维导图示例内容 */
export const MindMapContentExample = `# 移动端 AI 能力
## 对话
### 角色设定
### 上下文
## 创作
### 写作
### 绘图
### 思维导图
## 管理
### 模型
### 知识库`
