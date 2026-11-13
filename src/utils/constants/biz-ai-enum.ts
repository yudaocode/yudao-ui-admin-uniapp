import { formatNumber } from '@/utils/format'

/** AI 平台枚举 */
export const AiPlatformEnum = {
  ALIBABA: 'ALIBABA',
  BAIDU: 'BAIDU',
  DEEPSEEK: 'DEEPSEEK',
  ZHIPU: 'ZHIPU',
  IFLYTEK: 'IFLYTEK',
  SILICONFLOW: 'SILICONFLOW',
  OPENAI: 'OPENAI',
  OLLAMA: 'OLLAMA',
  STABILITYAI: 'STABILITYAI',
  MIDJOURNEY: 'MIDJOURNEY',
  SUNO: 'SUNO',
  BYTEDANCE: 'BYTEDANCE',
} as const

/** AI 模型类型枚举 */
export const AiModelTypeEnum = {
  CHAT: 1,
  IMAGE: 2,
  VOICE: 3,
  VIDEO: 4,
  EMBEDDING: 5,
  RERANK: 6,
  MUSIC: 7,
} as const

/** AI 聊天消息类型枚举 */
export const AiChatMessageTypeEnum = {
  USER: 'user', // 用户
  ASSISTANT: 'assistant', // 助手
  SYSTEM: 'system', // 系统
} as const

/** AI 模型输入模态的枚举 */
export const AiModelInputModalityEnum = {
  TEXT: 'text', // 文本
  IMAGE: 'image', // 图片
  VIDEO: 'video', // 视频
} as const

/** AI 模型输入模态的选项：text 必选 */
export const AI_MODEL_INPUT_MODALITY_OPTIONS = [
  { label: '文本', value: AiModelInputModalityEnum.TEXT, disabled: true },
  { label: '图片', value: AiModelInputModalityEnum.IMAGE },
  { label: '视频', value: AiModelInputModalityEnum.VIDEO },
]

/** AI 思考档位的展示名，未列出的档位直接展示档位值 */
export const AI_REASONING_LEVEL_LABELS: Record<string, string> = {
  off: '关闭',
  on: '开启',
  minimal: '最低',
  low: '低',
  medium: '中',
  high: '高',
  xhigh: '很高',
  max: '最高',
}

/** AI 图片状态枚举 */
export const AiImageStatusEnum = {
  IN_PROGRESS: 10,
  SUCCESS: 20,
  FAIL: 30,
} as const

/** AI 绘图生成方式枚举，与后端 AiImageModeEnum 一致 */
export const AiImageModeEnum = {
  DRAW: 10, // AI 生图：通用模型，含 Seedream
  MIDJOURNEY_IMAGINE: 20, // MJ 文生图
  MIDJOURNEY_IMAGE: 21, // MJ 图生图
  MIDJOURNEY_BLEND: 22, // MJ 融图
  MIDJOURNEY_SWAP_FACE: 23, // MJ 换脸
  MIDJOURNEY_CONSISTENCY: 24, // MJ 一致性
  MIDJOURNEY_ACTION: 30, // MJ 按钮动作
  MIDJOURNEY_MODAL: 31, // MJ 局部重绘
} as const

/** AI 绘图输入图片角色枚举，与后端 AiImageInputRoleEnum 一致 */
export const AiImageInputRoleEnum = {
  REFERENCE: 'reference', // 参考图
  BLEND: 'blend', // 融图
  SWAP_SOURCE: 'swap_source', // 换脸：来源脸
  SWAP_TARGET: 'swap_target', // 换脸：目标图
  CREF: 'cref', // 角色参考
  SREF: 'sref', // 风格参考
  MASK: 'mask', // 局部重绘蒙版
} as const

/** AI 绘图输入图片角色的展示名 */
export const AI_IMAGE_INPUT_ROLE_LABELS: Record<string, string> = {
  reference: '参考图',
  blend: '融图',
  swap_source: '来源脸',
  swap_target: '目标图',
  cref: '角色参考',
  sref: '风格参考',
  mask: '蒙版',
}

/** AI 音乐状态枚举 */
export const AiMusicStatusEnum = {
  PENDING: 10, // 待处理
  IN_PROGRESS: 20, // 生成中
  SAVING: 30, // 转存中
  SUCCESS: 40, // 已完成
  FAIL: 50, // 已失败
} as const

/** AI 音乐是否未结束：待处理、生成中、转存中 */
export function isAiMusicRunning(status?: number) {
  return status === AiMusicStatusEnum.PENDING
    || status === AiMusicStatusEnum.IN_PROGRESS
    || status === AiMusicStatusEnum.SAVING
}

/** AI 音乐生成模式枚举 */
export const AiMusicGenerateModeEnum = {
  INSPIRATION: 1, // 灵感
  CUSTOM: 2, // 自定义
  EXTEND: 3, // 续写
  CONCAT: 4, // 拼接
  UPLOAD: 5, // 上传
} as const

/** AI 音乐预置风格：中文显示，英文写入 */
export const AI_MUSIC_PRESET_TAGS = [
  { label: '女声', value: 'female vocals' },
  { label: '男声', value: 'male vocals' },
  { label: '流行', value: 'pop' },
  { label: '摇滚', value: 'rock' },
  { label: '硬摇滚', value: 'hard rock' },
  { label: '电音', value: 'electronic' },
  { label: '金属', value: 'metal' },
  { label: '重金属', value: 'heavy metal' },
  { label: '节拍', value: 'beat' },
  { label: '弱拍', value: 'upbeat' },
  { label: '合成器', value: 'synth' },
  { label: '吉他', value: 'guitar' },
  { label: '钢琴', value: 'piano' },
  { label: '小提琴', value: 'violin' },
  { label: '贝斯', value: 'bass' },
  { label: '嘻哈', value: 'hip hop' },
]

/** 格式化音乐时长（秒）为 mm:ss；为空时返回 - */
export function formatMusicDuration(seconds?: number | null) {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '-'
  }
  const total = Math.max(0, Math.floor(seconds))
  const minute = Math.floor(total / 60)
  const second = total % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

/** 音乐名称为空时的展示文案 */
export function getMusicTitle(title?: string | null) {
  return title || '未命名歌曲'
}

/** AI PPT 状态枚举：任务、每页共用；每页的状态为空表示待生成 */
export const AiPptStatusEnum = {
  IN_PROGRESS: 10, // 生成中
  SUCCESS: 20, // 已完成
  FAIL: 30, // 已失败
} as const

/** AI PPT 格式枚举 */
export const AiPptModeEnum = {
  DETAILED: 1, // 详细演示文稿
  SLIDES: 2, // 演示用幻灯片
} as const

/** AI PPT 素材来源枚举 */
export const AiPptSourceEnum = {
  PASTE: 1, // 粘贴大纲
  UPLOAD: 2, // 上传材料
} as const

/** AI PPT 语言枚举 */
export const AiPptLanguageEnum = {
  ZH_CN: 'zh-CN', // 中文
  EN: 'en', // English
} as const

/** AI PPT 导出格式枚举 */
export const AiPptExportFormatEnum = {
  PPTX: 'pptx',
  PDF: 'pdf',
} as const

/** AI PPT 导出选项：用于 wd-action-sheet */
export const AI_PPT_EXPORT_ACTIONS = [
  { name: '导出 PPTX（16:9，每页一张图）', value: AiPptExportFormatEnum.PPTX },
  { name: '导出 PDF（16:9，每页一张图）', value: AiPptExportFormatEnum.PDF },
]

/** AI PPT 支持的绘图平台，与后端一致 */
export const AI_PPT_IMAGE_PLATFORMS: string[] = [
  AiPlatformEnum.OPENAI,
  AiPlatformEnum.SILICONFLOW,
  AiPlatformEnum.ALIBABA,
]

/** AI PPT 材料支持的格式，与后端一致 */
export const AI_PPT_FILE_TYPES = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown']

/** 格式化 PPT 语言 */
export function formatPptLanguage(language?: string) {
  return language === AiPptLanguageEnum.EN ? 'English' : '中文'
}

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

/** 格式化 AI Token 数：未知（空）显示「未取得」，真实 0 显示 0 */
export function formatAiTokens(value?: number | null) {
  return value === undefined || value === null ? '未取得' : formatNumber(value)
}

/** 图片热词 */
export const ImageHotWords = ['中国旗袍', '古装美女', '卡通头像', '机甲战士', '童话小屋', '中国长城']

/** 图片英文热词 */
export const ImageHotEnglishWords = ['Chinese Cheongsam', 'Ancient Beauty', 'Cartoon Avatar', 'Mech Warrior', 'Fairy Tale Cottage', 'The Great Wall of China']

// ========== AI 绘图：模型能力 ==========
// 1. 能力只在代码中维护（与 PC 端 imageCapabilities 一致），新模型上线 = 在这里加一项
// 2. 只按 `${platform}:${model}` 精确匹配，不做子串、前缀猜测
// 3. 决定表单显示哪些字段、可选值与上限；后端只做 VO 的必要校验

/** AI 绘图高级参数：key 与绘图请求字段一致 */
export interface ImageAdvancedField {
  key: 'seed' | 'steps' | 'cfgScale' | 'sampler' | 'stylePreset' | 'clipGuidancePreset'
  label: string
  min?: number
  max?: number
  step?: number
  precision?: number // 小数位数；为空表示整数
  default?: number | string
  placeholder?: string
  options?: { value: string, label: string }[] // 下拉选项
}

/** AI 绘图模型能力 */
export interface ImageModelCapability {
  sizeMode: 'fixed' | 'pixel' | 'tier' // 尺寸方式：fixed 固定尺寸；pixel 像素宽高（可选自定义）；tier 尺寸档位
  sizes?: string[] // 可选尺寸（fixed / pixel），格式 宽x高
  custom?: { min: number, max: number, step: number } // 自定义像素范围（pixel）；为空表示不开放自定义
  tiers?: string[] // 尺寸档位（tier）
  qualities?: string[] // 画质（OpenAI）
  promptMax: number // 提示词上限
  negativePrompt: boolean // 是否开放「不希望出现的内容」
  reference: { max: number, maxMb?: number, accept?: string[] } // 参考图：max = 0 不显示；accept 为扩展名
  advanced?: ImageAdvancedField[] // 高级参数
  fixed?: { name: string, value: string, note: string }[] // 固定参数：只读展示（Seedream）
  guide?: string[] // 写法建议（Seedream）
  status?: { legacy?: string, blocked?: string } // legacy 提示；blocked 为不可选的原因
}

const IMAGE_PROMPT_MAX = 1200 // 与 AiImageDrawReqVO.prompt 上限一致
const IMAGE_ACCEPT = ['png', 'jpg', 'jpeg'] // 参考图格式

const TONG_YI_PIXEL: Pick<ImageModelCapability, 'sizeMode' | 'sizes' | 'custom'> = { // 通义万相的像素尺寸
  sizeMode: 'pixel',
  sizes: ['1024x1024', '1280x720', '720x1280', '1152x768'],
  custom: { min: 512, max: 1440, step: 8 },
}

const SEEDREAM_BASE: Omit<ImageModelCapability, 'tiers' | 'promptMax' | 'reference'> = { // Seedream 的公共能力
  sizeMode: 'tier',
  negativePrompt: false,
  fixed: [
    { name: 'sequential_image_generation', value: '不传', note: '官方默认 disabled，每任务 1 张' },
    { name: 'response_format', value: 'url', note: '结果转存文件服务' },
    { name: 'watermark', value: 'false', note: '不加水印' },
    { name: 'optimize_prompt_options', value: '{ mode: standard }', note: '标准提示词优化' },
  ],
  guide: [
    '0 张参考图 = 文生图；1 张 = 图片编辑（含改字）；2–10 张 = 多图参考，提示词中用“图1、图2”指代',
    '结构：主体描述 + 风格 + 美学；关键信息靠前；用正向表达代替“不要 xxx”',
    '需要文字时明确“生成文字”，写清位置、风格、材质，文字用引号包裹',
    '编辑时一次只做一件事，多实体时写明“对谁做什么”',
  ],
}

const STABILITY_ADVANCED: ImageAdvancedField[] = [ // Stability 的高级参数
  { key: 'seed', label: '随机种子', min: 0, max: 4294967295, default: 0 },
  { key: 'steps', label: '推理步数', min: 10, max: 50, default: 30 },
  { key: 'cfgScale', label: '引导系数', min: 0, max: 35, step: 0.5, precision: 1, default: 7 },
  {
    key: 'sampler',
    label: '采样方法',
    default: 'K_DPMPP_2M',
    options: ['DDIM', 'DDPM', 'K_DPMPP_2M', 'K_DPMPP_2S_ANCESTRAL', 'K_DPM_2', 'K_DPM_2_ANCESTRAL', 'K_EULER', 'K_EULER_ANCESTRAL', 'K_HEUN', 'K_LMS']
      .map(value => ({ value, label: value })),
  },
  {
    key: 'stylePreset',
    label: '风格预设',
    placeholder: '无',
    options: ['3d-model', 'analog-film', 'anime', 'cinematic', 'comic-book', 'digital-art', 'enhance', 'fantasy-art', 'isometric', 'line-art', 'low-poly', 'modeling-compound', 'neon-punk', 'origami', 'photographic', 'pixel-art', 'tile-texture']
      .map(value => ({ value, label: value })),
  },
  {
    key: 'clipGuidancePreset',
    label: 'CLIP 引导',
    default: 'NONE',
    options: ['NONE', 'FAST_BLUE', 'FAST_GREEN', 'SIMPLE', 'SLOW', 'SLOWER', 'SLOWEST'].map(value => ({ value, label: value })),
  },
]

/** 已登记模型的能力：键 = `${platform}:${model}`，只做精确匹配 */
export const IMAGE_MODEL_CAPABILITIES: Record<string, ImageModelCapability> = {
  'OPENAI:gpt-image-1': {
    sizeMode: 'fixed',
    sizes: ['1024x1024', '1536x1024', '1024x1536'],
    qualities: ['auto', 'high', 'medium', 'low'],
    promptMax: IMAGE_PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
    status: { legacy: '官方有该模型的历史下线公告，上线前按官方模型页核实' },
  },
  'OPENAI:dall-e-3': {
    sizeMode: 'fixed',
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: ['standard', 'hd'],
    promptMax: IMAGE_PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  'ALIBABA:wan2.7-image': {
    ...TONG_YI_PIXEL,
    promptMax: IMAGE_PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
    status: { blocked: 'DashScope SDK 1.1.2.2 没有 wan2.7-image 路由，暂不可用' },
  },
  'ALIBABA:wanx2.1-t2i-turbo': {
    ...TONG_YI_PIXEL,
    promptMax: IMAGE_PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  'SILICONFLOW:Kwai-Kolors/Kolors': {
    sizeMode: 'pixel',
    sizes: ['1024x1024', '960x1280', '768x1024', '720x1440', '720x1280'],
    promptMax: IMAGE_PROMPT_MAX,
    negativePrompt: true,
    reference: { max: 1, maxMb: 10, accept: [...IMAGE_ACCEPT, 'webp'] },
    advanced: [
      { key: 'seed', label: '随机种子', min: 0, max: 9999999999, placeholder: '留空随机' },
      { key: 'steps', label: '推理步数', min: 1, max: 50, default: 20 },
      { key: 'cfgScale', label: '引导系数', min: 0, max: 20, step: 0.5, precision: 1, default: 7.5 },
    ],
  },
  'STABILITYAI:stable-diffusion-v1-6': {
    sizeMode: 'pixel',
    sizes: ['512x512', '768x768', '1024x1024'],
    custom: { min: 320, max: 1536, step: 64 },
    promptMax: IMAGE_PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
    advanced: STABILITY_ADVANCED,
  },
  // Seedream 5.0 flash：本期只开放已实测的 2K 文生图；参考图、其它档位未实测，暂不开放
  'BYTEDANCE:doubao-seedream-5-0-flash-260915': {
    ...SEEDREAM_BASE,
    tiers: ['2K'],
    promptMax: 1000,
    reference: { max: 0 },
    guide: SEEDREAM_BASE.guide?.slice(1), // 不开放参考图：去掉参考图的写法建议
  },
  'BYTEDANCE:doubao-seedream-5-0-260128': {
    ...SEEDREAM_BASE,
    tiers: ['2K', '3K'],
    promptMax: 1000,
    reference: { max: 10, maxMb: 10, accept: IMAGE_ACCEPT },
  },
  'BYTEDANCE:doubao-seedream-4-5-251128': {
    ...SEEDREAM_BASE,
    tiers: ['2K', '4K'],
    promptMax: 800,
    reference: { max: 10, maxMb: 5, accept: IMAGE_ACCEPT },
  },
  'BYTEDANCE:doubao-seedream-4-0-250828': {
    ...SEEDREAM_BASE,
    tiers: ['1K', '2K', '4K'],
    promptMax: 800,
    reference: { max: 10, maxMb: 5, accept: IMAGE_ACCEPT },
  },
}

const IMAGE_FALLBACK_CAPABILITY: ImageModelCapability = { // 未登记模型的保守能力：仅文生图、无参考图
  sizeMode: 'fixed',
  sizes: ['1024x1024'],
  promptMax: IMAGE_PROMPT_MAX,
  negativePrompt: false,
  reference: { max: 0 },
}

const IMAGE_PLATFORM_FALLBACK: Record<string, ImageModelCapability | null> = { // 未登记的模型标识：按平台保守能力；ByteDance 不可选
  [AiPlatformEnum.OPENAI]: IMAGE_FALLBACK_CAPABILITY,
  [AiPlatformEnum.ALIBABA]: IMAGE_FALLBACK_CAPABILITY,
  [AiPlatformEnum.SILICONFLOW]: IMAGE_FALLBACK_CAPABILITY,
  [AiPlatformEnum.STABILITYAI]: IMAGE_FALLBACK_CAPABILITY,
  [AiPlatformEnum.BYTEDANCE]: null,
}

/** 未登记的豆包模型的不可用说明 */
export const DOU_BAO_UNREGISTERED = '未登记的豆包图片模型：只有登记的 Seedream 版本可用'

/** 获得绘图模型的能力；null 表示不可选 */
export function getImageModelCapability(platform?: string, model?: string): ImageModelCapability | null {
  if (!platform) {
    return null
  }
  return IMAGE_MODEL_CAPABILITIES[`${platform}:${model}`] || IMAGE_PLATFORM_FALLBACK[platform] || null
}

/** 是否为 AI 绘图支持的平台：其它平台不出现在模型选择 */
export function isImagePlatform(platform?: string) {
  return !!platform && (platform === AiPlatformEnum.MIDJOURNEY || platform in IMAGE_PLATFORM_FALLBACK)
}

/** 绘图模型不可选的原因；为空表示可选 */
export function getImageModelDisabledReason(platform?: string, model?: string) {
  if (platform === AiPlatformEnum.MIDJOURNEY) {
    return undefined
  }
  const capability = getImageModelCapability(platform, model)
  return capability ? capability.status?.blocked : DOU_BAO_UNREGISTERED
}

/** 绘图模型的能力标签 */
export function getImageModelTags(platform?: string, model?: string) {
  if (platform === AiPlatformEnum.MIDJOURNEY) {
    return ['五种模式', '按钮动作']
  }
  const capability = getImageModelCapability(platform, model)
  if (!capability) {
    return []
  }
  const tags: string[] = []
  if (capability.status?.legacy) {
    tags.push('legacy')
  }
  if (!IMAGE_MODEL_CAPABILITIES[`${platform}:${model}`]) {
    tags.push('未登记 · 仅文生图')
  }
  if (capability.reference.max > 0) {
    tags.push(`参考图 ≤${capability.reference.max}`)
  }
  if (capability.sizeMode === 'tier') {
    tags.push(capability.tiers!.join(' / '))
  } else if (capability.custom) {
    tags.push('自定义宽高')
  }
  return tags
}

/** 尺寸 宽x高 换算为最简比例，例如 1792x1024 → 7:4 */
export function getImageSizeRatio(width?: number, height?: number) {
  if (!width || !height) {
    return ''
  }
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

/** 解析尺寸 宽x高 */
export function parseImageSize(size: string) {
  const [width, height] = size.split('x').map(Number)
  return { width, height }
}

// ========== AI 绘图：Midjourney ==========

/** Midjourney 版本：按版本的参数门禁，为空表示不显示、不发送 */
export interface MjVersion {
  key: string
  name: string
  flag: string // 版本参数，例如 --v 7
  badge: string
  quality: number[] // --q 可选值
  iw?: { min: number, max: number, default: number } // --iw 范围
  raw: boolean // --raw
  hd: boolean // --hd（V8 系列）
  cref: boolean // --cref / --cw（旧版角色参考）
  sref: boolean // --sref / --sw
  sv?: { min: number, max: number, default: number } // --sv 范围；Niji 7 只有 4
  omni: boolean // V7 Omni Reference（中转未适配，禁用展示）
  edit: boolean // V8 Edit（中转未适配，禁用展示）
  why?: Record<string, string> // 不显示的原因
}

/** Midjourney 版本 */
export const MJ_VERSIONS: MjVersion[] = [
  {
    key: 'v8.2',
    name: 'Midjourney V8.2',
    flag: '--v 8.2',
    badge: '官方当前默认',
    quality: [],
    raw: true,
    hd: true,
    cref: false,
    sref: true,
    omni: false,
    edit: true,
    why: { iw: '官方图片权重表未单列 V8.2：暂不暴露，按默认权重 1 图生图' },
  },
  {
    key: 'v8.1',
    name: 'Midjourney V8.1',
    flag: '--v 8.1',
    badge: 'V8 系列',
    quality: [],
    iw: { min: 0, max: 3, default: 1 },
    raw: true,
    hd: true,
    cref: false,
    sref: true,
    omni: false,
    edit: true,
  },
  {
    key: 'v7',
    name: 'Midjourney V7',
    flag: '--v 7',
    badge: '应用默认',
    quality: [1, 2, 4],
    iw: { min: 0, max: 3, default: 1 },
    raw: true,
    hd: false,
    cref: false,
    sref: true,
    sv: { min: 1, max: 6, default: 6 },
    omni: true,
    edit: false,
  },
  {
    key: 'v6.1',
    name: 'Midjourney V6.1',
    flag: '--v 6.1',
    badge: '支持角色参考',
    quality: [0.5, 1, 2],
    raw: true,
    hd: false,
    cref: true,
    sref: true,
    sv: { min: 1, max: 4, default: 4 },
    omni: false,
    edit: false,
    why: { iw: '官方未单列 V6.1 的图片权重范围：暂不暴露，按默认权重 1 图生图' },
  },
  {
    key: 'niji7',
    name: 'Niji 7',
    flag: '--niji 7',
    badge: '二次元',
    quality: [],
    iw: { min: 0, max: 2, default: 1 },
    raw: false,
    hd: false,
    cref: false,
    sref: true,
    sv: { min: 4, max: 4, default: 4 },
    omni: false,
    edit: false,
    why: {
      raw: 'Niji 7 未给出 RAW 规则：暂不暴露',
      quality: 'Niji 7 未给出 --q 取值：暂不暴露',
      cref: 'Niji 7 官方明确不支持 --cref',
    },
  },
  {
    key: 'niji6',
    name: 'Niji 6',
    flag: '--niji 6',
    badge: '支持角色参考',
    quality: [],
    raw: false,
    hd: false,
    cref: true,
    sref: true,
    omni: false,
    edit: false,
    why: {
      iw: '官方图片权重表未单列 Niji 6：暂不暴露，按默认权重 1 图生图',
      raw: 'Niji 6 的 RAW 规则未明确：暂不暴露',
      quality: '官方画质表未列 Niji：暂不暴露',
    },
  },
]

/** Midjourney 应用默认版本（与 GeekAI 基线一致）；官方默认 V8.2，改默认需真实中转验收 */
export const MJ_DEFAULT_VERSION = 'v7'

/** 获得 Midjourney 版本；找不到时使用默认版本 */
export function getMjVersion(key?: string) {
  return MJ_VERSIONS.find(item => item.key === key) || MJ_VERSIONS.find(item => item.key === MJ_DEFAULT_VERSION)!
}

/** 按版本参数反查 Midjourney 版本；用于重新生成回填 */
export function getMjVersionByFlag(flag?: string) {
  return MJ_VERSIONS.find(item => item.flag === flag)
}

/** Midjourney 中转适配能力：只有已实现的接口可用 */
export const MJ_ADAPTER = {
  omniReference: { enabled: false, reason: '中转适配未实现 --oref 上传与校验，暂不可用' },
  edit: { enabled: false, reason: 'V8 Edit 是独立的编辑流程（--edit，最多 4 张），与局部重绘、换脸不同；中转适配未实现' },
}

/** Midjourney 子模式 */
export const MJ_MODES = [
  { mode: AiImageModeEnum.MIDJOURNEY_IMAGINE, name: '文生图' },
  { mode: AiImageModeEnum.MIDJOURNEY_IMAGE, name: '图生图' },
  { mode: AiImageModeEnum.MIDJOURNEY_BLEND, name: '融图' },
  { mode: AiImageModeEnum.MIDJOURNEY_SWAP_FACE, name: '换脸' },
  { mode: AiImageModeEnum.MIDJOURNEY_CONSISTENCY, name: '一致性' },
]

/** Midjourney 比例 */
export const MJ_RATIOS = ['1:1', '1:2', '2:1', '2:3', '3:2', '3:4', '4:3', '16:9', '9:16']

/** Midjourney 融图尺寸 */
export const MJ_BLEND_DIMENSIONS = [
  { value: 'PORTRAIT', label: '竖图 2:3' },
  { value: 'SQUARE', label: '方图 1:1' },
  { value: 'LANDSCAPE', label: '横图 3:2' },
]

export const MJ_IMAGE_MAX_MB = 10 // Midjourney 输入图片的单张上限
export const MJ_IMAGE_ACCEPT = ['png', 'jpg', 'jpeg', 'webp'] // Midjourney 输入图片格式

/** Midjourney 按钮：是否为 U / V 宫格按钮 */
export function isMjGridButton(customId: string) {
  return /::(?:upsample|variation)::[1-4]::/.test(customId)
}

/** Midjourney 按钮：CustomZoom 本期隐藏 */
export function isMjHiddenButton(customId: string) {
  return customId.includes('CustomZoom')
}

/** Midjourney 按钮：是否为局部重绘 */
export function isMjInpaintButton(customId: string) {
  return customId.includes('Inpaint')
}

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
