<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
    @open="handleOpen"
  >
    <view class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]">
      <view class="shrink-0 bg-white px-28rpx pb-18rpx pt-24rpx">
        <view class="flex items-center justify-between">
          <text class="text-32rpx text-[#333] font-semibold">选择聊天角色</text>
          <wd-icon name="close" size="36rpx" color="#666" @click="visible = false" />
        </view>
        <view class="mt-20rpx">
          <wd-search v-model="keyword" placeholder="搜索角色" hide-cancel @search="handleQuery" @clear="handleQuery" />
        </view>
        <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
          <wd-tab title="我的角色" />
          <wd-tab title="公共角色" />
        </wd-tabs>
      </view>

      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        empty-view-text="暂无可用角色"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx flex items-center gap-20rpx rounded-16rpx bg-white p-22rpx"
            @click="handleSelect(item)"
          >
            <wd-img
              v-if="item.avatar"
              :src="item.avatar"
              width="80rpx"
              height="80rpx"
              radius="16rpx"
              mode="aspectFill"
            />
            <view v-else class="h-80rpx w-80rpx flex shrink-0 items-center justify-center rounded-16rpx bg-[#1677ff] text-26rpx text-white">
              AI
            </view>
            <view class="min-w-0 flex-1">
              <view class="truncate text-29rpx text-[#333] font-medium">
                {{ item.name || '未命名角色' }}
              </view>
              <view class="line-clamp-2 mt-6rpx text-24rpx text-[#999] leading-34rpx">
                {{ item.description || '暂无角色描述' }}
              </view>
              <view v-if="item.knowledgeIds?.length" class="mt-8rpx text-22rpx text-[#1677ff]">
                已绑定 {{ item.knowledgeIds.length }} 个知识库
              </view>
            </view>
            <wd-icon name="arrow-right" size="30rpx" color="#bbb" />
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ChatRole } from '@/api/ai/model/chatRole'
import { ref } from 'vue'
import { getMyPage } from '@/api/ai/model/chatRole'

const emit = defineEmits<{
  select: [role: ChatRole]
}>()
const visible = defineModel<boolean>({ default: false })
const list = ref<ChatRole[]>([]) // 角色列表
const pagingRef = ref<any>() // 分页组件引用
const tabIndex = ref(0) // 当前角色分类
const keyword = ref('') // 搜索关键字

/** 查询角色列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getMyPage({
      pageNo,
      pageSize,
      name: keyword.value || undefined,
      publicStatus: tabIndex.value === 1,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索角色 */
function handleQuery() {
  pagingRef.value?.reload()
}

/** 切换角色分类 */
function handleTabChange() {
  pagingRef.value?.reload()
}

/** 选择角色 */
function handleSelect(role: ChatRole) {
  visible.value = false
  emit('select', role)
}

/** 打开弹窗 */
function handleOpen() {
  pagingRef.value?.reload()
}
</script>
