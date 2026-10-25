<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品分类详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="分类编号" :value="String(formData?.id || '-')" />
        <wd-cell title="分类名字" :value="formData?.name || '-'" />
        <wd-cell title="分类排序" :value="String(formData?.sort ?? '-')" />
        <wd-cell title="分类状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="分类描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['iot:product-category:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:product-category:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProductCategory } from '@/api/iot/product/category'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteProductCategory, getProductCategory } from '@/api/iot/product/category'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<ProductCategory>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/product/category/index')
}

/** 加载产品分类详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getProductCategory(props.id)
}

/** 编辑产品分类 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/product/category/form/index?id=${props.id}` })
}

/** 删除产品分类 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该产品分类吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductCategory(props.id)
    toast.success('删除成功')
    uni.$emit('iot:product-category:reload')
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
