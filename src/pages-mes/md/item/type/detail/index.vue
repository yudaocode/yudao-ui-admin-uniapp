<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="物料产品分类详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="分类编码" :value="formData?.code || '-'" />
        <wd-cell title="分类名称" :value="formData?.name || '-'" />
        <wd-cell title="上级分类" :value="getParentName() || '-'" />
        <wd-cell title="物料/产品标识">
          <dict-tag
            v-if="formData?.itemOrProduct"
            :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT"
            :value="formData.itemOrProduct"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="显示排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:md-item-type:create'])"
          class="flex-1" type="success" @click="handleAddChild"
        >
          新增子分类
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-item-type:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-item-type:delete']) && (formData?.parentId ?? 0) !== 0"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdItemType } from '@/api/mes/md/item/type'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteItemType, getItemType, getItemTypeSimpleList } from '@/api/mes/md/item/type'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<MdItemType>() // 详情数据
const deleting = ref(false) // 删除状态
const itemTypeList = ref<MdItemType[]>([]) // 分类列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/type/index')
}

/** 获取上级分类名称 */
function getParentName(): string {
  if (!formData.value?.parentId || formData.value.parentId === 0) {
    return '顶级分类'
  }
  const parent = itemTypeList.value.find(item => item.id === formData.value?.parentId)
  return parent?.name || '未知'
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getItemType(Number(props.id))
}

/** 新增子分类 */
function handleAddChild() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/md/item/type/form/index?parentId=${props.id}`,
  })
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/md/item/type/form/index?id=${props.id}`,
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
      msg: '确定要删除该物料产品分类吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteItemType(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:item:type:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  itemTypeList.value = await getItemTypeSimpleList()
  uni.$on('mes:md:item:type:reload', getDetail)
  await getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:type:reload', getDetail)
})
</script>
