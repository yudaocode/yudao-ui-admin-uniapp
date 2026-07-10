<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="工作站编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工作站名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工作站名称" clearable />
          </wd-form-item>
          <WorkshopFormPicker
            v-model="formData.workshopId"
            label="所在车间"
            prop="workshopId"
            placeholder="请选择车间"
          />
          <wd-form-item title="工作站地点" title-width="220rpx" prop="address">
            <wd-input v-model="formData.address" placeholder="请输入工作站地点" clearable />
          </wd-form-item>
          <ProcessFormPicker
            v-model="formData.processId"
            label="所属工序"
            prop="processId"
            placeholder="请选择工序"
          />
          <WarehouseFormPicker
            v-model="formData.warehouseId"
            label="线边仓库"
            placeholder="请选择仓库"
            clearable
            @change="handleWarehouseChange"
          />
          <WarehouseLocationFormPicker
            v-model="formData.locationId"
            label="库区"
            placeholder="请选择库区"
            :warehouse-id="formData.warehouseId"
            clearable
            @change="handleLocationChange"
          />
          <WarehouseAreaFormPicker
            v-model="formData.areaId"
            label="库位"
            placeholder="请选择库位"
            :location-id="formData.locationId"
            clearable
          />
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="220rpx"
            prop="status"
            :dict-type="DICT_TYPE.COMMON_STATUS"
            placeholder="请选择状态"
          />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <WorkstationResourceList v-if="formData.id" :workstation-id="formData.id" mode="edit" />
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
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWorkstation, getWorkstation, updateWorkstation } from '@/api/mes/md/workstation'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import ProcessFormPicker from '@/pages-mes/pro/process/components/process-form-picker.vue'
import WarehouseFormPicker from '@/pages-mes/wm/warehouse/components/warehouse-form-picker.vue'
import WarehouseAreaFormPicker from '@/pages-mes/wm/warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseLocationFormPicker from '@/pages-mes/wm/warehouse/location/components/warehouse-location-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import WorkstationResourceList from '../components/workstation-resource-list.vue'
import WorkshopFormPicker from '../workshop/components/workshop-form-picker.vue'

const props = defineProps<{ id?: number | string }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑工作站' : '新增工作站')
type WorkstationFormData = Omit<MdWorkstation, 'workshopId' | 'processId'> & {
  workshopId?: number
  processId?: number
}
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WorkstationFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '工作站编码不能为空' }],
  name: [{ required: true, message: '工作站名称不能为空' }],
  workshopId: [{ required: true, message: '所在车间不能为空' }],
  processId: [{ required: true, message: '所属工序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/index')
}

/** 获取默认表单数据 */
function getDefaultFormData(): WorkstationFormData {
  return {
    id: undefined,
    code: '',
    name: '',
    address: '',
    workshopId: undefined,
    processId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

/** 选择仓库 */
function handleWarehouseChange() {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
}

/** 选择库区 */
function handleLocationChange() {
  formData.value.areaId = undefined
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getWorkstation(Number(props.id))
}

/** 生成工作站编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode('MD_WORKSTATION_CODE')
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
    const data: MdWorkstation = {
      ...formData.value,
      workshopId: formData.value.workshopId!,
      processId: formData.value.processId!,
    }
    if (props.id) {
      await updateWorkstation(data)
      toast.success('修改成功')
    } else {
      await createWorkstation(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:workstation:reload')
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
