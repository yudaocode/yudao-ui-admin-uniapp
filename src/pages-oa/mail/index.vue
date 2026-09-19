<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="收件箱"
      placeholder safe-area-inset-top fixed
    >
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="sync" size="40rpx" color="#333" @click="handleSync" />
          <wd-icon name="settings" size="40rpx" color="#333" @click="handleAccountManage" />
        </view>
      </template>
    </wd-navbar>

    <!-- 无可用账号引导 -->
    <view v-if="accountLoaded && !accounts.length" class="m-24rpx rounded-20rpx bg-white px-32rpx py-64rpx text-center">
      <view class="mx-auto mb-24rpx h-104rpx w-104rpx flex items-center justify-center rounded-full bg-[#edf4ff]">
        <wd-icon name="email" size="52rpx" color="#4380d9" />
      </view>
      <view class="mb-12rpx text-32rpx text-[#1f2937] font-medium">
        还没有可用的邮箱账号
      </view>
      <view class="mb-32rpx text-26rpx text-[#94a3b8]">
        添加并启用账号后，即可收发邮件
      </view>
      <wd-button type="primary" @click="handleAccountManage">
        前往账号管理
      </wd-button>
    </view>

    <template v-else>
      <!-- 当前账号 -->
      <view class="shrink-0 bg-white px-24rpx pb-20rpx pt-12rpx">
        <view class="flex items-center gap-16rpx rounded-16rpx bg-[#f7f8fa] p-20rpx" @click="accountVisible = true">
          <view class="h-72rpx w-72rpx flex shrink-0 items-center justify-center rounded-16rpx bg-[#edf4ff]">
            <wd-icon name="email" size="36rpx" color="#4380d9" />
          </view>
          <view class="min-w-0 flex-1">
            <view class="mb-6rpx flex items-center gap-12rpx text-22rpx text-[#94a3b8]">
              <text>当前邮箱</text>
              <text v-if="currentAccount?.defaultStatus" class="text-[#4380d9]">默认账号</text>
            </view>
            <view class="truncate text-28rpx text-[#334155] font-medium">
              {{ currentAccount?.mail || '请选择邮箱账号' }}
            </view>
          </view>
          <wd-icon name="arrow-down" size="28rpx" color="#94a3b8" />
        </view>
      </view>

      <!-- 文件夹页签 -->
      <scroll-view v-if="folders.length" scroll-x :show-scrollbar="false" class="shrink-0 whitespace-nowrap bg-white pb-12rpx">
        <view class="w-max inline-flex gap-12rpx px-24rpx">
          <view
            v-for="folder in folders"
            :key="folder.key"
            class="inline-flex shrink-0 items-center gap-10rpx whitespace-nowrap rounded-12rpx px-24rpx py-16rpx text-26rpx"
            :class="folderKey === folder.key ? 'bg-[#edf4ff] text-[#1677ff] font-medium' : 'text-[#64748b]'"
            @click="handleFolderChange(folder.key)"
          >
            <text>{{ folder.name }}</text>
            <text v-if="folder.unreadCount" class="rounded-full bg-[#e8edf5] px-10rpx text-20rpx text-[#64748b]">
              {{ folder.unreadCount }}
            </text>
          </view>
        </view>
      </scroll-view>

      <!-- 搜索组件 -->
      <SearchForm :key="`${currentAccount?.id}-${folderKey}`" @search="handleQuery" @reset="handleReset" />

      <!-- 邮件列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        :empty-view-text="emptyText"
        @query="queryList"
      >
        <view v-if="list.length" class="mx-24rpx my-20rpx overflow-hidden rounded-20rpx bg-white">
          <view
            v-for="item in list"
            :key="item.id"
            class="flex gap-20rpx border-b border-[#f0f2f5] border-b-solid p-24rpx last:border-b-0"
            @click="handleOpen(item)"
          >
            <view
              class="relative mt-2rpx h-68rpx w-68rpx flex shrink-0 items-center justify-center rounded-full text-28rpx font-medium"
              :class="item.readStatus ? 'bg-[#f1f3f6] text-[#94a3b8]' : 'bg-[#edf4ff] text-[#4380d9]'"
            >
              {{ getCorrespondent(item).charAt(0) }}
              <view v-if="!item.readStatus" class="absolute right-0 top-0 h-14rpx w-14rpx rounded-full bg-[#1677ff]" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-10rpx flex items-center justify-between gap-12rpx">
                <text
                  class="min-w-0 flex-1 truncate text-28rpx"
                  :class="item.readStatus ? 'text-[#64748b]' : 'text-[#1f2937] font-semibold'"
                >
                  {{ getCorrespondent(item) }}
                </text>
                <text class="shrink-0 text-22rpx text-[#94a3b8]">{{ formatDate(item.receiveTime, 'MM-DD HH:mm') }}</text>
              </view>
              <view class="line-clamp-2 break-words text-26rpx text-[#475569] leading-40rpx">
                {{ item.subject || '（无主题）' }}
              </view>
              <view v-if="item.hasAttach" class="mt-10rpx flex items-center gap-6rpx text-22rpx text-[#94a3b8]">
                <wd-icon name="attach" size="24rpx" />
                <text>含附件</text>
              </view>
            </view>
          </view>
        </view>
      </z-paging>

      <!-- 写信按钮 -->
      <wd-fab
        v-if="currentAccount"
        position="right-bottom"
        type="primary"
        inactive-icon="edit"
        :expandable="false"
        @click="handleCompose(OA_MAIL_COMPOSE_MODE.NEW)"
      />
    </template>

    <!-- 账号切换 -->
    <wd-action-sheet
      v-model="accountVisible"
      :actions="accountActions"
      title="切换邮箱账号"
      cancel-text="取消"
      @select="handleAccountSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MailAccount, MailFolder, MailMessage } from '@/api/oa/mail'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  getMailAccountList,
  getMailFolderList,
  getMailMessagePage,
  syncMailMessageList,
} from '@/api/oa/mail'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { CommonStatusEnum } from '@/utils/constants'
import { OA_MAIL_COMPOSE_MODE, OA_MAIL_FOLDER_KEY } from '../utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const accounts = ref<MailAccount[]>([]) // 本人启用的邮箱账号
const accountLoaded = ref(false) // 账号列表是否已加载
const accountVisible = ref(false) // 账号切换弹窗显示状态
const currentAccount = ref<MailAccount>() // 当前邮箱账号
const folders = ref<MailFolder[]>([]) // 已同步的文件夹
const folderKey = ref<string>(OA_MAIL_FOLDER_KEY.INBOX) // 当前文件夹标识
const list = ref<MailMessage[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const syncing = ref(false) // 全量同步进行中，防连点重入
const accountActions = computed(() => // 账号切换操作项
  accounts.value.map(item => ({ name: item.mail })))
const emptyText = computed(() => // 空态文案：区分未同步和正常空列表
  folders.value.length ? '暂无邮件' : '请点击左上角同步，获取邮箱邮件')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 收件显示发件人，已发送和草稿显示收件人 */
function getCorrespondent(item: MailMessage) {
  if (folderKey.value === OA_MAIL_FOLDER_KEY.SENT || folderKey.value === OA_MAIL_FOLDER_KEY.DRAFTS) {
    return item.recipients?.join('、') || '（无收件人）'
  }
  const sender = item.sender || '-'
  return sender.replace(/<[^>]*>/g, '').replace(/^"|"$/g, '').trim() || sender
}

/** 查询邮件列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!currentAccount.value?.id) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getMailMessagePage({
      ...queryParams.value,
      accountId: currentAccount.value.id,
      folderKey: folderKey.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 刷新文件夹未读数（轻操作不重置列表页码） */
async function refreshFolders() {
  if (currentAccount.value?.id) {
    folders.value = await getMailFolderList(currentAccount.value.id)
  }
}

/** 刷新文件夹与列表 */
async function handleReload() {
  await refreshFolders()
  pagingRef.value?.reload()
}

/** 本地移除已删除/恢复的邮件行并刷新文件夹，保留当前页码 */
function handleRemoveMessage(id: number) {
  const index = list.value.findIndex(item => item.id === id)
  if (index >= 0) {
    list.value.splice(index, 1)
  }
  refreshFolders()
}

/** 同步已读状态，筛选不再匹配时仅移除该行 */
function handleReadMessage({ id, readStatus }: { id: number, readStatus: boolean }) {
  const index = list.value.findIndex(item => item.id === id)
  if (index >= 0) {
    if ((folderKey.value === OA_MAIL_FOLDER_KEY.UNREAD && readStatus)
      || (queryParams.value.readStatus !== undefined && queryParams.value.readStatus !== readStatus)) {
      list.value.splice(index, 1)
    } else {
      list.value[index].readStatus = readStatus
    }
  }
  refreshFolders()
}

/** 切换邮箱账号：重载该账号文件夹并重置文件夹页签与搜索条件 */
async function handleAccountSelect({ index }: { index: number }) {
  currentAccount.value = accounts.value[index]
  folderKey.value = OA_MAIL_FOLDER_KEY.INBOX
  queryParams.value = {}
  await handleReload()
}

/** 切换文件夹 */
function handleFolderChange(key: string) {
  folderKey.value = key
  handleQuery()
}

/** 全量同步远端邮件索引 */
async function handleSync() {
  if (!currentAccount.value?.id || syncing.value) {
    return
  }
  syncing.value = true
  toast.loading('同步中...')
  try {
    const count = await syncMailMessageList(currentAccount.value.id)
    toast.success(`同步成功，共 ${count} 封邮件`)
    await handleReload()
  } finally {
    syncing.value = false
    toast.close()
  }
}

/** 打开邮件：草稿进入写信编辑，其他进入详情 */
function handleOpen(row: MailMessage) {
  if (folderKey.value === OA_MAIL_FOLDER_KEY.DRAFTS) {
    uni.navigateTo({
      url: `/pages-oa/mail/form/index?accountId=${row.accountId}&mode=${OA_MAIL_COMPOSE_MODE.DRAFT}&id=${row.id}`,
    })
    return
  }
  uni.navigateTo({ url: `/pages-oa/mail/detail/index?id=${row.id}&folderKey=${folderKey.value}` })
}

/** 写信 */
function handleCompose(mode: string) {
  if (!currentAccount.value?.id) {
    return
  }
  uni.navigateTo({ url: `/pages-oa/mail/form/index?accountId=${currentAccount.value.id}&mode=${mode}` })
}

/** 账号管理 */
function handleAccountManage() {
  uni.navigateTo({ url: '/pages-oa/mail/account/index' })
}

/** 初始化 */
onMounted(async () => {
  accounts.value = await getMailAccountList(CommonStatusEnum.ENABLE)
  accountLoaded.value = true
  currentAccount.value = accounts.value.find(item => item.defaultStatus) || accounts.value[0]
  if (currentAccount.value?.id) {
    folders.value = await getMailFolderList(currentAccount.value.id)
    // 账号异步就绪后 z-paging 首查可能已按空账号完成，显式触发分页
    pagingRef.value?.reload()
  }
  uni.$on('oa:mail:reload', handleReload)
  uni.$on('oa:mail:refresh-folders', refreshFolders)
  uni.$on('oa:mail:remove-message', handleRemoveMessage)
  uni.$on('oa:mail:read-message', handleReadMessage)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:mail:reload', handleReload)
  uni.$off('oa:mail:refresh-folders', refreshFolders)
  uni.$off('oa:mail:remove-message', handleRemoveMessage)
  uni.$off('oa:mail:read-message', handleReadMessage)
})
</script>
