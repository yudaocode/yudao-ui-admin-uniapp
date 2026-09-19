import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

/** OA 邮箱账号 */
export interface MailAccount {
  id?: number // 账号编号
  providerId?: number // 服务配置编号
  mail: string // 邮箱地址
  userName?: string // 归属人姓名
  username: string // 登录用户名
  password?: string // 密码或授权码，修改时留空表示不变
  defaultStatus: boolean // 是否默认发件账号
  status: number // 状态
}

/** OA 邮箱连接配置 */
export interface MailConnectionConfig {
  host: string // 服务器域名
  port: number // 服务器端口
  sslEnable: boolean // 是否开启 SSL
  starttlsEnable: boolean // 是否开启 STARTTLS
}

/** OA 邮箱服务配置 */
export interface MailProvider {
  id?: number // 服务配置编号
  name: string // 名称
  imap: MailConnectionConfig // 收信连接
  smtp: MailConnectionConfig // 发信连接
  status: number // 状态
}

/** OA 邮箱文件夹 */
export interface MailFolder {
  key: string // 目录查询标识，自定义目录为编号字符串
  name: string // 显示名称
  unreadCount?: number // 未读数量
}

/** OA 邮件附件 */
export interface MailAttachment {
  part: string // MIME 部件路径
  name: string // 附件名称
  size?: number // 附件大小，单位字节
}

/** OA 邮件 */
export interface MailMessage {
  id?: number // 邮件索引编号
  accountId: number // 邮箱账号编号
  folderId?: number // 文件夹编号
  subject: string // 主题
  sender?: string // 发件人
  recipients?: string[] // 收件人
  ccs?: string[] // 抄送人
  replyTos?: string[] // 回复地址
  receiveTime?: string // 接收时间
  readStatus?: boolean // 是否已读
  hasAttach?: boolean // 是否有附件
  size?: number // 邮件大小，单位字节
  content?: string // 安全 HTML 正文
  attachments?: MailAttachment[] // 附件
  attachmentParts?: string[] // 保留的原附件路径，空列表表示移除全部
  draftId?: number // 原草稿编号
  sourceId?: number // 回复或转发的原邮件编号
  mode?: string // 写信方式
}

/** 查询本人邮箱账号列表 */
export function getMailAccountList(status?: number) {
  return http.get<MailAccount[]>('/oa/mail-account/list', status !== undefined ? { status } : undefined)
}

/** 查询当前租户启用邮箱及归属人姓名 */
export function getSimpleMailAccountList() {
  return http.get<MailAccount[]>('/oa/mail-account/simple-list')
}

/** 查询本人邮箱账号 */
export function getMailAccount(id: number) {
  return http.get<MailAccount>(`/oa/mail-account/get?id=${id}`)
}

/** 绑定本人邮箱账号 */
export function createMailAccount(data: Partial<MailAccount>) {
  return http.post<number>('/oa/mail-account/create', data)
}

/** 修改本人邮箱账号 */
export function updateMailAccount(data: Partial<MailAccount>) {
  return http.put<boolean>('/oa/mail-account/update', data)
}

/** 设置默认邮箱账号 */
export function updateMailAccountDefault(id: number) {
  return http.put<boolean>(`/oa/mail-account/update-default?id=${id}`)
}

/** 移除邮箱账号绑定 */
export function deleteMailAccount(id: number) {
  return http.delete<boolean>(`/oa/mail-account/delete?id=${id}`)
}

/** 测试邮箱连接，不发送邮件 */
export function testMailAccountConnection(id: number) {
  return http.post<{ imap: boolean, smtp: boolean }>(`/oa/mail-account/test-connection?id=${id}`)
}

/** 查询邮箱服务配置精简列表 */
export function getSimpleMailProviderList() {
  return http.get<MailProvider[]>('/oa/mail-provider/simple-list')
}

/** 查询邮箱服务配置列表 */
export function getMailProviderList(status?: number) {
  return http.get<MailProvider[]>('/oa/mail-provider/list', status !== undefined ? { status } : undefined)
}

/** 查询邮箱服务配置 */
export function getMailProvider(id: number) {
  return http.get<MailProvider>(`/oa/mail-provider/get?id=${id}`)
}

/** 新增邮箱服务配置 */
export function createMailProvider(data: Partial<MailProvider>) {
  return http.post<number>('/oa/mail-provider/create', data)
}

/** 修改邮箱服务配置 */
export function updateMailProvider(data: Partial<MailProvider>) {
  return http.put<boolean>('/oa/mail-provider/update', data)
}

/** 删除邮箱服务配置 */
export function deleteMailProvider(id: number) {
  return http.delete<boolean>(`/oa/mail-provider/delete?id=${id}`)
}

/** 查询邮箱文件夹列表 */
export function getMailFolderList(accountId: number) {
  return http.get<MailFolder[]>(`/oa/mail-folder/list?accountId=${accountId}`)
}

/** 查询邮件分页 */
export function getMailMessagePage(params: PageParam & {
  accountId: number
  folderKey: string
  keyword?: string
  readStatus?: boolean
  hasAttach?: boolean
}) {
  return http.get<PageResult<MailMessage>>('/oa/mail-message/page', params)
}

/** 查询邮件详情 */
export function getMailMessage(id: number) {
  return http.get<MailMessage>(`/oa/mail-message/get?id=${id}`)
}

/** 更新邮件已读状态 */
export function updateMailMessageRead(id: number, readStatus: boolean) {
  return http.put<boolean>(`/oa/mail-message/update-read?id=${id}&readStatus=${readStatus}`)
}

/** 删除邮件，垃圾箱中为彻底删除 */
export function deleteMailMessage(id: number) {
  return http.delete<boolean>(`/oa/mail-message/delete?id=${id}`)
}

/** 恢复已删除邮件到收件箱 */
export function restoreMailMessage(id: number) {
  return http.put<boolean>(`/oa/mail-message/restore?id=${id}`)
}

/** 全量同步远端邮件索引 */
export function syncMailMessageList(accountId: number) {
  return http.post<number>(`/oa/mail-message/sync?accountId=${accountId}`)
}

/** 获得写信预填数据 */
export function getMailMessageCompose(id: number, mode: string) {
  return http.get<MailMessage>(`/oa/mail-message/compose?id=${id}&mode=${mode}`)
}

/** 保存草稿 */
export function saveMailMessageDraft(data: Partial<MailMessage>) {
  return http.post<number>('/oa/mail-message/save-draft', data)
}

/** 发送邮件 */
export function sendMailMessage(data: Partial<MailMessage>) {
  return http.post<string>('/oa/mail-message/send', data)
}

/** 携带新附件提交邮件 multipart 请求，仅 H5 支持选择本地文件 */
async function postMailMultipart<T>(url: string, data: Partial<MailMessage>, files: File[]): Promise<T> {
  const token = await useTokenStore().tryGetValidToken()
  const tenantId = useUserStore().tenantId
  const header: Record<string, string> = {}
  if (token) {
    header.Authorization = `Bearer ${token}`
  }
  if (tenantId) {
    header['tenant-id'] = String(tenantId)
  }
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  files.forEach(file => form.append('files', file, file.name))
  const res = await fetch(`${getEnvBaseUrl()}${url}`, {
    method: 'POST',
    headers: header,
    body: form,
  })
  const result = await res.json()
  if (result.code !== 0) {
    uni.showToast({ icon: 'none', title: result.msg || '提交失败' })
    throw new Error(result.msg || '提交失败')
  }
  return result.data
}

/** 发送带新附件的邮件，仅 H5 支持 */
export function sendMailMessageWithFiles(data: Partial<MailMessage>, files: File[]) {
  return postMailMultipart<string>('/oa/mail-message/send', data, files)
}

/** 保存带新附件的草稿，仅 H5 支持 */
export function saveMailMessageDraftWithFiles(data: Partial<MailMessage>, files: File[]) {
  return postMailMultipart<number>('/oa/mail-message/save-draft', data, files)
}

/** 下载本人邮件附件：H5 浏览器打开，其他端下载后用系统能力打开 */
export async function downloadMailAttachment(id: number, part: string, name: string) {
  const token = await useTokenStore().tryGetValidToken()
  const tenantId = useUserStore().tenantId
  const url = `${getEnvBaseUrl()}/oa/mail-message/attachment?id=${id}&part=${encodeURIComponent(part)}`
  const header: Record<string, string> = {}
  if (token) {
    header.Authorization = `Bearer ${token}`
  }
  if (tenantId) {
    header['tenant-id'] = String(tenantId)
  }
  // #ifdef H5
  const res = await fetch(url, { headers: header })
  if (!res.ok) {
    throw new Error('附件下载失败')
  }
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
  // #endif
  // #ifndef H5
  uni.showLoading({ title: '下载中...', mask: true })
  uni.downloadFile({
    url,
    header,
    success: (res) => {
      if (res.statusCode !== 200) {
        uni.showToast({ icon: 'none', title: '附件下载失败' })
        return
      }
      uni.openDocument({
        filePath: res.tempFilePath,
        showMenu: true,
        fail: () => uni.showToast({ icon: 'none', title: '附件打开失败' }),
      })
    },
    fail: () => uni.showToast({ icon: 'none', title: '附件下载失败' }),
    complete: () => uni.hideLoading(),
  })
  // #endif
}
