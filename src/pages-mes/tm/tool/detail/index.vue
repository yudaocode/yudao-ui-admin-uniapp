<template>
  <view class="yd-page-container">
    <wd-navbar title="工具详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="工具编码" :value="formData?.code || '-'" />
        <wd-cell title="工具名称" :value="formData?.name || '-'" />
        <wd-cell title="品牌" :value="formData?.brand || '-'" />
        <wd-cell title="型号规格" :value="formData?.specification || '-'" />
        <wd-cell title="工具类型" :value="formData?.toolTypeName || '-'" />
        <wd-cell title="库存数量" :value="formData?.quantity ?? '-'" />
        <wd-cell title="可用数量" :value="formData?.availableQuantity ?? '-'" />
        <wd-cell title="保养维护类型">
          <dict-tag v-if="formData?.maintenType != null" :type="DICT_TYPE.MES_TM_MAINTEN_TYPE" :value="formData.maintenType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="下次保养" :value="formatNextMainten(formData)" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_TM_TOOL_STATUS" :value="formData.status" /><text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>
    <view v-if="formData" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:tm-tool:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:tm-tool:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TmTool } from '@/api/mes/tm/tool'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteTool, getTool } from '@/api/mes/tm/tool'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE, MesMaintenTypeEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

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
const currentId = computed(() => props.id ? Number(props.id) : undefined)
const formData = ref<TmTool>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/tm/tool/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getTool(currentId.value)
    if (!detailData) {
      toast.warning('详情不存在，已返回列表')
      delay(handleBack)
      return
    }
    formData.value = detailData
  } finally {
    toast.close()
  }
}

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: buildBarcodeListUrl({
      bizType: BarcodeBizTypeEnum.TOOL,
      bizId: formData.value.id,
      bizCode: formData.value.code,
    }),
  })
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/tm/tool/form/index?id=${currentId.value}` })
}

/** 格式化下次保养 */
function formatNextMainten(data?: TmTool) {
  if (data?.maintenType === MesMaintenTypeEnum.REGULAR) {
    return formatDate(data.nextMaintenDate) || '-'
  }
  if (data?.maintenType === MesMaintenTypeEnum.USAGE) {
    return data.nextMaintenPeriod != null ? `${data.nextMaintenPeriod} 次` : '-'
  }
  return '-'
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该工具吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteTool(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:tm:tool:reload')
    delay(handleBack)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:tm:tool:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:tm:tool:reload', getDetail)
})
</script>
