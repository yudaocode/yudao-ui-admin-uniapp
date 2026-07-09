<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 条码详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <BarcodePreview :content="formData?.content" :format="formData?.format" />
      </view>
      <wd-cell-group border>
        <wd-cell title="条码格式">
          <dict-tag v-if="formData?.format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="formData.format" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="业务类型">
          <dict-tag v-if="formData?.bizType != null" :type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" :value="formData.bizType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="条码内容" :value="formData?.content || '-'" />
        <wd-cell title="业务编码" :value="formData?.bizCode || '-'" />
        <wd-cell title="业务名称" :value="formData?.bizName || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-barcode:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-barcode:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import type { WmBarcode } from '@/api/mes/wm/barcode'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteBarcode, getBarcode } from '@/api/mes/wm/barcode'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import BarcodePreview from '../components/barcode-preview.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<WmBarcode>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getBarcode(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/barcode/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该条码吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteBarcode(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:wm:barcode:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
