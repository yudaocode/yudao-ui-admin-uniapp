<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品分类详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="分类编号" :value="formData?.code || '-'" />
        <wd-cell title="分类名称" :value="formData?.name || '-'" />
        <wd-cell title="上级分类" :value="parentName" />
        <wd-cell title="显示排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['wms:item-category:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['wms:item-category:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ItemCategory } from '@/api/wms/md/item/category'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteItemCategory, getItemCategory, getSimpleItemCategoryList } from '@/api/wms/md/item/category'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
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
const formData = ref<ItemCategory>() // 详情数据
const categoryList = ref<ItemCategory[]>([]) // 分类列表
const deleting = ref(false) // 删除状态

const parentName = computed(() => {
  if (!formData.value?.parentId) {
    return '顶级分类'
  }
  return categoryList.value.find(item => item.id === formData.value?.parentId)?.name || '-'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/item/category/index')
}

/** 加载商品分类详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const [detail, categories] = await Promise.all([
    getItemCategory(Number(props.id)),
    getSimpleItemCategoryList(),
  ])
  formData.value = detail
  categoryList.value = categories
}

/** 编辑商品分类 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-wms/md/item/category/form/index?id=${props.id}`,
  })
}

/** 删除商品分类 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该商品分类吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteItemCategory(Number(props.id))
    toast.success('删除成功')
    uni.$emit('wms:item-category:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
