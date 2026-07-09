<template>
  <view class="yd-page-container">
    <wd-navbar title="仓库详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="仓库编码" :value="formData?.code || '-'" />
        <wd-cell title="仓库名称" :value="formData?.name || '-'" />
        <wd-cell title="负责人" :value="formData?.chargeUserName || '-'" />
        <wd-cell title="仓库地址" :value="formData?.address || '-'" />
        <wd-cell title="面积" :value="formData?.area != null ? `${formData.area} ㎡` : '-'" />
        <wd-cell title="是否冻结" :value="formData?.frozen ? '是' : '否'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>
    <view v-if="formData" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-warehouse:query'])"
          class="flex-1"
          variant="plain"
          @click="handleLocation"
        >
          库区
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-barcode:query'])"
          class="flex-1"
          variant="plain"
          @click="handleBarcode"
        >
          条码
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:wm-warehouse:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:wm-warehouse:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>

    <!-- 条码详情弹窗 -->
    <BarcodeDetailPopup ref="barcodeDetailPopupRef" />
  </view>
</template>

<script lang="ts" setup>
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteWarehouse, getWarehouse } from '@/api/mes/wm/warehouse'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import BarcodeDetailPopup from '@/pages-mes/wm/barcode/components/barcode-detail-popup.vue'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<WmWarehouse>() // 详情数据
const deleting = ref(false) // 删除状态
const barcodeDetailPopupRef = ref<InstanceType<typeof BarcodeDetailPopup>>() // 条码弹窗

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/warehouse/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const [data, users] = await Promise.all([
      getWarehouse(Number(props.id)),
      getSimpleUserList(),
    ])
    const chargeUser = users.find(user => user.id === data.chargeUserId)
    formData.value = { ...data, chargeUserName: chargeUser?.nickname || null }
  } finally {
    toast.close()
  }
}

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return
  }
  barcodeDetailPopupRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.WAREHOUSE,
    formData.value.code,
    formData.value.name,
  )
}

/** 查看库区 */
function handleLocation() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/location/index?warehouseId=${formData.value.id}` })
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该仓库吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWarehouse(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:wm:warehouse:reload')
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
