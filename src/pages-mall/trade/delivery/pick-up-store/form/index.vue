<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="门店名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入门店名称" />
          </wd-form-item>
          <wd-form-item title="联系电话" title-width="200rpx" prop="phone">
            <wd-input v-model="formData.phone" clearable placeholder="请输入联系电话" />
          </wd-form-item>
          <wd-form-item title="门店 Logo" title-width="200rpx" prop="logo">
            <yd-upload-img v-model="formData.logo" />
          </wd-form-item>
          <yd-tree-select v-model="formData.areaId" label="所在地区" prop="areaId" label-width="200rpx" :data="areaTree" placeholder="请选择所在地区" />
          <wd-form-item title="详细地址" title-width="200rpx" prop="detailAddress">
            <wd-textarea v-model="formData.detailAddress" clearable :maxlength="200" placeholder="请输入详细地址" />
          </wd-form-item>
          <wd-form-item title="营业开始" title-width="200rpx" prop="openingTime" is-link :value="formData.openingTime" placeholder="请选择营业开始时间" @click="timePickerVisible.opening = true" />
          <wd-datetime-picker v-model="formData.openingTime" v-model:visible="timePickerVisible.opening" title="请选择营业开始时间" type="time" />
          <wd-form-item title="营业结束" title-width="200rpx" prop="closingTime" is-link :value="formData.closingTime" placeholder="请选择营业结束时间" @click="timePickerVisible.closing = true" />
          <wd-datetime-picker v-model="formData.closingTime" v-model:visible="timePickerVisible.closing" title="请选择营业结束时间" type="time" />
          <wd-form-item title="纬度" title-width="200rpx" prop="latitude" center>
            <wd-input-number v-model="formData.latitude" :min="-90" :max="90" :step="0.000001" :precision="6" input-width="280rpx" allow-null />
          </wd-form-item>
          <wd-form-item title="经度" title-width="200rpx" prop="longitude" center>
            <wd-input-number v-model="formData.longitude" :min="-180" :max="180" :step="0.000001" :precision="6" input-width="280rpx" allow-null />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="简介" title-width="200rpx" prop="introduction">
            <wd-textarea v-model="formData.introduction" clearable :maxlength="500" placeholder="请输入简介" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createDeliveryPickUpStore,
  getDeliveryPickUpStore,
  updateDeliveryPickUpStore,
} from '@/api/mall/trade/delivery/pick-up-store'
import { getAreaTree } from '@/api/system/area'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { isMobile } from '@/utils/validator'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑自提门店' : '新增自提门店')
const formLoading = ref(false) // 表单提交状态
const areaTree = ref<any[]>([]) // 地区树数据
const formData = ref<DeliveryPickUpStore>({
  id: undefined,
  name: '',
  phone: '',
  logo: '',
  areaId: undefined,
  detailAddress: '',
  openingTime: '09:00',
  closingTime: '18:00',
  latitude: undefined,
  longitude: undefined,
  status: CommonStatusEnum.ENABLE,
  introduction: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '门店名称不能为空' }],
  phone: [
    { required: true, message: '联系电话不能为空' },
    { validator: value => !value || isMobile(String(value)) || '手机号格式不正确' },
  ],
  areaId: [{ required: true, message: '所在地区不能为空' }],
  detailAddress: [{ required: true, message: '详细地址不能为空' }],
  openingTime: [{ required: true, message: '营业开始时间不能为空' }],
  closingTime: [{ required: true, message: '营业结束时间不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
  latitude: [{ required: true, message: '纬度不能为空' }],
  longitude: [{ required: true, message: '经度不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const timePickerVisible = reactive({ opening: false, closing: false }) // 营业时间选择弹窗

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/pick-up-store/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getDeliveryPickUpStore(parseId(props.id) as number)
  formData.value = { ...data }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: DeliveryPickUpStore = { ...formData.value }
    if (props.id) {
      await updateDeliveryPickUpStore(data)
      toast.success('修改成功')
    } else {
      await createDeliveryPickUpStore(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:delivery-pick-up-store:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getAreaTree().then((list) => {
      areaTree.value = list
    }),
  ])
})
</script>
