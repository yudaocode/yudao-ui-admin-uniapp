<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-tree-select
            v-model="formData.parentId"
            :data="machineryTypeTree"
            label="上级类型"
            prop="parentId"
            label-width="220rpx"
            placeholder="请选择上级类型"
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
              disabled: 'disabled',
            }"
          />
          <wd-form-item title="类型编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="类型名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入类型名称" clearable />
          </wd-form-item>
          <wd-form-item title="显示排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" placeholder="请选择状态" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvMachineryType } from '@/api/mes/dv/machinery/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMachineryType, getMachineryType, getMachineryTypeSimpleList, updateMachineryType } from '@/api/mes/dv/machinery/type'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
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
const getTitle = computed(() => props.id ? '编辑设备类型' : '新增设备类型')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
type MachineryTypeTreeNode = Omit<DvMachineryType, 'children'> & {
  children?: MachineryTypeTreeNode[]
  disabled?: boolean
}
const formData = ref<DvMachineryType>({
  id: undefined,
  parentId: props.parentId ? Number(props.parentId) : 0,
  code: '',
  name: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '上级类型不能为空' }],
  code: [{ required: true, message: '类型编码不能为空' }],
  name: [{ required: true, message: '类型名称不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const machineryTypeList = ref<DvMachineryType[]>([]) // 类型列表
const machineryTypeTree = computed(() => { // 类型树形选项
  const tree = buildTreeNodes(handleTree(machineryTypeList.value) as MachineryTypeTreeNode[])
  return [{ id: 0, name: '顶级类型' }, ...tree]
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/type/index')
}

/** 构建类型树节点 */
function buildTreeNodes(nodes: MachineryTypeTreeNode[], parentDisabled = false): MachineryTypeTreeNode[] {
  return nodes.map((node) => {
    const disabled = parentDisabled || (!!props.id && node.id === Number(props.id))
    return {
      ...node,
      disabled,
      children: node.children ? buildTreeNodes(node.children, disabled) : undefined,
    }
  })
}

/** 加载设备类型详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getMachineryType(Number(props.id))
  formData.value = {
    id: data.id,
    parentId: data.parentId,
    code: data.code,
    name: data.name,
    sort: data.sort,
    status: data.status,
    remark: data.remark || '',
  }
}

/** 生成设备类型编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode('MD_MACHINERY_TYPE_CODE')
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
      await updateMachineryType(formData.value)
      toast.success('修改成功')
    } else {
      await createMachineryType(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:machinery-type:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  machineryTypeList.value = await getMachineryTypeSimpleList()
  await getDetail()
})
</script>
