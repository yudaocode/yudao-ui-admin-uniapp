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
      <wd-tabs v-if="mode === 'full'" v-model="activeTab" line-theme="text" slidable="always">
        <wd-tab title="表情" name="emoji" />
        <wd-tab title="收藏" name="user" />
        <wd-tab
          v-for="pack in facePacks"
          :key="pack.id"
          :title="pack.name"
          :name="String(pack.id)"
        />
      </wd-tabs>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view v-if="mode === 'emoji' || activeTab === 'emoji'" class="grid grid-cols-8 gap-y-22rpx p-24rpx">
          <view
            v-for="emoji in IM_EMOJI_LIST"
            :key="emoji"
            class="text-center text-48rpx"
            @click="emit('select-emoji', emoji)"
          >
            {{ emoji }}
          </view>
        </view>
        <view v-else class="grid grid-cols-5 gap-20rpx p-24rpx">
          <view
            v-if="activeTab === 'user'"
            class="h-104rpx flex items-center justify-center border border-[#ddd] rounded-12rpx border-dashed"
            @click="handleUpload"
          >
            <wd-icon name="plus" size="48rpx" color="#999" />
          </view>
          <view
            v-for="item in currentItems"
            :key="`${activeTab}-${item.id}`"
            class="h-104rpx flex items-center justify-center rounded-12rpx bg-[#f7f8fa]"
            @click="emit('select', item)"
            @longpress="handleDelete(item)"
          >
            <wd-img :src="item.url" width="84rpx" height="84rpx" mode="aspectFit" />
          </view>
        </view>
        <wd-empty v-if="mode === 'full' && activeTab !== 'emoji' && !loading && currentItems.length === 0" icon="content" tip="暂无表情" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ImFacePackUserItemVO } from '@/api/im/face/pack'
import type { ImFaceUserItemVO } from '@/api/im/face/useritem'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { IM_EMOJI_LIST } from '@/pages-im/utils/emoji'
import { useMediaUploader } from '../../../composables/useMediaUploader'
import { useFaceStore } from '../../../store/faceStore'

const props = withDefaults(defineProps<{
  modelValue: boolean // 是否显示
  mode?: 'full' | 'emoji' // 完整面板或仅文本表情
}>(), {
  mode: 'full',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [item: ImFacePackUserItemVO | ImFaceUserItemVO] // 选中表情
  'select-emoji': [value: string] // 选中文本表情
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const activeTab = ref('emoji') // 当前页签：emoji=文本表情 / user=收藏 / 表情包 id
const faceStore = useFaceStore()
const dialog = useDialog()
const toast = useToast()
const { uploadLocalFile, getLocalImageInfo, validateFileSize } = useMediaUploader()
const { facePacks, faceUserItems, loading } = storeToRefs(faceStore)
const uploading = ref(false) // 个人表情上传状态

/** 当前页签表情列表 */
const currentItems = computed(() => {
  if (activeTab.value === 'user') {
    return faceUserItems.value
  }
  return facePacks.value.find(pack => String(pack.id) === activeTab.value)?.items || []
})

/** 上传个人表情 */
function handleUpload() {
  if (uploading.value) {
    return
  }
  uploading.value = true
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: async (result) => {
      const filePath = result.tempFilePaths?.[0]
      const file = result.tempFiles?.[0]
      if (!filePath || !validateFileSize(file?.size, 16 * 1024 * 1024)) {
        uploading.value = false
        return
      }
      try {
        const imageInfo = await getLocalImageInfo(filePath)
        if (!imageInfo) {
          toast.show('无法读取图片信息')
          return
        }
        const url = await uploadLocalFile(filePath, 'im/face')
        await faceStore.addFaceUserItem({
          url,
          width: imageInfo.width,
          height: imageInfo.height,
        })
        toast.success('已添加到收藏')
      } finally {
        uploading.value = false
      }
    },
    fail: () => uploading.value = false,
  })
}

/** 删除个人表情 */
async function handleDelete(item: ImFacePackUserItemVO | ImFaceUserItemVO) {
  if (activeTab.value !== 'user') {
    return
  }
  try {
    await dialog.confirm({ title: '删除表情', msg: '确定从收藏中删除该表情吗？' })
  } catch {
    return
  }
  await faceStore.removeFaceUserItem(item.id)
  toast.success('已删除')
}

/** 首次打开时加载表情数据 */
watch(visible, async (value) => {
  if (!value) {
    return
  }
  activeTab.value = 'emoji'
  if (props.mode === 'emoji') {
    return
  }
  await Promise.all([
    faceStore.ensureFacePackList(),
    faceStore.ensureFaceUserItemList(),
  ])
})
</script>
