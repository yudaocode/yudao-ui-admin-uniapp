<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="库区编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="库区名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入库区名称" clearable />
          </wd-form-item>
          <WarehouseFormPicker v-model="formData.warehouseId" label="所属仓库" label-width="220rpx" prop="warehouseId" placeholder="请选择仓库" />
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number v-model="formData.area" allow-null :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="是否冻结" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.frozen" />
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
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWarehouseLocation, getWarehouseLocation, updateWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import WarehouseFormPicker from '@/pages-mes/wm/warehouse/components/warehouse-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { MesAutoCodeRuleCode } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
  warehouseId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑库区' : '新增库区')
const routeWarehouseId = computed(() => props.warehouseId ? Number(props.warehouseId) : undefined) // 路由仓库编号
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmWarehouseLocation>({
  id: undefined,
  code: '',
  name: '',
  warehouseId: undefined,
  area: undefined,
  frozen: false,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '库区编码不能为空' }],
  name: [{ required: true, message: '库区名称不能为空' }],
  warehouseId: [{ required: true, message: '所属仓库不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  const warehouseId = routeWarehouseId.value || formData.value.warehouseId
  navigateBackPlus(`/pages-mes/wm/warehouse/location/index${warehouseId ? `?warehouseId=${warehouseId}` : ''}`)
}

/** 加载库区详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getWarehouseLocation(Number(props.id))
}

/** 应用路由上下文 */
function applyRouteContext() {
  if (props.id || !routeWarehouseId.value) {
    return
  }
  formData.value.warehouseId = routeWarehouseId.value
}

/** 生成库区编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_LOCATION_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || formData.value.warehouseId === undefined) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateWarehouseLocation(formData.value)
      toast.success('修改成功')
    } else {
      await createWarehouseLocation(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:warehouse-location:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  applyRouteContext()
  await getDetail()
})
</script>
