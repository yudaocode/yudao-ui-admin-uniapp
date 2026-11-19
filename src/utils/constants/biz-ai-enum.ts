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
  MINIMAX: 'MINIMAX',
  KLING: 'KLING',
  GEMINI: 'GEMINI',
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
  OCR: 8,
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

/** AI 技能文件类型枚举 */
export const AiSkillFileTypeEnum = {
  DIRECTORY: 1, // 目录
  FILE: 2, // 文件
} as const

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

/** AI 文字识别状态枚举，与后端一致 */
export const AiOcrStatusEnum = {
  SUCCESS: 20, // 识别成功
  FAIL: 30, // 识别失败
} as const

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

// ========== AI 视频 ==========

/** AI 视频状态枚举，与后端 AiVideoStatusEnum 一致 */
export const AiVideoStatusEnum = {
  PENDING: 10, // 待处理
  IN_PROGRESS: 20, // 生成中
  SAVING: 30, // 转存中
  SUCCESS: 40, // 已完成
  FAIL: 50, // 已失败
} as const

/** AI 视频是否未结束：待处理、生成中、转存中 */
export function isAiVideoRunning(status?: number) {
  return status === AiVideoStatusEnum.PENDING
    || status === AiVideoStatusEnum.IN_PROGRESS
    || status === AiVideoStatusEnum.SAVING
}

/** AI 视频创作类型枚举，与后端 AiVideoTypeEnum 一致 */
export const AiVideoTypeEnum = {
  GENERATE: 1, // 视频生成
  AVATAR: 2, // 数字人口播
  MOTION: 3, // 动作模仿
} as const

/** AI 视频生成方式枚举，与后端 AiVideoModeEnum 一致 */
export const AiVideoModeEnum = {
  TEXT: 'text', // 文生视频
  IMAGE: 'image', // 图生视频
  FIRST_LAST: 'first_last', // 首尾帧
  REFERENCE: 'reference', // 参考生视频
} as const

/** AI 视频生成方式的选项：创作面板使用的短名称 */
export const AI_VIDEO_MODE_OPTIONS = [
  { label: '文生', value: AiVideoModeEnum.TEXT },
  { label: '图生', value: AiVideoModeEnum.IMAGE },
  { label: '首尾帧', value: AiVideoModeEnum.FIRST_LAST },
  { label: '参考', value: AiVideoModeEnum.REFERENCE },
]

/** AI 视频生成模式（quality）的选项：可灵旧版接口 */
export const AI_VIDEO_QUALITY_OPTIONS = [
  { label: '标准', value: 'std' },
  { label: '高品质', value: 'pro' },
]

/** AI 视频提示词扩写（promptExpansionMode）的选项：MiniMax H3 */
export const AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS = [
  { label: '关闭', value: 'disabled' },
  { label: '均衡', value: 'balanced' },
  { label: '质量', value: 'quality' },
]

/** AI 视频镜头类型（shotType）的选项：通义万相 */
export const AI_VIDEO_SHOT_TYPE_OPTIONS = [
  { label: '单镜头', value: 'single' },
  { label: '多镜头', value: 'multi' },
]

/** AI 视频生成方式的名称 */
export const AI_VIDEO_MODE_LABELS: Record<string, string> = {
  text: '文生视频',
  image: '图生视频',
  first_last: '首尾帧',
  reference: '参考生视频',
}

/** AI 视频输入文件角色的名称 */
export const AI_VIDEO_ROLE_LABELS: Record<string, string> = {
  first_frame: '首帧',
  last_frame: '尾帧',
  reference_image: '参考图',
  reference_video: '参考视频',
  reference_audio: '参考音频',
  image: '人物图片',
  audio: '驱动音频',
  video: '动作视频',
}

/** AI 视频生成参数的名称 */
export const AI_VIDEO_OPTION_LABELS: Record<string, string> = {
  resolution: '分辨率',
  ratio: '比例',
  size: '尺寸',
  duration: '时长',
  seed: '种子',
  watermark: '水印',
  generateAudio: '生成音频',
  cameraFixed: '固定镜头',
  negativePrompt: '反向提示词',
  promptExtend: '优化提示词',
  promptExpansionMode: '提示词扩写',
  quality: '生成模式',
  shotType: '镜头类型',
  outputResolution: '输出分辨率',
}

/** AI 视频模型的表单能力：决定可选的生成方式、参数；只用于表单展示，最终以服务端校验为准 */
export interface VideoModelCapability {
  modes: string[] // 支持的生成方式，参见 AiVideoModeEnum
  resolutions: string[] // 可选分辨率，第一个为默认；为空表示不传
  ratios: string[] // 可选比例，第一个为默认；为空表示不传
  durations: number[] // 可选时长（秒），第一个为默认；为空表示不传
  sizes: string[] // 可选尺寸（宽*高），第一个为默认；万相 2.6 及更早的文生视频用它代替分辨率、比例
  fields: string[] // 额外参数：size、generateAudio、cameraFixed、watermark、negativePrompt、promptExtend、promptExpansionMode、quality、shotType、seed
  maxReferenceImages: number // 参考图最多张数
  referenceVideo: boolean // 是否支持参考视频
  referenceAudio: boolean // 是否支持参考音频
  promptRequired: boolean // 提示词是否必填
}

const VIDEO_RATIOS_COMMON = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'] // 常用画面比例

/** 万相 2.6 及更早文生视频的尺寸：与后端 TongYiWanVideoApi.LEGACY_T2V_SIZES 一致 */
const VIDEO_WAN_SIZES_480P = ['832*480', '480*832', '624*624']
const VIDEO_WAN_SIZES_720P = ['1280*720', '720*1280', '960*960', '1088*832', '832*1088']
const VIDEO_WAN_SIZES_1080P = ['1920*1080', '1080*1920', '1440*1440', '1632*1248', '1248*1632']
const VIDEO_WAN_LEGACY_T2V_SIZES: Record<string, string[]> = {
  'wan2.6-t2v': [...VIDEO_WAN_SIZES_720P, ...VIDEO_WAN_SIZES_1080P],
  'wan2.5-t2v-preview': [...VIDEO_WAN_SIZES_480P, ...VIDEO_WAN_SIZES_720P, ...VIDEO_WAN_SIZES_1080P],
  'wan2.2-t2v-plus': [...VIDEO_WAN_SIZES_480P, ...VIDEO_WAN_SIZES_1080P],
  'wanx2.1-t2v-turbo': [...VIDEO_WAN_SIZES_480P, ...VIDEO_WAN_SIZES_720P],
  'wanx2.1-t2v-plus': VIDEO_WAN_SIZES_720P,
}
/** 万相 2.6 及更早图生视频的分辨率：与后端 TongYiWanVideoApi.LEGACY_I2V_RESOLUTIONS 一致 */
const VIDEO_WAN_LEGACY_I2V_RESOLUTIONS: Record<string, string[]> = {
  'wan2.6-i2v-flash': ['1080P', '720P'],
  'wan2.6-i2v': ['1080P', '720P'],
  'wan2.5-i2v-preview': ['1080P', '480P', '720P'],
  'wan2.2-i2v-flash': ['720P', '480P', '1080P'],
  'wan2.2-i2v-plus': ['1080P', '480P'],
  'wanx2.1-i2v-turbo': ['720P', '480P'],
  'wanx2.1-i2v-plus': ['720P'],
}

/** 生成连续的时长选项 */
function getVideoDurationRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

/**
 * 获得视频模型的表单能力：按平台、模型标识、生成方式推断
 *
 * 部分模型的可选分辨率还与时长、生成音频有关：海螺 10 秒只支持 768P，kling-2.6 生成音频只支持 1080p
 */
export function getVideoModelCapability(platform?: string, model?: string, mode?: string, duration?: number, generateAudio?: boolean): VideoModelCapability {
  const name = model || ''
  const base: VideoModelCapability = {
    modes: [AiVideoModeEnum.TEXT],
    resolutions: [],
    ratios: [],
    durations: [],
    sizes: [],
    fields: [],
    maxReferenceImages: 0,
    referenceVideo: false,
    referenceAudio: false,
    promptRequired: mode === AiVideoModeEnum.TEXT,
  }
  // 1. 字节跳动：即梦视频 3.0、方舟 Seedance；数字人口播、动作模仿没有可选参数
  if (platform === AiPlatformEnum.BYTEDANCE) {
    if (!isVideoModelOfType(AiVideoTypeEnum.GENERATE, platform, name)) {
      return { ...base, promptRequired: false }
    }
    return name.startsWith('jimeng_')
      ? getJimengVideoCapability(base, name, mode)
      : getSeedanceVideoCapability(base, name, mode)
  }
  // 2. 可灵：kling-v 开头为旧版接口
  if (platform === AiPlatformEnum.KLING) {
    return getKlingVideoCapability(base, name, mode, generateAudio)
  }
  // 3. MiniMax：H3 走 v2 接口，其余为海螺
  if (platform === AiPlatformEnum.MINIMAX) {
    return name.startsWith('MiniMax-H3')
      ? getMiniMaxH3VideoCapability(base, name, mode)
      : getHailuoVideoCapability(base, name, mode, duration)
  }
  // 4. 阿里：HappyHorse 按 t2v / i2v / r2v 分模型；其余为通义万相
  if (platform === AiPlatformEnum.ALIBABA) {
    return name.startsWith('happyhorse')
      ? getHappyHorseVideoCapability(base, name)
      : getTongYiWanVideoCapability(base, name)
  }
  // 5. Google Veo（Vertex AI）
  if (platform === AiPlatformEnum.GEMINI && name.startsWith('veo-')) {
    return getVeoVideoCapability(base, name, mode)
  }
  return base
}

/** 即梦视频 3.0：只有文生支持比例；除 3.0 Pro 的图生外，都需要提示词 */
function getJimengVideoCapability(base: VideoModelCapability, name: string, mode?: string): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST } = AiVideoModeEnum
  const ti2v = name.includes('ti2v')
  let modes: string[] = [IMAGE]
  if (name.includes('t2v')) {
    modes = [TEXT]
  } else if (name.includes('first_tail')) {
    modes = [FIRST_LAST]
  } else if (ti2v) {
    modes = [TEXT, IMAGE]
  }
  return {
    ...base,
    modes,
    ratios: mode === TEXT ? VIDEO_RATIOS_COMMON : [],
    durations: [5, 10],
    fields: ['seed'],
    promptRequired: mode === TEXT || !ti2v,
  }
}

/** 方舟 Seedance：按系列区分时长与参数，2.0 / 2.5 支持参考视频、参考音频 */
function getSeedanceVideoCapability(base: VideoModelCapability, name: string, mode?: string): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const v10 = name.includes('seedance-1-0')
  const v15 = name.includes('seedance-1-5')
  const v20 = name.includes('seedance-2-0')
  const v25 = name.includes('seedance-2-5')
  let modes: string[] = [TEXT, IMAGE, FIRST_LAST]
  if (name.includes('t2v')) {
    modes = [TEXT]
  } else if (name.includes('i2v')) {
    modes = [IMAGE, FIRST_LAST, REFERENCE]
  } else if (name.includes('pro-fast')) {
    modes = [TEXT, IMAGE]
  } else if (v20 || v25) {
    modes = [TEXT, IMAGE, FIRST_LAST, REFERENCE]
  }
  // 随机种子、固定镜头只有 1.0 支持（参考图不支持固定镜头）；生成音频 1.0 不支持
  const fields = ['watermark']
  if (!v15 && !v20 && !v25) {
    fields.push('seed')
    if (mode !== REFERENCE) {
      fields.push('cameraFixed')
    }
  }
  if (!v10) {
    fields.push('generateAudio')
  }
  let durations = getVideoDurationRange(2, 12)
  if (v20) {
    durations = getVideoDurationRange(4, 15)
  } else if (v25) {
    durations = getVideoDurationRange(4, 30)
  }
  const lite = v20 && (name.includes('fast') || name.includes('mini'))
  // 2.5 的首帧、首尾帧只支持 adaptive，比例跟随首帧
  const frameAdaptive = v25 && (mode === IMAGE || mode === FIRST_LAST)
  return {
    ...base,
    modes,
    resolutions: lite ? ['720p', '480p'] : ['720p', '480p', '1080p'],
    ratios: frameAdaptive ? ['adaptive'] : [...VIDEO_RATIOS_COMMON, 'adaptive'],
    durations,
    fields,
    maxReferenceImages: v20 || v25 ? 9 : 4,
    referenceVideo: v20 || v25,
    referenceAudio: v20 || v25,
  }
}

/** 可灵：新版只有文生支持比例，不支持反向提示词；kling-2.6 的首尾帧、生成音频只支持 1080p，首尾帧不能生成音频 */
function getKlingVideoCapability(base: VideoModelCapability, name: string, mode?: string, generateAudio?: boolean): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST } = AiVideoModeEnum
  const modes = [TEXT, IMAGE, FIRST_LAST]
  if (/^kling-v\d/.test(name)) {
    return { ...base, modes, ratios: ['16:9', '9:16', '1:1'], durations: [5, 10], fields: ['negativePrompt', 'quality'] }
  }
  const v26 = name === 'kling-2.6'
  let ratios: string[] = []
  if (mode === TEXT) {
    ratios = v26 || name === 'kling-2.5-turbo' ? ['16:9', '9:16', '1:1'] : ['16:9', '9:16', '1:1', '21:9']
  }
  const firstLast = mode === FIRST_LAST
  return {
    ...base,
    modes,
    resolutions: v26 && (firstLast || generateAudio) ? ['1080p'] : ['720p', '1080p'],
    ratios,
    durations: [5, 10],
    fields: v26 && !firstLast ? ['generateAudio', 'watermark'] : ['watermark'],
  }
}

/** MiniMax-H3：都需要提示词；文生、H3-Lite 的参考生视频必须指定比例，只有 H3-Max 支持提示词扩写 */
function getMiniMaxH3VideoCapability(base: VideoModelCapability, name: string, mode?: string): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const max = name === 'MiniMax-H3-Max'
  const adaptive = mode !== TEXT && !(name === 'MiniMax-H3-Lite' && mode === REFERENCE)
  return {
    ...base,
    modes: [TEXT, IMAGE, FIRST_LAST, REFERENCE],
    resolutions: name === 'MiniMax-H3' ? ['768P', '2K'] : ['768P', '480P'],
    ratios: adaptive ? ['adaptive', ...VIDEO_RATIOS_COMMON] : VIDEO_RATIOS_COMMON,
    durations: getVideoDurationRange(max ? 5 : 4, 15),
    fields: max ? ['promptExpansionMode'] : [],
    maxReferenceImages: 9,
    referenceVideo: true,
    referenceAudio: true,
    promptRequired: true,
  }
}

/** MiniMax 海螺：按型号区分生成方式、分辨率与时长，与后端 MiniMaxHailuoVideoApi.MODEL_SPECS 一致 */
function getHailuoVideoCapability(base: VideoModelCapability, name: string, mode?: string, duration?: number): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const capability = { ...base, fields: ['promptExtend'] }
  // S2V-01 主体参考：不支持指定分辨率、时长
  if (name.startsWith('S2V')) {
    return { ...capability, modes: [REFERENCE], maxReferenceImages: 1 }
  }
  if (name.startsWith('T2V-01')) {
    return { ...capability, modes: [TEXT], resolutions: ['720P'], durations: [6] }
  }
  if (name.startsWith('I2V-01')) {
    return { ...capability, modes: [IMAGE], resolutions: ['720P'], durations: [6] }
  }
  let modes: string[] = [TEXT, IMAGE]
  if (name.includes('Fast')) {
    modes = [IMAGE]
  } else if (name.includes('02')) {
    modes = [TEXT, IMAGE, FIRST_LAST]
  }
  // 10 秒只支持 768P（02 的图生另有 512P）
  const resolutions = name.includes('02') && mode === IMAGE ? ['768P', '512P', '1080P'] : ['768P', '1080P']
  return {
    ...capability,
    modes,
    resolutions: duration === 10 ? resolutions.filter(item => item !== '1080P') : resolutions,
    durations: [6, 10],
  }
}

/** 阿里 HappyHorse：图生不支持比例，提示词可选 */
function getHappyHorseVideoCapability(base: VideoModelCapability, name: string): VideoModelCapability {
  const { TEXT, IMAGE, REFERENCE } = AiVideoModeEnum
  const i2v = name.includes('i2v')
  let modes: string[] = [TEXT]
  if (name.includes('r2v')) {
    modes = [REFERENCE]
  } else if (i2v) {
    modes = [IMAGE]
  }
  return {
    ...base,
    modes,
    resolutions: ['720P', '480P', '1080P'],
    ratios: i2v ? [] : VIDEO_RATIOS_COMMON,
    durations: getVideoDurationRange(3, 15),
    fields: ['seed', 'watermark'],
    maxReferenceImages: 9,
    promptRequired: !i2v,
  }
}

/** 通义万相：2.7 文生用分辨率 + 比例，2.6 及更早的文生用尺寸；图生不支持比例 */
function getTongYiWanVideoCapability(base: VideoModelCapability, name: string): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST } = AiVideoModeEnum
  const fields = ['seed', 'negativePrompt', 'promptExtend', 'watermark']
  if (name.startsWith('wan2.6-')) {
    fields.push('shotType')
  }
  if (name === 'wan2.6-i2v-flash') {
    fields.push('generateAudio')
  }
  // wanx2.1-i2v-turbo 支持 3~5 秒，默认仍为 5 秒
  let durations = [5]
  if (/^wan2\.[567]-/.test(name)) {
    durations = [5, 10]
  } else if (name === 'wanx2.1-i2v-turbo') {
    durations = [5, 4, 3]
  }
  if (name.startsWith('wan2.7-t2v')) {
    return { ...base, modes: [TEXT], resolutions: ['720P', '1080P'], ratios: ['16:9', '9:16', '1:1', '4:3', '3:4'], durations, fields }
  }
  if (name.startsWith('wan2.7-i2v')) {
    return { ...base, modes: [IMAGE, FIRST_LAST], resolutions: ['720P', '1080P'], durations, fields }
  }
  const sizes = VIDEO_WAN_LEGACY_T2V_SIZES[name]
  if (sizes) {
    return { ...base, modes: [TEXT], sizes, durations, fields: [...fields, 'size'] }
  }
  const resolutions = VIDEO_WAN_LEGACY_I2V_RESOLUTIONS[name]
  if (resolutions) {
    return { ...base, modes: [IMAGE], resolutions, durations, fields }
  }
  return base
}

/** Google Veo（Vertex AI）：参考图最多 3 张，且只支持 8 秒；Lite 不支持参考图；只有 Veo 3.1 支持 4k */
function getVeoVideoCapability(base: VideoModelCapability, name: string, mode?: string): VideoModelCapability {
  const { TEXT, IMAGE, FIRST_LAST, REFERENCE } = AiVideoModeEnum
  const lite = name.includes('lite')
  return {
    ...base,
    modes: lite ? [TEXT, IMAGE, FIRST_LAST] : [TEXT, IMAGE, FIRST_LAST, REFERENCE],
    resolutions: name === 'veo-3.1-generate-001' ? ['720p', '1080p', '4k'] : ['720p', '1080p'],
    ratios: ['16:9', '9:16'],
    durations: mode === REFERENCE ? [8] : [8, 6, 4],
    fields: ['seed', 'negativePrompt', 'generateAudio'],
    maxReferenceImages: lite ? 0 : 3,
    promptRequired: mode === TEXT || mode === REFERENCE,
  }
}

/** 模型是否属于某个创作类型：数字人口播、动作模仿只支持即梦对应的模型，其余为视频生成 */
export function isVideoModelOfType(type: number, platform?: string, model?: string) {
  const name = model || ''
  const avatar = platform === AiPlatformEnum.BYTEDANCE && /realman|omni/i.test(name)
  const motion = platform === AiPlatformEnum.BYTEDANCE && /dream_?actor/i.test(name)
  if (type === AiVideoTypeEnum.AVATAR) {
    return avatar
  }
  if (type === AiVideoTypeEnum.MOTION) {
    return motion
  }
  return !avatar && !motion
}

/** 获得创作类型、生成方式使用的输入文件角色：与后端 AiVideoUtils.filterInputUrls 一致 */
export function getVideoInputRoles(type: number, mode?: string): string[] {
  if (type === AiVideoTypeEnum.AVATAR) {
    return ['image', 'audio']
  }
  if (type === AiVideoTypeEnum.MOTION) {
    return ['image', 'video']
  }
  switch (mode) {
    case AiVideoModeEnum.IMAGE:
      return ['first_frame']
    case AiVideoModeEnum.FIRST_LAST:
      return ['first_frame', 'last_frame']
    case AiVideoModeEnum.REFERENCE:
      return ['reference_image', 'reference_video', 'reference_audio']
    default:
      return []
  }
}

/** 格式化视频生成参数：分辨率、比例、时长与其它参数一起展示，只展示有值的 */
export function formatVideoOptions(video: { resolution?: string, ratio?: string, duration?: number, options?: object }) {
  const params: Record<string, unknown> = {
    resolution: video.resolution,
    ratio: video.ratio,
    duration: video.duration,
    ...video.options,
  }
  const text = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const display = typeof value === 'boolean' ? (value ? '是' : '否') : value
      return `${AI_VIDEO_OPTION_LABELS[key] || key}：${display}`
    })
    .join('；')
  return text || '-'
}

// ========== AI 短剧 ==========

/** AI 短剧生成状态枚举，与后端 AiDramaStatusEnum 一致：角色形象、场景图、镜头视频、成片合成共用 */
export const AiDramaStatusEnum = {
  PENDING: 10, // 待处理
  IN_PROGRESS: 20, // 生成中
  SAVING: 30, // 转存中
  SUCCESS: 40, // 已完成
  FAIL: 50, // 已失败
} as const

/** AI 短剧是否未结束：待处理、生成中、转存中 */
export function isAiDramaRunning(status?: number) {
  return status === AiDramaStatusEnum.PENDING
    || status === AiDramaStatusEnum.IN_PROGRESS
    || status === AiDramaStatusEnum.SAVING
}

/** AI 短剧制作步骤枚举：项目页的步骤条 */
export const AiDramaStepEnum = {
  IDEA: 1, // 故事想法
  SCRIPT: 2, // 剧本审阅
  ASSET: 3, // 资产配置
  STORYBOARD: 4, // 分镜与成片
} as const

/** AI 短剧项目状态枚举，与后端 AiDramaProjectStatusEnum 一致 */
export const AiDramaProjectStatusEnum = {
  DRAFT: 10, // 草稿
  SCRIPT_CHANGED: 20, // 剧本已修改
  STORYBOARD_READY: 30, // 分镜已就绪
} as const

/** AI 短剧画风枚举，与后端 AiDramaStyleEnum 一致 */
export const AiDramaStyleEnum = {
  SCRIPT_TONE: 1, // 随剧本基调
} as const

/** AI 短剧音频类型枚举，与后端 AiDramaAudioTypeEnum 一致 */
export const AiDramaAudioTypeEnum = {
  SAMPLE: 1, // 角色样音
  NARRATION: 2, // 旁白
  DIALOGUE: 3, // 对白
  BGM: 4, // 配乐
  REFERENCE: 5, // 参考音频
} as const

/** AI 短剧视觉资产类型枚举，与后端 AiDramaVisualAssetKindEnum 一致 */
export const AiDramaVisualAssetKindEnum = {
  PROP: 1, // 道具
  SHOT_FRAME: 2, // 关键帧
  ARCHIVED_PROP: 3, // 道具历史版本
  ARCHIVED_SHOT_FRAME: 4, // 关键帧历史版本
} as const

/** AI 短剧画幅选项，与后端 AiDramaAspectRatioEnum 一致 */
export const AI_DRAMA_ASPECT_RATIOS = ['9:16', '16:9', '4:3', '3:4', '1:1', '21:9']

/** AI 短剧公开广场的时长筛选，与后端 AiDramaDurationTypeEnum 一致 */
export const AI_DRAMA_DURATION_TYPE_OPTIONS = [
  { label: '30 秒内', value: 1 },
  { label: '30-60 秒', value: 2 },
  { label: '1 分钟以上', value: 3 },
]

/** AI 短剧任务类型枚举，与后端 AiDramaTaskTypeEnum 一致 */
export const AiDramaTaskTypeEnum = {
  APPEARANCE: 1, // 角色形象
  LOCATION: 2, // 场景图
  VISUAL_ASSET: 3, // 视觉资产
  STORYBOARD: 4, // 镜头视频
  COMPOSE: 5, // 成片合成
} as const

/** 格式化 AI 短剧时长：秒转 m:ss */
export function formatAiDramaDuration(seconds?: number) {
  if (seconds === undefined || seconds === null) {
    return '-'
  }
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
