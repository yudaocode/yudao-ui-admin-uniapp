<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="设备编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="设备名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入设备名称" clearable />
          </wd-form-item>
          <wd-form-item title="品牌" title-width="220rpx" prop="brand">
            <wd-input v-model="formData.brand" placeholder="请输入品牌" clearable />
          </wd-form-item>
          <wd-form-item title="规格型号" title-width="220rpx" prop="specification">
            <wd-input v-model="formData.specification" placeholder="请输入规格型号" clearable />
          </wd-form-item>
          <MachineryTypeFormPicker v-model="formData.machineryTypeId" label="设备类型" label-width="220rpx" prop="machineryTypeId" placeholder="请选择设备类型" />
          <WorkshopFormPicker v-model="formData.workshopId" label="所属车间" label-width="220rpx" prop="workshopId" placeholder="请选择车间" />
          <yd-form-picker v-model="formData.status" label="设备状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.MES_DV_MACHINERY_STATUS" placeholder="请选择设备状态" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <MachineryRecordList v-if="props.id" :machinery-id="Number(props.id)" />
      <view class="h-160rpx" />
    </scroll-view>
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
import type { DvMachinery } from '@/api/mes/dv/machinery'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMachinery, getMachinery, updateMachinery } from '@/api/mes/dv/machinery'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import MachineryTypeFormPicker from '@/pages-mes/dv/machinery/type/components/machinery-type-form-picker.vue'
import WorkshopFormPicker from '@/pages-mes/md/workstation/workshop/components/workshop-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesDvMachineryStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MachineryRecordList from '../components/machinery-record-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑设备' : '新增设备')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<DvMachinery>({
  id: undefined,
  code: '',
  name: '',
  brand: '',
  specification: '',
  machineryTypeId: undefined,
  workshopId: undefined,
  status: MesDvMachineryStatusEnum.STOP,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '设备编码不能为空' }],
  name: [{ required: true, message: '设备名称不能为空' }],
  machineryTypeId: [{ required: true, message: '设备类型不能为空' }],
  workshopId: [{ required: true, message: '所属车间不能为空' }],
  status: [{ required: true, message: '设备状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/index')
}

/** 加载设备详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMachinery(Number(props.id))
}

/** 生成设备编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_MACHINERY_CODE)
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
      await updateMachinery(formData.value)
      toast.success('修改成功')
    } else {
      await createMachinery(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:machinery:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
