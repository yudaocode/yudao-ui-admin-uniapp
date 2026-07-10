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
          装箱单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入装箱单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单编号
        </view>
        <wd-input v-model="formData.salesOrderCode" placeholder="请输入销售订单编号" clearable />
      </view>
      <ClientSearchPicker ref="clientSearchPickerRef" v-model="formData.clientId" label="客户" placeholder="请选择客户" />
      <UserSearchPicker ref="inspectorPickerRef" v-model="formData.inspectorUserId" label="检查员" placeholder="请选择检查员" />
      <yd-search-picker
        ref="statusSearchPickerRef"
        v-model="formData.status"
        label="单据状态"
        :dict-type="DICT_TYPE.MES_WM_PACKAGE_STATUS"
        all-option
      />
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import ClientSearchPicker from '@/pages-mes/md/client/components/client-search-picker.vue'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const clientSearchPickerRef = ref<InstanceType<typeof ClientSearchPicker>>() // 客户搜索选择器
const inspectorPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 检查员选择器
const statusSearchPickerRef = ref<YdSearchPickerExpose>() // 状态搜索选择器
const formData = reactive<Record<string, any>>({
  code: '',
  salesOrderCode: '',
  clientId: undefined,
  inspectorUserId: undefined,
  status: undefined,
}) // 搜索表单数据
/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.salesOrderCode) {
    conditions.push(`销售订单:${formData.salesOrderCode}`)
  }
  if (formData.clientId != null) {
    conditions.push(`客户:${clientSearchPickerRef.value?.format(formData.clientId) || formData.clientId}`)
  }
  const inspectorName = inspectorPickerRef.value?.format(formData.inspectorUserId)
  if (inspectorName) {
    conditions.push(`检查员:${inspectorName}`)
  }
  if (formData.status !== undefined && formData.status !== -1) {
    conditions.push(`状态:${statusSearchPickerRef.value?.format(formData.status) || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索装箱单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    salesOrderCode: formData.salesOrderCode || undefined,
    clientId: formData.clientId,
    inspectorUserId: formData.inspectorUserId,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.salesOrderCode = ''
  formData.clientId = undefined
  formData.inspectorUserId = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
