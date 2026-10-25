<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="自动回复"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 公众号选择 -->
    <AccountPicker v-model="accountId" @change="handleAccountChange" />

    <!-- 类型切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="关注时回复" />
        <wd-tab title="消息回复" />
        <wd-tab title="关键词回复" />
      </wd-tabs>
    </view>

    <!-- 回复列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无自动回复数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view v-if="currentType === MpAutoReplyTypeEnum.MESSAGE" class="mb-12rpx text-28rpx text-[#666]">
            请求类型：<dict-tag :type="DICT_TYPE.MP_MESSAGE_TYPE" :value="item.requestMessageType" />
          </view>
          <view v-if="currentType === MpAutoReplyTypeEnum.KEYWORD" class="mb-12rpx text-28rpx text-[#666]">
            关键词：{{ item.requestKeyword || '-' }}
          </view>
          <view v-if="currentType === MpAutoReplyTypeEnum.KEYWORD" class="mb-12rpx text-28rpx text-[#666]">
            匹配类型：<dict-tag :type="DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH" :value="item.requestMatch" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            回复类型：<dict-tag :type="DICT_TYPE.MP_MESSAGE_TYPE" :value="item.responseMessageType" />
          </view>
          <view class="mb-20rpx rounded-8rpx bg-[#f8f8f8] p-20rpx text-28rpx text-[#333]">
            <ReplyContent
              :type="item.responseMessageType"
              :content="item.responseContent"
              :media-url="item.responseMediaUrl"
              :title="item.responseTitle"
              :description="item.responseDescription"
              :articles="item.responseArticles"
              :thumb-media-url="item.responseThumbMediaUrl"
              :music-url="item.responseMusicUrl"
              :hq-music-url="item.responseHqMusicUrl"
            />
          </view>
          <view class="mb-20rpx text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="flex gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['mp:auto-reply:update'])"
              class="flex-1" size="small" type="warning" @click="handleEdit(item)"
            >
              修改
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['mp:auto-reply:delete'])"
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
      v-if="canCreate"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { AutoReply } from '@/api/mp/autoReply'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteAutoReply, getAutoReplyPage } from '@/api/mp/autoReply'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MpAutoReplyTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import AccountPicker from '@/pages-mp/account/components/account-picker.vue'
import ReplyContent from '../components/reply-content.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const typeList = [MpAutoReplyTypeEnum.FOLLOW, MpAutoReplyTypeEnum.MESSAGE, MpAutoReplyTypeEnum.KEYWORD]
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const accountId = ref<number>() // 当前公众号编号
const tabIndex = ref(2) // 回复类型索引
const list = ref<AutoReply[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

const currentType = computed(() => typeList[tabIndex.value])
const canCreate = computed(() => {
  if (!hasAccessByCodes(['mp:auto-reply:create'])) {
    return false
  }
  return currentType.value !== MpAutoReplyTypeEnum.FOLLOW || list.value.length === 0
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 公众号切换 */
function handleAccountChange(id: number) {
  accountId.value = id
  reload()
}

/** 类型切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  list.value = []
  reload()
}

/** 查询自动回复 */
async function queryList(pageNo: number, pageSize: number) {
  if (!accountId.value) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getAutoReplyPage({
      accountId: accountId.value,
      type: currentType.value,
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

/** 新增自动回复 */
function handleAdd() {
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  uni.navigateTo({ url: `/pages-mp/auto-reply/form/index?accountId=${accountId.value}&type=${currentType.value}` })
}

/** 编辑自动回复 */
function handleEdit(item: AutoReply) {
  uni.navigateTo({ url: `/pages-mp/auto-reply/form/index?id=${item.id}&accountId=${accountId.value}&type=${currentType.value}` })
}

/** 删除自动回复 */
async function handleDelete(item: AutoReply) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该自动回复吗？',
    })
  } catch {
    return
  }
  await deleteAutoReply(parseId(item.id) as number)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mp:auto-reply:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mp:auto-reply:reload', reload)
})
</script>
