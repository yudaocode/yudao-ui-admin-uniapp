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
        <!-- 最近转发 -->
        <view v-if="!keyword && recentForwardConversations.length" class="border-b border-b-[#eee] px-24rpx py-18rpx">
          <text class="mb-16rpx block text-25rpx text-[#999]">最近转发</text>
          <scroll-view scroll-x class="whitespace-nowrap">
            <view class="inline-flex gap-24rpx pr-24rpx">
              <view
                v-for="item in recentForwardConversations"
                :key="item.clientConversationId"
                class="relative w-104rpx text-center"
                @click="toggle(item)"
              >
                <view class="mx-auto w-80rpx">
                  <ImAvatar :src="item.avatar" :name="item.name" :round="false" size="80rpx" />
                </view>
                <text class="mt-8rpx block truncate text-23rpx text-[#666]">{{ item.name || '未命名' }}</text>
                <wd-icon
                  class="absolute right-4rpx -top-8rpx"
                  name="close"
                  size="28rpx"
                  color="#999"
                  @click.stop="removeRecentForwardConversationKey(item.clientConversationId)"
                />
                <wd-icon
                  v-if="selectedIds.includes(item.clientConversationId)"
                  class="absolute bottom-30rpx right-6rpx"
                  name="check-circle-fill"
                  size="30rpx"
                  color="#07c160"
                />
              </view>
            </view>
          </scroll-view>
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

      <!-- 业务扩展区 -->
      <slot name="footer" />
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/utils/db'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ImConversationType } from '@/pages-im/utils/constants'
import { filterConversationsByKeyword } from '@/pages-im/utils/conversation'
import { useConversationStore } from '../../../store/conversationStore'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  modelValue: boolean // 是否显示
  allowCreateGroup?: boolean // 是否允许新建群后转发
  excludedKeys?: string[] // 不允许选择的会话主键
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [targets: ConversationDO[]] // 确认转发目标
  'create-group': [] // 新建群并转发
}>()

const conversationStore = useConversationStore()
const { conversations, recentForwardConversationKeys } = storeToRefs(conversationStore)
const { loadConversationList, isLoaded, removeRecentForwardConversationKey } = conversationStore

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const keyword = ref('') // 搜索关键词
const selectedIds = ref<string[]>([]) // 已选会话主键

/** 支持转发的私聊和有效群聊 */
const forwardCandidates = computed(() => conversations.value.filter(item =>
  (item.type === ImConversationType.PRIVATE || item.type === ImConversationType.GROUP)
  && !props.excludedKeys?.includes(item.clientConversationId)))
const recentForwardConversations = computed(() => recentForwardConversationKeys.value
  .map(key => forwardCandidates.value.find(item => item.clientConversationId === key))
  .filter((item): item is ConversationDO => !!item)) // 最近转发会话

/** 会话过滤列表 */
const filteredConversations = computed(() => {
  return filterConversationsByKeyword(forwardCandidates.value, keyword.value)
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
  const targets = selectedIds.value
    .map(id => forwardCandidates.value.find(item => item.clientConversationId === id))
    .filter((item): item is ConversationDO => !!item)
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
      loadConversationList()
    }
  }
})
</script>
