<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="tempSelected.length === 0" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.openid" placeholder="用户标识" clearable />
        <wd-input v-model="queryParams.nickname" placeholder="用户昵称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 用户列表 -->
      <z-paging
        ref="pagingRef"
        v-model="userList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选用户"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in userList"
            :key="item.id"
            class="mb-20rpx flex items-center gap-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isTempSelected(item.id) ? 'ring-2 ring-[#1677ff]' : ''"
            @click="toggleItem(item)"
          >
            <view class="shrink-0">
              <wd-img
                v-if="item.headImageUrl"
                :src="item.headImageUrl"
                width="80rpx"
                height="80rpx"
                radius="50%"
                mode="aspectFill"
              />
              <view v-else class="h-80rpx w-80rpx flex items-center justify-center rounded-full bg-[#f0f0f0]">
                <wd-icon name="user" size="40rpx" color="#999" />
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.nickname || item.openid || '-' }}
              </view>
              <view class="mt-10rpx truncate text-24rpx text-[#999]">
                {{ item.openid || '-' }}
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MpUser } from '@/api/mp/user'
import { ref } from 'vue'
import { getUserPage } from '@/api/mp/user'

const props = withDefaults(defineProps<{
  accountId?: number
  title?: string
}>(), {
  accountId: undefined,
  title: '选择用户',
})

const emit = defineEmits<{
  confirm: [users: MpUser[]]
}>()

const visible = ref(false) // 弹窗显示状态
const userList = ref<MpUser[]>([]) // 用户列表
const tempSelected = ref<MpUser[]>([]) // 临时选中用户
const pagingRef = ref<ZPagingRef<MpUser>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  openid: '',
  nickname: '',
})

/** 判断是否临时选中 */
function isTempSelected(id?: number) {
  return tempSelected.value.some(item => item.id === id)
}

/** 切换选中 */
function toggleItem(item: MpUser) {
  if (isTempSelected(item.id)) {
    tempSelected.value = []
    return
  }
  tempSelected.value = [item]
}

/** 查询用户列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.accountId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getUserPage({
      pageNo,
      pageSize,
      accountId: props.accountId,
      openid: queryParams.value.openid || undefined,
      nickname: queryParams.value.nickname || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open(selected?: MpUser) {
  visible.value = true
  tempSelected.value = selected ? [selected] : []
  queryParams.value = {
    openid: '',
    nickname: '',
  }
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery() {
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    openid: '',
    nickname: '',
  }
  pagingRef.value?.reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = []
  queryParams.value = {
    openid: '',
    nickname: '',
  }
}

/** 确认选择 */
function handleConfirm() {
  emit('confirm', [...tempSelected.value])
  visible.value = false
}

defineExpose({ open })
</script>
