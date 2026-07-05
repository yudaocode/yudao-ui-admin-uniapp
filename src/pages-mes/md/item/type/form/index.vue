<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-tree-select
            v-model="formData.parentId"
            :data="itemTypeTree"
            label="上级分类"
            prop="parentId"
            label-width="220rpx"
            placeholder="请选择上级分类"
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
              disabled: 'disabled',
            }"
          />
          <wd-form-item title="分类编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入分类编码或点击自动生成" clearable>
              <template #suffix>
                <wd-button
                  size="small" type="primary" variant="plain"
                  :loading="codeLoading"
                  @click="handleGenerateCode"
                >
                  自动生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="分类名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入分类名称" clearable />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.itemOrProduct"
            label="物料/产品标识"
            label-width="220rpx"
            prop="itemOrProduct"
            :dict-type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT"
            dict-kind="str"
            placeholder="请选择物料/产品标识"
          />
          <wd-form-item title="显示排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="220rpx"
            prop="status"
            :dict-type="DICT_TYPE.COMMON_STATUS"
            placeholder="请选择状态"
          />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemType } from '@/api/mes/md/item/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createItemType, getItemType, getItemTypeSimpleList, updateItemType } from '@/api/mes/md/item/type'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string, parentId?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑物料产品分类' : '新增物料产品分类')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<MdItemType>({
  id: undefined,
  parentId: props.parentId ? Number(props.parentId) : 0,
  code: '',
  name: '',
  itemOrProduct: 'ITEM',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '上级分类不能为空' }],
  code: [{ required: true, message: '分类编码不能为空' }],
  name: [{ required: true, message: '分类名称不能为空' }],
  itemOrProduct: [{ required: true, message: '物料/产品标识不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
type ItemTypeTreeNode = Omit<MdItemType, 'children'> & {
  children?: ItemTypeTreeNode[]
  disabled?: boolean
}
const itemTypeList = ref<MdItemType[]>([]) // 分类列表
const itemTypeTree = computed(() => { // 分类树形选项
  const tree = buildTreeNodes(handleTree(itemTypeList.value) as ItemTypeTreeNode[])
  return [{ id: 0, name: '顶级分类' }, ...tree]
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/type/index')
}

/** 构建分类树节点 */
function buildTreeNodes(nodes: ItemTypeTreeNode[], parentDisabled = false): ItemTypeTreeNode[] {
  return nodes.map((node) => {
    const disabled = parentDisabled || (!!props.id && node.id === Number(props.id))
    return {
      ...node,
      disabled,
      children: node.children ? buildTreeNodes(node.children, disabled) : undefined,
    }
  })
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getItemType(Number(props.id))
}

/** 自动生成分类编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode('MD_ITEM_TYPE_CODE')
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateItemType(formData.value)
      toast.success('修改成功')
    } else {
      await createItemType(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:item:type:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  itemTypeList.value = await getItemTypeSimpleList()
  await getDetail()
})
</script>
