<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 75vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-white">
      <!-- 头部 -->
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <text class="text-28rpx text-[#999]" @click="visible = false">取消</text>
        <text class="text-32rpx text-[#333] font-semibold">选择会话</text>
        <text
          class="text-28rpx"
          :class="selectedIds.length ? 'text-[#07c160]' : 'text-[#ccc]'"
          @click="confirm"
        >
          发送{{ selectedIds.length ? `(${selectedIds.length})` : '' }}
        </text>
      </view>

      <!-- 搜索 -->
      <view class="px-24rpx pb-8rpx pt-12rpx">
        <wd-search v-model="keyword" placeholder="搜索会话" hide-cancel />
      </view>

      <!-- 会话列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view
          v-if="allowCreateGroup"
          class="flex items-center gap-20rpx border-b border-b-[#eee] px-24rpx py-18rpx active:bg-[#f5f5f5]"
          @click="createGroup"
        >
          <view class="h-80rpx w-80rpx flex items-center justify-center rounded-12rpx bg-[#f0f2f5]">
            <wd-icon name="usergroup-add" size="44rpx" color="#576b95" />
          </view>
          <text class="min-w-0 flex-1 text-30rpx text-[#333]">新建群聊并转发</text>
          <wd-icon name="arrow-right" size="30rpx" color="#aaa" />
        </view>
        <view
          v-for="item in filteredConversations"
          :key="item.clientConversationId"
          class="flex items-center gap-20rpx px-24rpx py-16rpx active:bg-[#f5f5f5]"
          @click="toggle(item)"
        >
          <wd-icon
            :name="selectedIds.includes(item.clientConversationId) ? 'check-circle-fill' : 'check-circle'"
            size="44rpx"
            :color="selectedIds.includes(item.clientConversationId) ? '#07c160' : '#ccc'"
          />
          <ImAvatar :src="item.avatar" :name="item.name" :round="false" size="80rpx" />
          <text class="min-w-0 flex-1 truncate text-30rpx text-[#333]">{{ item.name || '未命名' }}</text>
        </view>
        <wd-empty v-if="filteredConversations.length === 0" icon="message" tip="暂无会话" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/home/db'
import { computed, ref, watch } from 'vue'
import { ImConversationType } from '@/utils/constants'
import { useImConversations } from '../../composables/useImConversations'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  modelValue: boolean // 是否显示
  allowCreateGroup?: boolean // 是否允许新建群后转发
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [targets: ConversationDO[]] // 确认转发目标
  'create-group': [] // 新建群并转发
}>()

const { conversations, load, isLoaded } = useImConversations()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const keyword = ref('') // 搜索关键词
const selectedIds = ref<string[]>([]) // 已选会话主键

/** 支持转发的私聊和有效群聊 */
const forwardCandidates = computed(() => conversations.value.filter(item =>
  item.type === ImConversationType.PRIVATE || item.type === ImConversationType.GROUP))

/** 会话过滤列表 */
const filteredConversations = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  if (!word) {
    return forwardCandidates.value
  }
  return forwardCandidates.value.filter(item => (item.name || '').toLowerCase().includes(word))
})

/** 切换选中 */
function toggle(item: ConversationDO) {
  const index = selectedIds.value.indexOf(item.clientConversationId)
  if (index >= 0) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(item.clientConversationId)
  }
}

/** 确认转发 */
function confirm() {
  if (selectedIds.value.length === 0) {
    return
  }
  const targets = forwardCandidates.value.filter(item => selectedIds.value.includes(item.clientConversationId))
  emit('confirm', targets)
  selectedIds.value = []
  visible.value = false
}

/** 新建群聊后继续转发 */
function createGroup() {
  visible.value = false
  emit('create-group')
}

/** 打开时确保会话已加载 */
watch(visible, (value) => {
  if (value) {
    selectedIds.value = []
    if (!isLoaded()) {
      load()
    }
  }
})
</script>
