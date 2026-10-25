<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号标签"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 公众号选择 -->
    <AccountPicker v-model="accountId" @change="handleAccountChange" />

    <!-- 同步标签 -->
    <view v-if="hasAccessByCodes(['mp:tag:sync'])" class="flex justify-end bg-white px-24rpx py-16rpx">
      <wd-button type="success" size="small" :loading="syncing" @click="handleSync">
        同步标签
      </wd-button>
    </view>

    <!-- 标签列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无公众号标签数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <wd-tag plain>
              {{ item.count || 0 }} 粉丝
            </wd-tag>
          </view>
          <view class="mb-20rpx text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="flex gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['mp:tag:update'])"
              class="flex-1" size="small" type="warning" @click="handleEdit(item)"
            >
              修改
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['mp:tag:delete'])"
              class="flex-1" size="small" type="danger" @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mp:tag:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { Tag } from '@/api/mp/tag'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteTag, getTagPage, syncTag } from '@/api/mp/tag'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
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
const list = ref<Tag[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const syncing = ref(false) // 同步状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 公众号切换 */
function handleAccountChange(id: number) {
  accountId.value = id
  reload()
}

/** 查询标签列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!accountId.value) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getTagPage({
      accountId: accountId.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增标签 */
function handleAdd() {
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  uni.navigateTo({ url: `/pages-mp/tag/form/index?accountId=${accountId.value}` })
}

/** 编辑标签 */
function handleEdit(item: Tag) {
  uni.navigateTo({ url: `/pages-mp/tag/form/index?id=${item.id}&accountId=${accountId.value}` })
}

/** 删除标签 */
async function handleDelete(item: Tag) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.name}」吗？`,
    })
  } catch {
    return
  }
  await deleteTag(parseId(item.id) as number)
  toast.success('删除成功')
  reload()
}

/** 同步标签 */
async function handleSync() {
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定同步公众号标签吗？',
    })
  } catch {
    return
  }
  syncing.value = true
  try {
    await syncTag(accountId.value)
    toast.success('同步成功')
    reload()
  } finally {
    syncing.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mp:tag:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mp:tag:reload', reload)
})
</script>
