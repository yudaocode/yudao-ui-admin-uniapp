<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="工具编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" :disabled="!!props.id" clearable>
              <template v-if="!props.id" #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工具名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工具名称" clearable />
          </wd-form-item>
          <wd-form-item title="品牌" title-width="220rpx" prop="brand">
            <wd-input v-model="formData.brand" placeholder="请输入品牌" clearable />
          </wd-form-item>
          <wd-form-item title="型号规格" title-width="220rpx" prop="specification">
            <wd-input v-model="formData.specification" placeholder="请输入型号规格" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.toolTypeId" label="工具类型" label-width="220rpx" prop="toolTypeId" :columns="typeOptions" label-key="name" value-key="id" placeholder="请选择工具类型" @confirm="handleToolTypeConfirm" />
          <wd-form-item title="库存数量" title-width="220rpx" prop="quantity" center>
            <wd-input-number v-model="formData.quantity" :min="1" :precision="0" :disabled="selectedToolType?.codeFlag === true" @change="handleQuantityChange" />
          </wd-form-item>
          <wd-form-item title="可用数量" title-width="220rpx" prop="availableQuantity" center>
            <wd-input-number v-model="formData.availableQuantity" :min="0" :precision="0" disabled />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.MES_TM_TOOL_STATUS" placeholder="请选择状态" disabled />
          <yd-form-picker v-model="formData.maintenType" label="保养维护类型" label-width="220rpx" prop="maintenType" :dict-type="DICT_TYPE.MES_TM_MAINTEN_TYPE" placeholder="请选择保养维护类型" />
          <wd-form-item v-if="formData.maintenType === MesMaintenTypeEnum.REGULAR" title="下次保养日期" title-width="220rpx" prop="nextMaintenDate" is-link :value="formatDateTime(formData.nextMaintenDate) || ''" placeholder="请选择下次保养日期" @click="dateVisible.nextMaintenDate = true" />
          <wd-datetime-picker v-model="formData.nextMaintenDate" v-model:visible="dateVisible.nextMaintenDate" title="请选择下次保养日期" type="datetime" />
          <wd-form-item v-if="formData.maintenType === MesMaintenTypeEnum.USAGE" title="下次保养周期" title-width="220rpx" prop="nextMaintenPeriod" center>
            <wd-input-number v-model="formData.nextMaintenPeriod" allow-null :min="1" :precision="0" />
          </wd-form-item>
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
import type { TmTool } from '@/api/mes/tm/tool'
import { createTool, getTool, updateTool } from '@/api/mes/tm/tool'
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { getToolTypeSimpleList } from '@/api/mes/tm/tool/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesMaintenTypeEnum, MesToolStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑工具' : '新增工具')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<TmTool>({
  id: undefined,
  code: '',
  name: '',
  brand: '',
  specification: '',
  toolTypeId: undefined,
  quantity: 1,
  availableQuantity: 1,
  status: MesToolStatusEnum.STORE,
  maintenType: undefined,
  nextMaintenPeriod: undefined,
  nextMaintenDate: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '工具编码不能为空' }],
  name: [{ required: true, message: '工具名称不能为空' }],
  toolTypeId: [{ required: true, message: '工具类型不能为空' }],
  quantity: [{ required: true, message: '数量不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const typeOptions = ref<TmToolType[]>([]) // 工具类型选项
const selectedToolType = ref<TmToolType>() // 当前选中的工具类型
const dateVisible = reactive({
  nextMaintenDate: false,
}) // 日期选择器状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/tm/tool/index')
}

/** 加载工具类型选项 */
async function loadOptions() {
  typeOptions.value = await getToolTypeSimpleList() || []
}

/** 加载工具详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getTool(Number(props.id))
  selectedToolType.value = typeOptions.value.find(item => item.id === formData.value.toolTypeId)
}

/** 生成工具编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 确认选择工具类型 */
function handleToolTypeConfirm(value: number) {
  const toolTypeId = Number(value)
  selectedToolType.value = typeOptions.value.find(item => item.id === toolTypeId)
  if (selectedToolType.value?.codeFlag === true) {
    formData.value.quantity = 1
    formData.value.availableQuantity = 1
  }
}

/** 库存数量变更 */
function handleQuantityChange(value: number) {
  if (!props.id) {
    formData.value.availableQuantity = value
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
    if (formData.value.maintenType !== MesMaintenTypeEnum.REGULAR) {
      formData.value.nextMaintenDate = undefined
    }
    if (formData.value.maintenType !== MesMaintenTypeEnum.USAGE) {
      formData.value.nextMaintenPeriod = undefined
    }
    if (props.id) {
      await updateTool(formData.value)
      toast.success('修改成功')
    } else {
      await createTool(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:tm:tool:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
