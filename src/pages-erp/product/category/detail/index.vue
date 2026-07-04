<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品分类详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="分类名称" :value="formData?.name || '-'" />
        <wd-cell title="分类编码" :value="formData?.code || '-'" />
        <wd-cell title="父级分类" :value="getParentName() || '-'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['erp:product-category:update']) || hasAccessByCodes(['erp:product-category:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['erp:product-category:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['erp:product-category:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProductCategory } from '@/api/erp/product/category'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteProductCategory, getProductCategory, getProductCategorySimpleList } from '@/api/erp/product/category'
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
const formData = ref<ProductCategory>() // 详情数据
const categoryList = ref<ProductCategory[]>([]) // 产品分类列表
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/category/index')
}

/** 获取父级分类名称 */
function getParentName() {
  if (!formData.value?.parentId || formData.value.parentId === 0) {
    return '顶级产品分类'
  }
  const parent = categoryList.value.find(item => item.id === formData.value?.parentId)
  return parent?.name || '未知'
}

/** 加载产品分类详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductCategory(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑产品分类 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-erp/product/category/form/index?id=${props.id}`,
  })
}

/** 删除产品分类 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该产品分类吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductCategory(props.id)
    toast.success('删除成功')
    uni.$emit('erp:product-category:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  categoryList.value = await getProductCategorySimpleList()
  await getDetail()
  uni.$on('erp:product-category:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:product-category:reload', getDetail)
})
</script>
