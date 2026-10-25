<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品分类详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类（仅单个 tab 时隐藏标签栏） -->
    <view v-if="tabs.length > 1" class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <wd-cell-group v-if="activeTab === 'basic'" border>
      <wd-cell title="分类名称" :value="formData.name || '-'" />
      <wd-cell title="父级分类" :value="formatParentId" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'basic'">
          <wd-button v-if="hasAccessByCodes(['crm:product-category:update'])" class="flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="hasAccessByCodes(['crm:product-category:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
        </template>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteProductCategory, getProductCategory } from '@/api/crm/product/category'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const parentName = ref('') // 父级分类名称
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const categoryId = computed(() => props.id)
const activeTab = computed(() => tabs[tabIndex.value].key)
const formatParentId = computed(() => {
  if (formData.value.parentId === 0) {
    return '顶级分类'
  }
  return parentName.value || '-'
}) // 父级分类展示（顶级显示「顶级分类」，否则展示父级名称）
const hasFooter = computed(() => {
  if (activeTab.value === 'basic') {
    return hasAccessByCodes(['crm:product-category:update']) || hasAccessByCodes(['crm:product-category:delete'])
  }
  return false
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/product/category/index')
}

/** 加载详情 */
async function getDetail() {
  if (!categoryId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductCategory(categoryId.value)
    // 加载父级分类名称用于展示（顶级分类 parentId 为 0）
    const parentId = formData.value.parentId
    if (parentId && parentId !== 0) {
      const parent = await getProductCategory(parentId).catch(() => undefined)
      parentName.value = parent?.name || ''
    } else {
      parentName.value = ''
    }
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/product/category/form/index?id=${categoryId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!categoryId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该产品分类吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductCategory(categoryId.value)
    toast.success('删除成功')
    uni.$emit('crm:productCategory:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:productCategory:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:productCategory:reload', getDetail)
})
</script>
