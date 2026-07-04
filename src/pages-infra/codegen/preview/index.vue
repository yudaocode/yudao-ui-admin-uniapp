<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="代码预览"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 文件选择 + 复制 -->
    <view class="flex items-center gap-16rpx bg-white px-24rpx py-16rpx">
      <view
        class="min-w-0 flex flex-1 items-center rounded-8rpx bg-[#f5f6f8] px-20rpx py-16rpx"
        @click="filePickerVisible = true"
      >
        <wd-icon name="file" size="32rpx" color="#1677ff" />
        <text class="mx-12rpx min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ currentFileName || '请选择文件' }}</text>
        <wd-icon name="arrow-down" size="28rpx" color="#999" />
      </view>
      <wd-button size="small" variant="plain" :disabled="!current" @click="handleCopy">
        复制
      </wd-button>
    </view>

    <!-- 代码内容 -->
    <scroll-view
      v-if="current"
      class="min-h-0 flex-1"
      scroll-x scroll-y
    >
      <text class="code-text" :user-select="true" :selectable="true">{{ current.code }}</text>
    </scroll-view>
    <view v-else class="flex flex-1 items-center justify-center text-28rpx text-[#999]">
      {{ loading ? '加载中...' : '暂无预览代码' }}
    </view>

    <!-- 文件列表弹窗 -->
    <wd-popup v-model="filePickerVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[60vh] flex flex-col">
        <view class="border-b border-[#f0f0f0] border-solid px-32rpx py-28rpx text-32rpx text-[#333] font-semibold">
          选择文件（{{ files.length }}）
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1">
          <view
            v-for="(file, index) in files"
            :key="file.filePath"
            class="flex items-center border-b border-[#f5f5f5] border-solid px-32rpx py-24rpx"
            :class="index === activeIndex ? 'bg-[#eef4ff]' : ''"
            @click="selectFile(index)"
          >
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx" :class="index === activeIndex ? 'text-[#1677ff] font-medium' : 'text-[#333]'">
                {{ baseName(file.filePath) }}
              </view>
              <view class="mt-4rpx truncate text-22rpx text-[#999]">
                {{ file.filePath }}
              </view>
            </view>
            <wd-icon v-if="index === activeIndex" name="check" size="32rpx" color="#1677ff" />
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { CodegenPreview } from '@/api/infra/codegen'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { previewCodegen } from '@/api/infra/codegen'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false) // 加载状态
const files = ref<CodegenPreview[]>([]) // 预览文件列表
const activeIndex = ref(0) // 当前文件下标
const filePickerVisible = ref(false) // 文件选择弹窗

const current = computed(() => files.value[activeIndex.value]) // 当前文件
const currentFileName = computed(() => current.value ? baseName(current.value.filePath) : '') // 当前文件名

/** 取文件路径末段作为文件名 */
function baseName(filePath: string) {
  const segments = filePath.split('/')
  return segments[segments.length - 1] || filePath
}

/** 选择文件 */
function selectFile(index: number) {
  activeIndex.value = index
  filePickerVisible.value = false
}

/** 复制当前文件代码 */
function handleCopy() {
  if (!current.value) {
    return
  }
  uni.setClipboardData({
    data: current.value.code,
    success: () => toast.success('已复制到剪贴板'),
  })
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/codegen/index')
}

/** 加载预览代码 */
async function getPreview() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    files.value = await previewCodegen(props.id)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getPreview()
})
</script>

<style lang="scss" scoped>
.code-text {
  display: inline-block;
  padding: 24rpx;
  font-family: 'SF Mono', Menlo, Consolas, Monaco, monospace;
  font-size: 24rpx;
  line-height: 1.6;
  color: #333;
  white-space: pre;
}
</style>
