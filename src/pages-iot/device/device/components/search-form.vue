<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          DeviceName
        </view>
        <wd-input v-model="formData.deviceName" placeholder="请输入 DeviceName" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注名称
        </view>
        <wd-input v-model="formData.nickname" placeholder="请输入备注名称" clearable />
      </view>
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" label="所属产品" />
      <yd-search-picker
        v-model="formData.deviceType"
        label="设备类型"
        :dict-type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
        all-option
      />
      <yd-search-picker
        v-model="formData.status"
        label="设备状态"
        :dict-type="DICT_TYPE.IOT_DEVICE_STATE"
        all-option
      />
      <DeviceGroupSearchPicker ref="groupPickerRef" v-model="formData.groupId" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import DeviceGroupSearchPicker from '@/pages-iot/device/group/components/device-group-search-picker.vue'
import ProductSearchPicker from '@/pages-iot/product/product/components/product-search-picker.vue'

const props = defineProps<{ defaultProductId?: number | any }>()
const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const groupPickerRef = ref<InstanceType<typeof DeviceGroupSearchPicker>>() // 设备分组选择器
const defaultProductId = props.defaultProductId ? Number(props.defaultProductId) : undefined // 入口预置产品
const formData = reactive({
  deviceName: undefined as string | undefined,
  nickname: undefined as string | undefined,
  productId: defaultProductId as number | undefined,
  deviceType: undefined as number | undefined,
  status: undefined as number | undefined,
  groupId: undefined as number | undefined,
}) // 搜索表单数据
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.deviceName) {
    conditions.push(`DeviceName:${formData.deviceName}`)
  }
  if (formData.nickname) {
    conditions.push(`备注:${formData.nickname}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.deviceType !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE, formData.deviceType)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.IOT_DEVICE_STATE, formData.status)}`)
  }
  if (formData.groupId) {
    conditions.push(`分组:${groupPickerRef.value?.format(formData.groupId) || formData.groupId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索设备'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    deviceName: formData.deviceName || undefined,
    nickname: formData.nickname || undefined,
    productId: formData.productId,
    deviceType: formData.deviceType,
    groupId: formData.groupId,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.deviceName = undefined
  formData.nickname = undefined
  formData.productId = defaultProductId
  formData.deviceType = undefined
  formData.groupId = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
