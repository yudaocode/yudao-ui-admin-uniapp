import { http } from '@/http/http'

/** AI 短剧音频 */
export interface DramaAudio {
  id: number // 编号
  projectId: number // 项目编号
  characterId?: number // 角色编号
  type: number // 类型，参见 AiDramaAudioTypeEnum
  name?: string // 名称
  text?: string // 文本
  voice?: string // 音色
  storyboardId?: number // 对白所属的分镜
  duration?: number // 时长（秒）
  fileUrl: string // 文件地址
  storyboardIds?: number[] // 使用的分镜：配乐、参考音频；为空表示候选
  volume?: number // 音量（0-2）
  startOffset?: number // 起始偏移（秒）
  musicId?: number // 来源的 AI 音乐编号
  createTime?: string // 创建时间
}

/** AI 短剧音频创建请求 */
export interface DramaAudioCreateReq {
  projectId: number // 项目编号
  characterId?: number // 角色编号
  type: number // 类型，参见 AiDramaAudioTypeEnum
  name?: string // 名称
  fileUrl: string // 文件地址
  duration?: number // 时长（秒）
  storyboardIds?: number[] // 使用的分镜
}

/** AI 短剧音频修改请求：配乐、参考音频 */
export interface DramaAudioUpdateReq {
  id: number // 编号
  name?: string // 名称
  storyboardIds?: number[] // 使用的分镜
  volume?: number // 音量（0-2）
  startOffset?: number // 起始偏移（秒）
}

/** AI 短剧音频生成请求 */
export interface DramaAudioGenerateReq {
  projectId: number // 项目编号
  characterId?: number // 角色编号
  modelId: number // 模型编号
  voice?: string // 音色
  text: string // 文本
  speed?: number // 语速
}

/** AI 短剧选用 AI 音乐为配乐请求 */
export interface DramaAudioMusicReq {
  projectId: number // 项目编号
  musicId: number // AI 音乐编号
  storyboardIds?: number[] // 使用的分镜
}

/** AI 短剧动作参考视频 */
export interface DramaMotionReference {
  id: number // 编号
  projectId: number // 项目编号
  name: string // 名称
  fileUrl: string // 文件地址
  duration?: number // 时长（秒）
  createTime?: string // 创建时间
}

/** AI 短剧动作参考视频创建请求 */
export interface DramaMotionReferenceCreateReq {
  projectId: number // 项目编号
  name: string // 名称
  fileUrl: string // 文件地址
}

/** AI 短剧角色形象 */
export interface DramaAppearance {
  id: number // 编号
  characterId: number // 角色编号
  appearanceIndex: number // 形象序号，从 0 开始
  changeReason?: string // 变化原因
  description?: string // 描述
  referenceImageUrl?: string // 参考图
  imageUrls?: string[] // 候选图
  imageDescriptions?: string[] // 候选图的提示词，与候选图一一对应
  selectedIndex?: number // 选用的候选图下标
  previousImageUrls?: string[] // 上一版候选图：不为空时可撤销
  modelId?: number // 模型编号
  status?: number // 状态，参见 AiDramaStatusEnum
  errorMessage?: string // 错误信息
  updateTime?: string // 更新时间
}

/** AI 短剧角色形象创建 / 修改请求 */
export interface DramaAppearanceSaveReq {
  id?: number // 编号：修改时必填
  characterId: number // 角色编号
  changeReason?: string // 变化原因
  description?: string // 描述
  referenceImageUrl?: string // 参考图
  selectedIndex?: number // 选用的候选图下标
}

/** AI 短剧角色 */
export interface DramaCharacter {
  id: number // 编号
  projectId: number // 项目编号
  name: string // 名称
  aliases?: string // 别名
  roleLevel?: string // 角色等级，参见 ai_drama_character_role_level 字典
  sex?: number // 性别
  ageRange?: string // 年龄段
  personalityTags?: string[] // 性格标签
  costumeTier?: number // 服装档次，参见 ai_drama_character_costume_tier 字典
  description?: string // 描述
  prompt?: string // 提示词
  referenceImageUrl?: string // 参考图
  voiceDescription?: string // 声音描述
  sampleText?: string // 样音文本
  sampleAudioId?: number // 选用的样音编号
  appearances: DramaAppearance[] // 形象
  audios: DramaAudio[] // 音频
}

/** AI 短剧角色创建 / 修改请求 */
export interface DramaCharacterSaveReq {
  id?: number // 编号：修改时必填
  projectId: number // 项目编号
  name: string // 名称
  aliases?: string // 别名
  roleLevel?: string // 角色等级
  sex?: number // 性别
  ageRange?: string // 年龄段
  personalityTags?: string[] // 性格标签
  costumeTier?: number // 服装档次
  description?: string // 描述
  prompt?: string // 提示词
  referenceImageUrl?: string // 参考图
  voiceDescription?: string // 声音描述
  sampleText?: string // 样音文本
}

/** AI 短剧场景 */
export interface DramaLocation {
  id: number // 编号
  projectId: number // 项目编号
  name: string // 名称
  description?: string // 描述
  crowd?: boolean // 是否有群演
  crowdDescription?: string // 群演描述
  availableSlots?: string[] // 可站位置
  descriptions?: string[] // 候选图的提示词
  referenceImageUrl?: string // 参考图
  imageUrls?: string[] // 候选图
  imageDescriptions?: string[] // 候选图的提示词
  selectedIndex?: number // 选用的候选图下标
  previousImageUrls?: string[] // 上一版候选图：不为空时可撤销
  modelId?: number // 模型编号
  status?: number // 状态，参见 AiDramaStatusEnum
  errorMessage?: string // 错误信息
  updateTime?: string // 更新时间
}

/** AI 短剧场景创建 / 修改请求 */
export interface DramaLocationSaveReq {
  id?: number // 编号：修改时必填
  projectId: number // 项目编号
  name: string // 名称
  description?: string // 描述
  crowd?: boolean // 是否有群演
  crowdDescription?: string // 群演描述
  availableSlots?: string[] // 可站位置
  descriptions?: string[] // 候选图的提示词
  referenceImageUrl?: string // 参考图
  selectedIndex?: number // 选用的候选图下标
}

/** AI 短剧视觉资产的参考图：道具使用 referenceImageUrl、shotNumbers；关键帧使用 urls、propsVersion、previousImageUrl */
export interface DramaReferenceImages {
  shotNumbers?: number[] // 道具出现的镜头序号
  referenceImageUrl?: string // 参考图
  urls?: string[] // 关键帧的参考图
  propsVersion?: string // 关键帧使用的道具版本
  previousImageUrl?: string // 上一版图片
}

/** AI 短剧视觉资产：道具、关键帧，以及它们的历史版本 */
export interface DramaVisualAsset {
  id: number // 编号
  projectId: number // 项目编号
  storyboardId?: number // 关键帧所属的分镜
  parentId?: number // 历史版本指向当前版本；当前版本为空
  kind: number // 类型，参见 AiDramaVisualAssetKindEnum
  title?: string // 标题
  prompt?: string // 提示词
  referenceImages?: DramaReferenceImages // 参考图
  imageUrl?: string // 图片地址
  modelId?: number // 模型编号
  model?: string // 模型标识
  status?: number // 状态，参见 AiDramaStatusEnum
  errorMessage?: string // 错误信息
  updateTime?: string // 更新时间
}

/** AI 短剧道具创建 / 修改请求 */
export interface DramaVisualAssetSaveReq {
  id?: number // 编号：修改时必填
  projectId: number // 项目编号
  title?: string // 标题
  prompt?: string // 提示词
  referenceImageUrl?: string // 参考图
  shotNumbers?: number[] // 道具出现的镜头序号
}

/** AI 短剧出图请求：角色形象、场景、视觉资产编号；批量补图时为项目编号 */
export interface DramaImageGenerateReq {
  id: number // 编号
  modelId: number // 模型编号
}

const GENERATE_TIMEOUT = 5 * 60 * 1000 // 同步调用模型生成，超时时间放宽到 5 分钟

// ========== 角色 ==========

/** 创建角色 */
export function createDramaCharacter(data: DramaCharacterSaveReq) {
  return http.post<number>('/ai/drama/asset/character/create', data)
}

/** 修改角色 */
export function updateDramaCharacter(data: DramaCharacterSaveReq) {
  return http.put<boolean>('/ai/drama/asset/character/update', data)
}

/** 删除角色 */
export function deleteDramaCharacter(id: number) {
  return http.delete<boolean>(`/ai/drama/asset/character/delete?id=${id}`)
}

// ========== 角色形象 ==========

/** 创建角色形象 */
export function createDramaAppearance(data: DramaAppearanceSaveReq) {
  return http.post<number>('/ai/drama/asset/appearance/create', data)
}

/** 修改角色形象 */
export function updateDramaAppearance(data: DramaAppearanceSaveReq) {
  return http.put<boolean>('/ai/drama/asset/appearance/update', data)
}

/** 删除角色形象 */
export function deleteDramaAppearance(id: number) {
  return http.delete<boolean>(`/ai/drama/asset/appearance/delete?id=${id}`)
}

/** 生成角色形象图 */
export function generateDramaAppearanceImage(data: DramaImageGenerateReq) {
  return http.post<boolean>('/ai/drama/asset/appearance/generate-image', data)
}

/** 删除角色形象的候选图 */
export function deleteDramaAppearanceCandidate(id: number, index: number) {
  return http.delete<boolean>(`/ai/drama/asset/appearance/delete-candidate?id=${id}&index=${index}`)
}

/** 撤销角色形象的上次出图 */
export function undoDramaAppearanceImage(id: number) {
  return http.put<boolean>(`/ai/drama/asset/appearance/undo-image?id=${id}`)
}

// ========== 场景 ==========

/** 创建场景 */
export function createDramaLocation(data: DramaLocationSaveReq) {
  return http.post<number>('/ai/drama/asset/location/create', data)
}

/** 修改场景 */
export function updateDramaLocation(data: DramaLocationSaveReq) {
  return http.put<boolean>('/ai/drama/asset/location/update', data)
}

/** 删除场景 */
export function deleteDramaLocation(id: number) {
  return http.delete<boolean>(`/ai/drama/asset/location/delete?id=${id}`)
}

/** 生成场景图 */
export function generateDramaLocationImage(data: DramaImageGenerateReq) {
  return http.post<boolean>('/ai/drama/asset/location/generate-image', data)
}

/** 删除场景的候选图 */
export function deleteDramaLocationCandidate(id: number, index: number) {
  return http.delete<boolean>(`/ai/drama/asset/location/delete-candidate?id=${id}&index=${index}`)
}

/** 撤销场景的上次出图 */
export function undoDramaLocationImage(id: number) {
  return http.put<boolean>(`/ai/drama/asset/location/undo-image?id=${id}`)
}

// ========== 视觉资产 ==========

/** 创建道具 */
export function createDramaVisualAsset(data: DramaVisualAssetSaveReq) {
  return http.post<number>('/ai/drama/asset/visual-asset/create', data)
}

/** 修改道具 */
export function updateDramaVisualAsset(data: DramaVisualAssetSaveReq) {
  return http.put<boolean>('/ai/drama/asset/visual-asset/update', data)
}

/** 删除道具 */
export function deleteDramaVisualAsset(id: number) {
  return http.delete<boolean>(`/ai/drama/asset/visual-asset/delete?id=${id}`)
}

/** 生成道具、关键帧的图片 */
export function generateDramaVisualAssetImage(data: DramaImageGenerateReq) {
  return http.post<boolean>('/ai/drama/asset/visual-asset/generate-image', data)
}

/** 撤销道具、关键帧的上次出图：与最近的历史版本互换 */
export function undoDramaVisualAssetImage(id: number) {
  return http.put<boolean>(`/ai/drama/asset/visual-asset/undo-image?id=${id}`)
}

/** 补全项目缺失的图片：id 为项目编号，返回提交的数量 */
export function generateDramaMissingImages(data: DramaImageGenerateReq) {
  return http.post<number>('/ai/drama/asset/generate-missing-images', data)
}

// ========== 音频 ==========

/** 创建音频 */
export function createDramaAudio(data: DramaAudioCreateReq) {
  return http.post<number>('/ai/drama/asset/audio/create', data, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 修改配乐、参考音频：名称、使用的分镜、音量、起始偏移 */
export function updateDramaAudio(data: DramaAudioUpdateReq) {
  return http.put<boolean>('/ai/drama/asset/audio/update', data)
}

/** 生成音频：角色样音、旁白 */
export function generateDramaAudio(data: DramaAudioGenerateReq) {
  return http.post<number>('/ai/drama/asset/audio/generate', data, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 选用角色样音 */
export function selectDramaAudio(id: number) {
  return http.put<boolean>(`/ai/drama/asset/audio/select?id=${id}`)
}

/** 删除音频 */
export function deleteDramaAudio(id: number) {
  return http.delete<boolean>(`/ai/drama/asset/audio/delete?id=${id}`)
}

/** 选用 AI 音乐为配乐 */
export function createDramaMusicAudio(data: DramaAudioMusicReq) {
  return http.post<number>('/ai/drama/asset/audio/create-music', data, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

// ========== 动作参考 ==========

/** 创建动作参考视频 */
export function createDramaMotionReference(data: DramaMotionReferenceCreateReq) {
  return http.post<number>('/ai/drama/asset/motion-reference/create', data, undefined, undefined, { timeout: GENERATE_TIMEOUT })
}

/** 删除动作参考视频 */
export function deleteDramaMotionReference(id: number) {
  return http.delete<boolean>(`/ai/drama/asset/motion-reference/delete?id=${id}`)
}
