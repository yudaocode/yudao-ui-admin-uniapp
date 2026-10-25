<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号消息模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 公众号选择 -->
    <AccountPicker v-model="accountId" @change="handleAccountChange" />

    <!-- 同步模板 -->
    <view v-if="hasAccessByCodes(['mp:message-template:sync'])" class="flex justify-end bg-white px-24rpx py-16rpx">
      <wd-button type="success" size="small" :loading="syncing" @click="handleSync">
        同步模板
      </wd-button>
    </view>

    <!-- 模板列表 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
          加载中...
        </view>
        <view v-else-if="list.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无消息模板数据
        </view>
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
            {{ item.title || '-' }}
          </view>
          <view class="mb-12rpx break-all text-26rpx text-[#666]">
            模板 ID：{{ item.templateId || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            行业：{{ item.primaryIndustry || '-' }} / {{ item.deputyIndustry || '-' }}
          </view>
          <view class="mb-12rpx whitespace-pre-wrap text-26rpx text-[#666]">
            {{ normalizeEscapedNewlines(item.content || '-') }}
          </view>
          <view class="mb-12rpx whitespace-pre-wrap text-26rpx text-[#666]">
            示例：{{ normalizeEscapedNewlines(item.example || '-') }}
          </view>
          <view class="mb-20rpx text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="flex gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['mp:message-template:send'])"
              class="flex-1" size="small" type="primary" @click="handleSend(item)"
            >
              发送
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['mp:message-template:delete'])"
              class="flex-1" size="small" type="danger" @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { MsgTemplate } from '@/api/mp/messageTemplate'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteMessageTemplate, getMessageTemplateList, syncMessageTemplate } from '@/api/mp/messageTemplate'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus, normalizeEscapedNewlines } from '@/utils'
import { formatDateTime } from '@/utils/date'
import AccountPicker from '@/pages-mp/account/components/account-picker.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const accountId = ref<number>() // 当前公众号编号
const list = ref<MsgTemplate[]>([]) // 列表数据
const loading = ref(false) // 列表加载状态
const syncing = ref(false) // 同步状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 公众号切换 */
function handleAccountChange(id: number) {
  accountId.value = id
  getList()
}

/** 查询模板列表 */
async function getList() {
  if (!accountId.value) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getMessageTemplateList({ accountId: accountId.value })
  } finally {
    loading.value = false
  }
}

/** 同步模板 */
async function handleSync() {
  if (syncing.value) {
    return
  }
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定同步公众号消息模板吗？',
    })
  } catch {
    return
  }
  syncing.value = true
  try {
    await syncMessageTemplate(accountId.value)
    toast.success('同步成功')
    await getList()
  } finally {
    syncing.value = false
  }
}

/** 发送模板消息 */
function handleSend(item: MsgTemplate) {
  uni.navigateTo({
    url: `/pages-mp/message-template/send/index?id=${item.id}&accountId=${accountId.value}`,
  })
}

/** 删除模板 */
async function handleDelete(item: MsgTemplate) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定删除「${item.title || ''}」吗？`,
    })
  } catch {
    return
  }
  await deleteMessageTemplate(parseId(item.id) as number)
  toast.success('删除成功')
  getList()
}
</script>
