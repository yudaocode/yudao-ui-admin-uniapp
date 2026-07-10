<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="ProductKey" title-width="220rpx" prop="productKey">
            <view class="w-full flex items-center gap-12rpx">
              <wd-input
                v-model="formData.productKey"
                class="min-w-0 flex-1"
                placeholder="请输入 ProductKey"
                :disabled="!!props.id"
                clearable
              />
              <wd-button v-if="!props.id" size="small" type="primary" variant="plain" @click="generateProductKey">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="产品名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入产品名称" clearable />
          </wd-form-item>
          <ProductCategoryFormPicker
            v-model="formData.categoryId"
            prop="categoryId"
          />
          <yd-form-picker
            v-model="formData.deviceType"
            label="设备类型"
            prop="deviceType"
            :dict-type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
            placeholder="请选择设备类型"
            label-width="220rpx"
            :disabled="!!props.id"
          />
          <yd-form-picker
            v-if="showNetType"
            v-model="formData.netType"
            label="联网方式"
            prop="netType"
            :dict-type="DICT_TYPE.IOT_NET_TYPE"
            placeholder="请选择联网方式"
            label-width="220rpx"
          />
          <yd-form-picker
            v-model="formData.protocolType"
            label="协议类型"
            prop="protocolType"
            :dict-type="DICT_TYPE.IOT_PROTOCOL_TYPE"
            dict-kind="str"
            placeholder="请选择协议类型"
            label-width="220rpx"
          />
          <wd-form-item title="序列化类型" title-width="220rpx" center prop="serializeType">
            <wd-radio-group v-model="formData.serializeType" type="button">
              <wd-radio
                v-for="dict in getStrDictOptions(DICT_TYPE.IOT_SERIALIZE_TYPE)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="动态注册" title-width="220rpx" center prop="registerEnabled">
            <wd-switch v-model="formData.registerEnabled" />
          </wd-form-item>
          <wd-form-item title="产品图标" title-width="220rpx" prop="icon">
            <yd-upload-img v-model="formData.icon" directory="iot/product" />
          </wd-form-item>
          <wd-form-item title="产品图片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" directory="iot/product" />
          </wd-form-item>
          <wd-form-item title="产品描述" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入产品描述" :maxlength="500" show-word-limit />
          </wd-form-item>
        </wd-cell-group>
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createProduct,
  DeviceTypeEnum,
  getProduct,
  ProtocolTypeEnum,
  SerializeTypeEnum,
  updateProduct,
} from '@/api/iot/product/product'
import ProductCategoryFormPicker from '@/pages-iot/product/category/components/product-category-form-picker.vue'
import { getStrDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, ProductStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑产品' : '新增产品')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Product>({
  id: undefined,
  name: '',
  productKey: '',
  categoryId: undefined,
  icon: '',
  picUrl: '',
  description: '',
  status: ProductStatusEnum.UNPUBLISHED,
  deviceType: DeviceTypeEnum.DEVICE,
  netType: undefined,
  protocolType: ProtocolTypeEnum.MQTT,
  serializeType: SerializeTypeEnum.JSON,
  registerEnabled: false,
}) // 表单数据
const formSchema = createFormSchema({
  productKey: [{ required: true, message: 'ProductKey 不能为空' }],
  name: [{ required: true, message: '产品名称不能为空' }],
  categoryId: [{ required: true, message: '产品分类不能为空' }],
  deviceType: [{ required: true, message: '设备类型不能为空' }],
  netType: [{ required: model => [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(model?.deviceType), message: '联网方式不能为空' }],
  protocolType: [{ required: true, message: '协议类型不能为空' }],
  serializeType: [{ required: true, message: '序列化类型不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const showNetType = computed(() => {
  return [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(formData.value.deviceType as number)
}) // 仅直连/网关需要联网方式

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/product/product/index')
}

/** 生成 ProductKey */
function generateProductKey() {
  formData.value.productKey = Math.random().toString(36).slice(2, 18).padEnd(16, '0')
}

/** 加载产品详情 */
async function getDetail() {
  if (!props.id) {
    generateProductKey()
    return
  }
  formData.value = await getProduct(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (!showNetType.value) {
      data.netType = undefined // 网关子设备不需要联网方式
    }
    if (props.id) {
      await updateProduct(data)
      toast.success('修改成功')
    } else {
      await createProduct(data)
      toast.success('新增成功')
    }
    uni.$emit('iot:product:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
})
</script>
