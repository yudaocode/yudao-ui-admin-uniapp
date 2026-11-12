import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { downloadApiFile } from '@/utils/download'

/** AI PPT 幻灯片的图片版本 */
export interface PptSlideImageVersion {
  url: string // 图片地址：库里保存的地址，切换版本时提交它
  prompt: string // 实际发给绘图模型的完整提示词
  createTime: string // 生成时间
}

/** AI PPT 幻灯片（一页） */
export interface PptSlide {
  index: number // 页码，从 1 开始
  theme?: string // 本页主题
  title?: string // 本页标题
  points?: string[] // 本页要点
  imagePrompt: string // 首次生图的提示词
  imageUrl?: string // 当前图地址，与历史版本的 url 对应；为空表示还没有图
  status?: number // 本页最近一次生成的状态，为空表示待生成，参见 AiPptStatusEnum
  errorMessage?: string // 本页最近一次失败的原因
  images?: PptSlideImageVersion[] // 历史版本
}

/** AI PPT */
export interface Ppt {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称，仅管理端返回
  title: string // 标题
  source: number // 素材来源，参见 AiPptSourceEnum
  content?: string // 大纲或材料文本
  fileUrl?: string // 上传材料文件地址
  prompt?: string // 风格与设计要求
  mode: number // 格式，参见 AiPptModeEnum
  language: string // 语言：zh-CN、en
  pageCount: number // 请求页数
  chatModelId: number // 对话模型编号
  imageModelId: number // 绘图模型编号
  slides?: PptSlide[] // 分镜与配图
  coverUrl?: string // 封面图地址
  slideCount: number // 分镜页数
  finishCount: number // 已有配图页数
  status: number // 状态，参见 AiPptStatusEnum
  errorMessage?: string // 失败原因
  finishTime?: string // 完成时间
  createTime: string // 创建时间
}

/** AI PPT 生成请求 */
export interface PptGenerateReq {
  source: number // 素材来源：1 粘贴大纲、2 上传材料
  content?: string // 大纲（粘贴大纲）
  fileUrl?: string // 材料文件地址（上传材料），先上传到文件服务
  prompt?: string // 风格与设计要求
  mode: number // 格式
  language: string // 语言，参见 AiPptLanguageEnum
  pageCount: number // 页数
  imageModelId: number // 绘图模型编号
}

/** AI PPT 单页重绘请求 */
export interface PptRedrawReq {
  id: number // PPT 编号
  slideIndex: number // 页码，从 1 开始
  prompt: string // 完整的生图提示词
}

/** AI PPT 切换单页图片版本请求 */
export interface PptSlideImageUpdateReq {
  id: number // PPT 编号
  slideIndex: number // 页码，从 1 开始
  imageUrl: string // 图片地址，必须是该页的历史版本之一
}

// ========== 创作 ==========

/** 生成 PPT：上传材料时只提交文件地址，由后端按地址读取 */
export function generatePpt(data: PptGenerateReq) {
  return http.post<number>('/ai/ppt/generate', data)
}

/** 继续生成我的 PPT */
export function resumePptMy(id: number) {
  return http.post<boolean>(`/ai/ppt/resume-my?id=${id}`)
}

/** 重绘我的 PPT 的一页 */
export function redrawSlideMy(data: PptRedrawReq) {
  return http.post<boolean>('/ai/ppt/redraw-slide-my', data)
}

/** 切换我的 PPT 一页的当前图 */
export function updateSlideImageMy(data: PptSlideImageUpdateReq) {
  return http.put<boolean>('/ai/ppt/update-slide-image-my', data)
}

// ========== 我的 PPT ==========

/** 获得我的 PPT 分页 */
export function getPptMyPage(params: PageParam) {
  return http.get<PageResult<Ppt>>('/ai/ppt/my-page', params)
}

/** 获得我的 PPT */
export function getPptMy(id: number) {
  return http.get<Ppt>(`/ai/ppt/get-my?id=${id}`)
}

/** 导出我的 PPT：仅已完成 */
export function exportPptMy(id: number, format: string, fileName: string) {
  return downloadApiFile('/ai/ppt/export-my', { id, format }, fileName)
}

/** 删除我的 PPT */
export function deletePptMy(id: number) {
  return http.delete<boolean>(`/ai/ppt/delete-my?id=${id}`)
}

// ========== PPT 管理 ==========

/** 获得 PPT 分页 */
export function getPptPage(params: PageParam) {
  return http.get<PageResult<Ppt>>('/ai/ppt/page', params)
}

/** 获得 PPT 详情 */
export function getPpt(id: number) {
  return http.get<Ppt>(`/ai/ppt/get?id=${id}`)
}

/** 导出 PPT：仅已完成 */
export function exportPpt(id: number, format: string, fileName: string) {
  return downloadApiFile('/ai/ppt/export', { id, format }, fileName)
}

/** 删除 PPT */
export function deletePpt(id: number) {
  return http.delete<boolean>(`/ai/ppt/delete?id=${id}`)
}
