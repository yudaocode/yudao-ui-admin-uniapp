<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 50vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="text-32rpx text-[#333] font-semibold">
          选择表情
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>
      <wd-tabs v-model="activeTab" line-theme="text">
        <wd-tab title="我的" name="user" />
        <wd-tab
          v-for="pack in facePacks"
          :key="pack.id"
          :title="pack.name"
          :name="String(pack.id)"
        />
      </wd-tabs>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view class="grid grid-cols-5 gap-20rpx p-24rpx">
          <view
            v-for="item in currentItems"
            :key="`${activeTab}-${item.id}`"
            class="h-104rpx flex items-center justify-center rounded-12rpx bg-[#f7f8fa]"
            @click="emit('select', item)"
          >
            <image :src="item.url" class="max-h-84rpx max-w-84rpx" mode="aspectFit" />
          </view>
        </view>
        <wd-empty v-if="!loading && currentItems.length === 0" icon="content" tip="暂无表情" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ImFacePackUserItemVO, ImFacePackUserVO } from '@/api/im/face/pack'
import type { ImFaceUserItemVO } from '@/api/im/face/useritem'
import { computed, ref, watch } from 'vue'
import { getFacePackList } from '@/api/im/face/pack'
import { getFaceUserItemList } from '@/api/im/face/useritem'

const props = defineProps<{
  modelValue: boolean // 是否显示
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [item: ImFacePackUserItemVO | ImFaceUserItemVO] // 选中表情
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const activeTab = ref('user') // 当前页签：user=我的 / 表情包 id
const loading = ref(false) // 加载状态
const facePacks = ref<ImFacePackUserVO[]>([]) // 系统表情包
const faceUserItems = ref<ImFaceUserItemVO[]>([]) // 个人表情

/** 当前页签表情列表 */
const currentItems = computed(() => {
  if (activeTab.value === 'user') {
    return faceUserItems.value
  }
  return facePacks.value.find(pack => String(pack.id) === activeTab.value)?.items || []
})

/** 首次打开时加载表情数据 */
watch(visible, async (value) => {
  if (!value || facePacks.value.length > 0 || faceUserItems.value.length > 0 || loading.value) {
    return
  }
  loading.value = true
  try {
    const [packs, userItems] = await Promise.all([getFacePackList(), getFaceUserItemList()])
    facePacks.value = packs
    faceUserItems.value = userItems
    if (faceUserItems.value.length === 0 && facePacks.value[0]) {
      activeTab.value = String(facePacks.value[0].id)
    }
  } finally {
    loading.value = false
  }
})
</script>
