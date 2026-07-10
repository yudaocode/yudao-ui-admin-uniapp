<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="max-h-[80vh] overflow-y-auto bg-white pb-32rpx">
      <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-24rpx">
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-icon name="close" size="36rpx" @click="visible = false" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <UserFormPicker
            v-model="formData.newOwnerUserId"
            label="新负责人"
            label-width="220rpx"
            prop="newOwnerUserId"
            placeholder="请选择新负责人"
          />
          <wd-form-item title="老负责人" title-width="220rpx" center>
            <wd-radio-group v-model="oldOwnerJoinTeam" type="button" @change="handleOwnerChange">
              <wd-radio :value="false">
                移除
              </wd-radio>
              <wd-radio :value="true">
                加入团队
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            v-if="oldOwnerJoinTeam"
            title="老负责人权限"
            title-width="220rpx"
            prop="oldOwnerPermissionLevel"
            center
          >
            <wd-radio-group v-model="formData.oldOwnerPermissionLevel" type="button">
              <wd-radio
                v-for="dict in permissionLevelOptions"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            v-if="bizType === BizTypeEnum.CRM_CUSTOMER"
            title="同时转移"
            title-width="220rpx"
            center
          >
            <wd-checkbox-group v-model="formData.toBizTypes" type="button">
              <wd-checkbox :name="BizTypeEnum.CRM_CONTACT">
                联系人
              </wd-checkbox>
              <wd-checkbox :name="BizTypeEnum.CRM_BUSINESS">
                商机
              </wd-checkbox>
              <wd-checkbox :name="BizTypeEnum.CRM_CONTRACT">
                合同
              </wd-checkbox>
            </wd-checkbox-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="p-24rpx">
        <wd-button
          type="primary"
          block
          :loading="formLoading"
          @click="handleSubmit"
        >
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { TransferReq } from '@/api/crm/permission'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { transferBusiness } from '@/api/crm/business'
import { transferClue } from '@/api/crm/clue'
import { transferContact } from '@/api/crm/contact'
import { transferContract } from '@/api/crm/contract'
import { transferCustomer } from '@/api/crm/customer'
import { BizTypeEnum, PermissionLevelEnum } from '@/api/crm/permission'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  bizType: number
}>()

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const oldOwnerJoinTeam = ref(false) // 老负责人是否加入团队
const formData = ref<TransferReq>({
  id: 0,
  newOwnerUserId: undefined as unknown as number,
  toBizTypes: [],
}) // 表单数据
const title = computed(() => {
  const titleMap: Record<number, string> = {
    [BizTypeEnum.CRM_BUSINESS]: '商机转移',
    [BizTypeEnum.CRM_CLUE]: '线索转移',
    [BizTypeEnum.CRM_CONTACT]: '联系人转移',
    [BizTypeEnum.CRM_CONTRACT]: '合同转移',
    [BizTypeEnum.CRM_CUSTOMER]: '客户转移',
  }
  return titleMap[props.bizType] || '转移'
})
const permissionLevelOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.CRM_PERMISSION_LEVEL).filter(item => item.value !== PermissionLevelEnum.OWNER)
})
const formSchema = createFormSchema({
  newOwnerUserId: [{ required: true, message: '新负责人不能为空' }],
  oldOwnerPermissionLevel: [{ required: () => oldOwnerJoinTeam.value, message: '老负责人权限不能为空' }],
})

/** 打开弹窗 */
function open(id: number) {
  formData.value = {
    id,
    newOwnerUserId: undefined as unknown as number,
    oldOwnerPermissionLevel: undefined,
    toBizTypes: [],
  }
  oldOwnerJoinTeam.value = false
  visible.value = true
}

/** 切换老负责人处理方式 */
function handleOwnerChange() {
  if (!oldOwnerJoinTeam.value) {
    formData.value.oldOwnerPermissionLevel = undefined
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
    await transfer({ ...formData.value })
    toast.success(`${title.value}成功`)
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 调用转移接口 */
function transfer(data: TransferReq) {
  switch (props.bizType) {
    case BizTypeEnum.CRM_BUSINESS:
      return transferBusiness(data)
    case BizTypeEnum.CRM_CLUE:
      return transferClue(data)
    case BizTypeEnum.CRM_CONTACT:
      return transferContact(data)
    case BizTypeEnum.CRM_CONTRACT:
      return transferContract(data)
    case BizTypeEnum.CRM_CUSTOMER:
      return transferCustomer(data)
    default:
      toast.show('当前模块暂不支持转移')
      return Promise.reject(new Error('unsupported transfer type'))
  }
}

defineExpose({
  open,
})
</script>
