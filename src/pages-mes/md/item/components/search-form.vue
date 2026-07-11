<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入物料编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入物料名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料分类
        </view>
        <yd-tree-select
          v-model="formData.itemTypeId"
          :data="itemTypeTree"
          placeholder="请选择物料分类"
          :props="{
            value: 'id',
            label: 'name',
            children: 'children',
          }"
        />
      </view>
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.COMMON_STATUS" all-option />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MdItemType } from '@/api/mes/md/item/type'
import { computed, onMounted, reactive, ref } from 'vue'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  itemTypeId: undefined as number | string | undefined,
  status: undefined,
}) // 搜索表单数据
type ItemTypeTreeNode = Omit<MdItemType, 'children'> & {
  children?: ItemTypeTreeNode[]
}
const itemTypeTree = ref<ItemTypeTreeNode[]>([]) // 分类树数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索物料产品'
})

/** 加载分类树 */
async function loadTree() {
  const data = await getItemTypeList()
  itemTypeTree.value = handleTree(toTreeNodes(data || []))
}

/** 转换为页面树节点 */
function toTreeNodes(data: MdItemType[]): ItemTypeTreeNode[] {
  return data.map(item => ({
    ...item,
    children: item.children ? toTreeNodes(item.children) : undefined,
  }))
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    itemTypeId: formData.itemTypeId || undefined,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.itemTypeId = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadTree()
})
</script>
