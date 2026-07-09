<template>
  <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
    <view class="mb-16rpx flex items-center justify-between gap-16rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        条码预览
      </view>
      <dict-tag v-if="format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="format" />
    </view>

    <view class="flex flex-col items-center rounded-12rpx bg-[#f7faff] p-24rpx">
      <view
        v-if="content"
        class="flex items-center justify-center border-2rpx border-[#dbeafe] rounded-12rpx bg-white p-24rpx"
        :class="isQrCode ? 'h-280rpx w-280rpx' : 'h-180rpx w-full'"
      >
        <view v-if="isQrCode" class="grid grid-cols-[repeat(11,1fr)] grid-rows-[repeat(11,1fr)] h-220rpx w-220rpx gap-4rpx">
          <view
            v-for="(dot, index) in qrDots"
            :key="index"
            class="rounded-3rpx"
            :class="dot ? 'bg-[#111827]' : 'bg-white'"
          />
        </view>
        <view v-else class="h-120rpx w-full flex items-stretch justify-center gap-4rpx">
          <view
            v-for="(bar, index) in barcodeBars"
            :key="index"
            class="h-full bg-[#111827]"
            :style="{ width: `${bar.width}rpx`, opacity: bar.active ? 1 : 0.12 }"
          />
        </view>
      </view>
      <wd-empty v-else icon="content" tip="暂无条码内容" />

      <view v-if="content" class="mt-20rpx w-full break-all rounded-8rpx bg-white px-20rpx py-16rpx text-center text-24rpx text-[#666]">
        {{ content }}
      </view>
      <view class="mt-16rpx text-center text-22rpx text-[#999] leading-34rpx">
        {{ previewTip }}
      </view>
      <view v-if="content && showActions" class="mt-20rpx flex flex-wrap justify-center gap-16rpx">
        <wd-button size="small" variant="plain" @click.stop="handleCopy">
          复制条码内容
        </wd-button>
        <wd-button size="small" type="primary" variant="plain" @click.stop="handleDownloadPreview">
          下载预览 SVG
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { DICT_TYPE } from '@/utils/constants'
import { downloadSvgFileH5, sanitizeFileName } from '@/utils/download'
import { escapeXml } from '@/utils/format'

const props = withDefaults(defineProps<{
  content?: string
  format?: number
  showActions?: boolean
}>(), {
  showActions: true,
})

const BARCODE_FORMAT_QR_CODE = 1 // 二维码格式

const toast = useToast()
const showActions = computed(() => props.showActions)
const isQrCode = computed(() => props.format === BARCODE_FORMAT_QR_CODE)
const previewTip = computed(() => {
  if (!showActions.value) {
    return '移动端当前提供标签预览；点击卡片进入详情后可复制内容或下载 H5 预览 SVG。'
  }
  return '移动端当前提供标签预览、内容复制和 H5 预览下载；正式打印和真实条码图像归入报表/打印专项。'
})
const qrDots = computed(() => buildPreviewBits(props.content || '', 121))
const barcodeBars = computed(() => {
  return buildPreviewBits(props.content || '', 32).map((active, index) => ({
    active,
    width: active ? (index % 3 === 0 ? 8 : 4) : 3,
  }))
})

/** 根据条码内容生成稳定的预览点阵 */
function buildPreviewBits(content: string, count: number) {
  let seed = 0
  for (const char of content) {
    seed = (seed * 31 + char.charCodeAt(0)) % 9973
  }
  return Array.from({ length: count }, (_, index) => {
    seed = (seed * 37 + index * 17 + 11) % 9973
    return seed % 5 !== 0
  })
}

/** 复制条码内容 */
async function handleCopy() {
  if (!props.content) {
    return
  }
  await uni.setClipboardData({ data: props.content })
  toast.success('已复制条码内容')
}

/** 下载当前预览 SVG */
async function handleDownloadPreview() {
  if (!props.content) {
    return
  }

  // #ifdef H5
  try {
    const svg = isQrCode.value ? buildQrSvg(props.content, qrDots.value) : buildBarcodeSvg(props.content, barcodeBars.value)
    await downloadSvgFileH5(svg, `barcode-preview-${sanitizeFileName(props.content)}.svg`)
    toast.success('预览 SVG 已下载')
  } catch {
    toast.warning('下载失败，请先复制条码内容')
  }
  // #endif

  // #ifndef H5
  toast.warning('当前平台暂仅支持复制条码内容')
  // #endif
}

/** 生成二维码预览 SVG */
function buildQrSvg(content: string, dots: boolean[]) {
  const cell = 14
  const size = 11 * cell
  const rects = dots
    .map((dot, index) => {
      if (!dot) {
        return ''
      }
      const x = (index % 11) * cell
      const y = Math.floor(index / 11) * cell
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" />`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 42}" viewBox="0 0 ${size} ${size + 42}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <g fill="#111827">${rects}</g>
  <text x="${size / 2}" y="${size + 28}" text-anchor="middle" font-size="12" fill="#4b5563">${escapeXml(content)}</text>
</svg>`
}

/** 生成一维码预览 SVG */
function buildBarcodeSvg(content: string, bars: Array<{ active: boolean, width: number }>) {
  const scale = 2
  const height = 96
  let x = 12
  const rects = bars.map((bar) => {
    const width = bar.width * scale
    const rect = `<rect x="${x}" y="12" width="${width}" height="${height}" fill="#111827" opacity="${bar.active ? 1 : 0.12}" />`
    x += width + 4
    return rect
  }).join('')
  const totalWidth = Math.max(x + 12, 240)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="154" viewBox="0 0 ${totalWidth} 154">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${rects}
  <text x="${totalWidth / 2}" y="136" text-anchor="middle" font-size="14" fill="#4b5563">${escapeXml(content)}</text>
</svg>`
}
</script>
