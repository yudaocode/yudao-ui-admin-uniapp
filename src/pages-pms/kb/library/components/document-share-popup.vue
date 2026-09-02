<template>
  <!-- 分享文档弹窗 -->
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        分享文档
      </view>

      <!-- 公开链接 -->
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          公开链接
        </view>
        <view v-if="share" class="rounded-8rpx bg-[#f7f8fa] p-20rpx">
          <view class="mb-12rpx break-all text-26rpx text-[#333]">
            {{ shareUrl }}
          </view>
          <wd-button size="small" variant="plain" @click="copyShareUrl">
            复制链接
          </wd-button>
          <!-- 分享二维码（H5 生成，对齐 PC） -->
          <view v-if="qrCodeDataUrl" class="mt-20rpx flex items-center gap-20rpx">
            <wd-img :src="qrCodeDataUrl" width="240rpx" height="240rpx" radius="8rpx" />
            <view class="text-24rpx text-[#999]">
              扫码即可查看当前文档
            </view>
          </view>
        </view>
        <view v-else class="text-26rpx text-[#999]">
          开启后，任何获得链接的人都可以查看当前文档。
        </view>
      </view>

      <!-- 分享给成员 -->
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          分享给成员
        </view>
        <UserFormPicker
          v-model="shareUserIds"
          type="checkbox"
          label=""
          placeholder="请选择内部分享成员"
        />
      </view>

      <view class="flex gap-24rpx">
        <wd-button v-if="share" type="danger" variant="plain" :loading="loading" @click="handleCloseShare">
          关闭分享
        </wd-button>
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="loading" @click="handleSubmit">
          {{ share ? '保存成员' : '开启分享' }}
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { KnowledgeDocumentShare } from '@/api/pms/kb/interaction/share'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  closeKnowledgeDocumentShare,
  getKnowledgeDocumentShare,
  openKnowledgeDocumentShare,
  updateKnowledgeDocumentShareMemberList,
} from '@/api/pms/kb/interaction/share'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'

const toast = useToast()
const dialog = useDialog()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 提交中
const documentId = ref<number>() // 文档编号
const share = ref<KnowledgeDocumentShare>() // 文档分享信息
const shareUserIds = ref<number[]>([]) // 分享成员用户编号

const qrCodeDataUrl = ref('') // 分享二维码图片数据

const shareUrl = computed(() => {
  if (!share.value) {
    return ''
  }
  // 分享链接指向 PC 管理端公开查看页（路由 /pms/kb/document/share/:token 注册在 vue3 端）
  return `${getPcAdminOrigin()}/pms/kb/document/share/${share.value.token}`
}) // 文档分享地址

/** 获得 PC 管理端地址：优先读 VITE_PC_ADMIN_ORIGIN 配置，H5 开发环境回退当前 origin */
function getPcAdminOrigin() {
  const configured = import.meta.env.VITE_PC_ADMIN_ORIGIN
  if (configured) {
    return configured
  }
  // #ifdef H5
  return window.location.origin
  // #endif
  // #ifndef H5
  return ''
  // #endif
}

/** 打开弹窗 */
async function open(id: number) {
  visible.value = true
  documentId.value = id
  qrCodeDataUrl.value = ''
  loading.value = true
  try {
    share.value = await getKnowledgeDocumentShare(id)
    shareUserIds.value = share.value?.shareUserIds || []
    if (share.value) {
      await generateQrCode()
    }
  } finally {
    loading.value = false
  }
}

/** 生成分享二维码（仅 H5 依赖 canvas 能力） */
async function generateQrCode() {
  // #ifdef H5
  if (!shareUrl.value) {
    return
  }
  const QRCode = (await import('qrcode')).default
  qrCodeDataUrl.value = await QRCode.toDataURL(shareUrl.value, {
    margin: 1,
    width: 240,
    color: { dark: '#1f2937', light: '#ffffff' },
  })
  // #endif
}

/** 开启分享或保存分享成员 */
async function handleSubmit() {
  if (!documentId.value) {
    return
  }
  loading.value = true
  try {
    if (share.value) {
      await updateKnowledgeDocumentShareMemberList({
        documentId: documentId.value,
        shareUserIds: shareUserIds.value,
      })
      toast.success('分享成员已更新')
      visible.value = false
    } else {
      share.value = await openKnowledgeDocumentShare({
        documentId: documentId.value,
        shareUserIds: shareUserIds.value,
      })
      await generateQrCode()
      toast.success('分享已开启')
    }
  } finally {
    loading.value = false
  }
}

/** 关闭分享 */
async function handleCloseShare() {
  if (!documentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '关闭后，现有公开链接将立即失效。是否继续？' })
  } catch {
    return
  }
  loading.value = true
  try {
    await closeKnowledgeDocumentShare(documentId.value)
    share.value = undefined
    shareUserIds.value = []
    qrCodeDataUrl.value = ''
    toast.success('分享已关闭')
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 复制分享链接 */
async function copyShareUrl() {
  uni.setClipboardData({
    data: shareUrl.value,
    success: () => toast.success('链接已复制'),
  })
}

defineExpose({ open })
</script>
