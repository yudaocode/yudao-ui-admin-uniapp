<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view class="pb-180rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <ProductFormPicker v-model="formData.productId" label="所属产品" label-width="220rpx" prop="productId" :disabled="!!props.id || !!props.productId" @change="handleProductChange" />
          <wd-form-item title="功能类型" title-width="220rpx" center prop="type">
            <wd-radio-group v-model="formData.type" type="button" :disabled="!!props.id">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.IOT_THING_MODEL_TYPE)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="功能名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入功能名称" clearable />
          </wd-form-item>
          <wd-form-item title="标识符" title-width="220rpx" prop="identifier">
            <wd-input v-model="formData.identifier" placeholder="请输入标识符" :disabled="!!props.id" clearable />
          </wd-form-item>

          <!-- 属性配置 -->
          <template v-if="formData.type === IoTThingModelTypeEnum.PROPERTY">
            <yd-form-picker
              v-model="property.dataType"
              label="数据类型"
              :columns="dataTypeOptions"
              placeholder="请选择数据类型"
              label-width="220rpx"
              @confirm="onPropertyDataTypeChange"
            />
            <DataSpecsForm :target="property" title-width="220rpx" @update:target="assignPropertyTarget" />
            <wd-form-item title="读写类型" title-width="220rpx" center>
              <wd-radio-group v-model="property.accessMode" type="button">
                <wd-radio
                  v-for="opt in accessModeOptions"
                  :key="opt.value"
                  :name="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
          </template>

          <!-- 服务配置 -->
          <wd-form-item v-else-if="formData.type === IoTThingModelTypeEnum.SERVICE" title="调用方式" title-width="220rpx" center>
            <wd-radio-group v-model="callType" type="button">
              <wd-radio
                v-for="opt in callTypeOptions"
                :key="opt.value"
                :name="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>

          <!-- 事件配置 -->
          <wd-form-item v-else-if="formData.type === IoTThingModelTypeEnum.EVENT" title="事件类型" title-width="220rpx" center>
            <wd-radio-group v-model="eventType" type="button">
              <wd-radio
                v-for="opt in eventTypeOptions"
                :key="opt.value"
                :name="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>

          <wd-form-item title="是否必选" title-width="220rpx" center>
            <wd-switch v-model="required" />
          </wd-form-item>
          <wd-form-item title="功能描述" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入功能描述" :maxlength="300" show-word-limit />
          </wd-form-item>
        </wd-cell-group>

        <!-- 服务：输入 / 输出参数 -->
        <template v-if="formData.type === IoTThingModelTypeEnum.SERVICE">
          <view class="mt-20rpx">
            <ParamList v-model="inputParams" direction="input" title="输入参数" />
          </view>
          <view class="mt-20rpx">
            <ParamList v-model="outputParams" direction="output" title="输出参数" />
          </view>
        </template>
        <!-- 事件：输出参数 -->
        <view v-else-if="formData.type === IoTThingModelTypeEnum.EVENT" class="mt-20rpx">
          <ParamList v-model="outputParams" direction="output" title="输出参数" />
        </view>
      </wd-form>
    </view>

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
import type { Product } from '@/api/iot/product/product'
import type { ThingModelData, ThingModelParam } from '@/api/iot/thingmodel'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { getProduct } from '@/api/iot/product/product'
import { createThingModel, getThingModel, updateThingModel } from '@/api/iot/thingmodel'
import { getIntDictOptions } from '@/hooks/useDict'
import ProductFormPicker from '@/pages-iot/product/product/components/product-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, getDataTypeOptions, IoTDataSpecsDataTypeEnum, IoTThingModelAccessModeEnum, IoTThingModelEventTypeEnum, IoTThingModelServiceCallTypeEnum, IoTThingModelTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import DataSpecsForm from '../components/data-specs-form.vue'
import ParamList from '../components/param-list.vue'
import { seedDataSpecs, validateThingModelDataSpecs, validateThingModelParamList } from '@/pages-iot/thingmodel/utils/thing-model'

const props = defineProps<{ id?: number | string, productId?: number | string }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const RESERVED_IDENTIFIERS = ['set', 'get', 'post', 'property', 'event', 'time', 'value'] // 标识符保留字

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑物模型' : '新增物模型')
const formLoading = ref(false) // 表单提交状态
const selectedProduct = ref<Product>() // 当前产品
const dataTypeOptions = getDataTypeOptions() // 数据类型选项
const accessModeOptions = Object.values(IoTThingModelAccessModeEnum) // 读写类型选项
const callTypeOptions = Object.values(IoTThingModelServiceCallTypeEnum) // 调用方式选项
const eventTypeOptions = Object.values(IoTThingModelEventTypeEnum) // 事件类型选项
const required = ref(false) // 是否必选
const callType = ref<string>(IoTThingModelServiceCallTypeEnum.ASYNC.value) // 服务调用方式
const eventType = ref<string>(IoTThingModelEventTypeEnum.INFO.value) // 事件类型
const inputParams = ref<ThingModelParam[]>([]) // 服务输入参数
const outputParams = ref<ThingModelParam[]>([]) // 服务/事件输出参数
const property = reactive<Record<string, any>>({
  dataType: IoTDataSpecsDataTypeEnum.INT,
  dataSpecs: { dataType: IoTDataSpecsDataTypeEnum.INT },
  dataSpecsList: [],
  accessMode: IoTThingModelAccessModeEnum.READ_WRITE.value,
}) // 属性配置
const formData = ref<ThingModelData>({
  id: undefined,
  productId: props.productId ? Number(props.productId) : undefined,
  type: IoTThingModelTypeEnum.PROPERTY,
  name: '',
  identifier: '',
  description: '',
}) // 表单数据
const formSchema = createFormSchema({
  productId: [{ required: true, message: '所属产品不能为空' }],
  type: [{ required: true, message: '功能类型不能为空' }],
  name: [
    { required: true, message: '功能名称不能为空' },
    {
      pattern: /^[\u4E00-\u9FA5a-z0-9][\u4E00-\u9FA5\w\-/\\.]{0,29}$/i,
      message: '支持中文、字母、数字、短划线、下划线、斜杠和小数点，不超过 30 个字符',
    },
  ],
  identifier: [
    { required: true, message: '标识符不能为空' },
    { pattern: /^[a-z]\w{0,31}$/i, message: '标识符必须以字母开头，不超过 32 个字符' },
    { validator: value => !RESERVED_IDENTIFIERS.includes(String(value)), message: '标识符不能使用系统保留字' },
  ],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/thingmodel/index${formData.value.productId ? `?productId=${formData.value.productId}` : ''}`)
}

/** 属性数据类型切换 */
function onPropertyDataTypeChange() {
  seedDataSpecs(property, property.dataType)
}

/** 更新属性数据定义 */
function assignPropertyTarget(target: Record<string, any>) {
  Object.assign(property, target)
}

/** 加载物模型详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getThingModel(Number(props.id))
  const data = formData.value
  if (data.type === IoTThingModelTypeEnum.PROPERTY && data.property) {
    property.dataType = data.property.dataType || data.dataType || IoTDataSpecsDataTypeEnum.INT
    property.dataSpecs = data.property.dataSpecs || { dataType: property.dataType }
    property.dataSpecsList = data.property.dataSpecsList || []
    property.accessMode = data.property.accessMode || IoTThingModelAccessModeEnum.READ_WRITE.value
    required.value = !!data.property.required
  } else if (data.type === IoTThingModelTypeEnum.SERVICE && data.service) {
    callType.value = data.service.callType || IoTThingModelServiceCallTypeEnum.ASYNC.value
    required.value = !!data.service.required
    inputParams.value = data.service.inputParams || []
    outputParams.value = data.service.outputParams || []
  } else if (data.type === IoTThingModelTypeEnum.EVENT && data.event) {
    eventType.value = data.event.type || IoTThingModelEventTypeEnum.INFO.value
    required.value = !!data.event.required
    outputParams.value = data.event.outputParams || []
  }
}

/** 加载所属产品 */
async function loadSelectedProduct(productId?: number) {
  if (!productId) {
    selectedProduct.value = undefined
    formData.value.productKey = undefined
    return
  }
  selectedProduct.value = await getProduct(productId)
  formData.value.productKey = selectedProduct.value.productKey
}

/** 构建提交数据 */
function buildSubmitData() {
  const base: any = {
    ...formData.value,
    productKey: formData.value.productKey,
    property: undefined,
    service: undefined,
    event: undefined,
  }
  if (base.type === IoTThingModelTypeEnum.PROPERTY) {
    base.dataType = property.dataType
    base.property = cleanDataSpecs({
      identifier: base.identifier,
      name: base.name,
      accessMode: property.accessMode,
      required: required.value,
      dataType: property.dataType,
      description: base.description,
      dataSpecs: property.dataSpecs,
      dataSpecsList: property.dataSpecsList,
    })
  } else if (base.type === IoTThingModelTypeEnum.SERVICE) {
    base.dataType = undefined
    base.service = {
      identifier: base.identifier,
      name: base.name,
      callType: callType.value,
      required: required.value,
      description: base.description,
      inputParams: buildParamList(inputParams.value),
      outputParams: buildParamList(outputParams.value),
    }
  } else if (base.type === IoTThingModelTypeEnum.EVENT) {
    base.dataType = undefined
    base.event = {
      identifier: base.identifier,
      name: base.name,
      type: eventType.value,
      required: required.value,
      description: base.description,
      outputParams: buildParamList(outputParams.value),
    }
  }
  return base
}

/** 选择产品 */
function handleProductChange(products: Product[]) {
  selectedProduct.value = products[0]
  formData.value.productKey = selectedProduct.value?.productKey
}

/** 清理空的数据定义 */
function cleanDataSpecs<T extends Record<string, any>>(source: T): T {
  const data = { ...source }
  if (!data.dataSpecs || Object.keys(data.dataSpecs).length === 0) {
    delete data.dataSpecs
  }
  if (!data.dataSpecsList?.length) {
    delete data.dataSpecsList
  }
  return data as T
}

/** 构建参数列表 */
function buildParamList(list: ThingModelParam[]) {
  return list.map((item, index) => cleanDataSpecs({
    ...item,
    paraOrder: index + 1,
  }))
}

/** 校验业务数据定义 */
function validateBusinessData() {
  if (formData.value.type === IoTThingModelTypeEnum.PROPERTY) {
    return validateThingModelDataSpecs(property, '属性数据定义')
  }
  if (formData.value.type === IoTThingModelTypeEnum.SERVICE) {
    return validateThingModelParamList(inputParams.value, '输入参数')
      || validateThingModelParamList(outputParams.value, '输出参数')
  }
  if (formData.value.type === IoTThingModelTypeEnum.EVENT) {
    return validateThingModelParamList(outputParams.value, '输出参数')
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.value.productKey) {
    toast.warning('产品信息加载中，请稍后重试')
    return
  }
  const error = validateBusinessData()
  if (error) {
    toast.warning(error)
    return
  }

  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (props.id) {
      await updateThingModel(data)
      toast.success('修改成功')
    } else {
      await createThingModel(data)
      toast.success('新增成功')
    }
    uni.$emit('iot:thingmodel:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
  await loadSelectedProduct(formData.value.productId)
})
</script>
