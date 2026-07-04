<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品单位详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="单位名字" :value="formData?.name || '-'" />
        <wd-cell title="单位状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['erp:product-unit:update']) || hasAccessByCodes(['erp:product-unit:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['erp:product-unit:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['erp:product-unit:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProductUnit } from '@/api/erp/product/unit'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteProductUnit, getProductUnit } from '@/api/erp/product/unit'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const formData = ref<ProductUnit>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/unit/index')
}

/** 加载产品单位详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductUnit(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑产品单位 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-erp/product/unit/form/index?id=${props.id}`,
  })
}

/** 删除产品单位 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该产品单位吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductUnit(props.id)
    toast.success('删除成功')
    uni.$emit('erp:product-unit:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:product-unit:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:product-unit:reload', getDetail)
})
</script>
