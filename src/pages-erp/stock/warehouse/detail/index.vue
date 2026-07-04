<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="仓库详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="仓库名称" :value="formData?.name || '-'" />
        <wd-cell title="仓库地址" :value="formData?.address || '-'" />
        <wd-cell title="仓库状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="是否默认">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.defaultStatus" />
        </wd-cell>
        <wd-cell title="仓储费" :value="formatMoney(formData?.warehousePrice)" />
        <wd-cell title="搬运费" :value="formatMoney(formData?.truckagePrice)" />
        <wd-cell title="负责人" :value="formData?.principal || '-'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['erp:warehouse:update']) || hasAccessByCodes(['erp:warehouse:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['erp:warehouse:update'])" class="flex-1" type="warning" :disabled="defaultLoading || deleting" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['erp:warehouse:update'])" class="flex-1" type="primary" :loading="defaultLoading" :disabled="deleting" @click="handleUpdateDefaultStatus">
          {{ formData?.defaultStatus ? '取消默认' : '设为默认' }}
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['erp:warehouse:delete'])" class="flex-1" type="danger" :loading="deleting" :disabled="defaultLoading" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteWarehouse, getWarehouse, updateWarehouseDefaultStatus } from '@/api/erp/stock/warehouse'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatMoney } from '@/utils/format'

const props = defineProps<{ id?: number }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Warehouse>() // 详情数据
const deleting = ref(false) // 删除状态
const defaultLoading = ref(false) // 默认状态修改状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/warehouse/index')
}

/** 加载仓库详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getWarehouse(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑仓库 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/stock/warehouse/form/index?id=${props.id}` })
}

/** 删除仓库 */
async function handleDelete() {
  if (!props.id || deleting.value || defaultLoading.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该仓库吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWarehouse(props.id)
    toast.success('删除成功')
    uni.$emit('erp:warehouse:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 修改默认状态 */
async function handleUpdateDefaultStatus() {
  if (!props.id || !formData.value || defaultLoading.value || deleting.value) {
    return
  }
  const nextDefaultStatus = !formData.value.defaultStatus
  const actionName = nextDefaultStatus ? '设置' : '取消'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}“${formData.value.name || '该仓库'}”默认吗？` })
  } catch {
    return
  }
  defaultLoading.value = true
  try {
    await updateWarehouseDefaultStatus(props.id, nextDefaultStatus)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:warehouse:reload')
    await getDetail()
  } finally {
    defaultLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:warehouse:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:warehouse:reload', getDetail)
})
</script>
