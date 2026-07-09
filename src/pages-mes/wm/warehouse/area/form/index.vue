<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="库位编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="库位名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入库位名称" clearable />
          </wd-form-item>
          <WarehouseFormPicker v-model="formData.warehouseId" label="所属仓库" label-width="220rpx" prop="warehouseId" placeholder="请选择仓库" @change="handleWarehouseChange" />
          <WarehouseLocationFormPicker v-model="formData.locationId" label="所属库区" label-width="220rpx" prop="locationId" :warehouse-id="formData.warehouseId" placeholder="请选择库区" />
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number v-model="formData.area" allow-null :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="最大载重(kg)" title-width="220rpx" prop="maxLoad" center>
            <wd-input-number v-model="formData.maxLoad" allow-null :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="位置X" title-width="220rpx" prop="positionX" center>
            <wd-input-number v-model="formData.positionX" allow-null :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="位置Y" title-width="220rpx" prop="positionY" center>
            <wd-input-number v-model="formData.positionY" allow-null :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="位置Z" title-width="220rpx" prop="positionZ" center>
            <wd-input-number v-model="formData.positionZ" allow-null :min="0" :precision="0" />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" placeholder="请选择状态" />
          <wd-cell title="是否冻结" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.frozen" />
            </view>
          </wd-cell>
          <wd-cell title="允许物料混放" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.allowItemMixing" />
            </view>
          </wd-cell>
          <wd-cell title="允许批次混放" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.allowBatchMixing" />
            </view>
          </wd-cell>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
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
import type { WmWarehouseArea } from '@/api/mes/wm/warehouse/area'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWarehouseArea, getWarehouseArea, updateWarehouseArea } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import WarehouseFormPicker from '@/pages-mes/wm/warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '@/pages-mes/wm/warehouse/location/components/warehouse-location-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
  warehouseId?: number | string
  locationId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑库位' : '新增库位')
const routeWarehouseId = computed(() => props.warehouseId ? Number(props.warehouseId) : undefined) // 路由仓库编号
const routeLocationId = computed(() => props.locationId ? Number(props.locationId) : undefined) // 路由库区编号
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmWarehouseArea>({
  id: undefined,
  code: '',
  name: '',
  warehouseId: undefined,
  locationId: undefined,
  area: undefined,
  maxLoad: undefined,
  positionX: undefined,
  positionY: undefined,
  positionZ: undefined,
  status: CommonStatusEnum.ENABLE,
  frozen: false,
  allowItemMixing: true,
  allowBatchMixing: true,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '库位编码不能为空' }],
  name: [{ required: true, message: '库位名称不能为空' }],
  warehouseId: [{ required: true, message: '所属仓库不能为空' }],
  locationId: [{ required: true, message: '所属库区不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  const locationId = routeLocationId.value || formData.value.locationId
  navigateBackPlus(`/pages-mes/wm/warehouse/area/index${locationId ? `?locationId=${locationId}` : ''}`)
}

/** 选择仓库 */
function handleWarehouseChange() {
  formData.value.locationId = undefined
}

/** 生成库位编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_AREA_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 加载库位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getWarehouseArea(Number(props.id))
}

/** 应用路由上下文 */
async function applyRouteContext() {
  if (props.id) {
    return
  }
  if (routeWarehouseId.value) {
    formData.value.warehouseId = routeWarehouseId.value
  }
  if (!routeLocationId.value) {
    return
  }
  formData.value.locationId = routeLocationId.value
  if (formData.value.warehouseId) {
    return
  }
  const location = await getWarehouseLocation(routeLocationId.value)
  formData.value.warehouseId = location.warehouseId
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || formData.value.locationId === undefined) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateWarehouseArea(formData.value)
      toast.success('修改成功')
    } else {
      await createWarehouseArea(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:warehouse-area:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await applyRouteContext()
  await getDetail()
})
</script>
