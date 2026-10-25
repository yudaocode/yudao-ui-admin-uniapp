<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="属性值详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="所属属性" :value="propertyName" />
      <wd-cell title="属性值" :value="formData.name || '-'" />
      <wd-cell title="备注" :value="formData.remark || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['product:property:update', 'product:property:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['product:property:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['product:property:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProductPropertyValue } from '@/api/mall/product/property'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteProductPropertyValue, getProductPropertyValue, getSimpleProductPropertyList } from '@/api/mall/product/property'
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

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProductPropertyValue>({} as ProductPropertyValue) // 详情数据
const deleting = ref(false) // 删除状态
const propertyNameMap = ref<Record<number, string>>({}) // 属性编号到名称映射，用于回显所属属性名

/** 所属属性名称 */
const propertyName = computed(() => {
  const propertyId = formData.value.propertyId
  if (propertyId == null) {
    return '-'
  }
  return propertyNameMap.value[propertyId] || `属性 #${propertyId}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/property/value/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    // 同时加载属性精简列表以解析所属属性名
    const [detail, properties] = await Promise.all([
      getProductPropertyValue(props.id),
      getSimpleProductPropertyList(),
    ])
    const map: Record<number, string> = {}
    properties.forEach((item) => {
      if (item.id != null) {
        map[item.id] = item.name
      }
    })
    propertyNameMap.value = map
    formData.value = detail
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/product/property/value/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该属性值吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductPropertyValue(props.id)
    toast.success('删除成功')
    uni.$emit('mall:product-property-value:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:product-property-value:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-property-value:reload', getDetail)
})
</script>
