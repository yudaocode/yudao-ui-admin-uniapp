<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="写跟进"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="跟进类型" title-width="200rpx" prop="type" center>
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.CRM_FOLLOW_UP_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="跟进内容" title-width="200rpx" prop="content">
            <wd-textarea v-model="formData.content" placeholder="请输入跟进内容" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="下次联系" title-width="200rpx" prop="nextTime" is-link :value="formatDateTime(formData.nextTime) || ''" placeholder="请选择下次联系时间" @click="nextTimeVisible = true" />
          <wd-datetime-picker v-model="formData.nextTime" v-model:visible="nextTimeVisible" title="请选择下次联系时间" type="datetime" />
          <wd-form-item title="图片" title-width="200rpx">
            <yd-upload-imgs v-model="formData.picUrls" directory="crm/followup" :limit="9" />
          </wd-form-item>
          <wd-form-item title="附件" title-width="200rpx">
            <yd-upload-file v-model="formData.fileUrls" directory="crm/followup" :limit="9" />
          </wd-form-item>
          <template v-if="canSelectRelated">
            <yd-form-picker v-model="formData.contactIds" label="关联联系人" label-width="200rpx" :columns="contactOptions" label-key="name" value-key="id" type="checkbox" filterable placeholder="请选择关联联系人" />
            <yd-form-picker v-model="formData.businessIds" label="关联商机" label-width="200rpx" :columns="businessOptions" label-key="name" value-key="id" type="checkbox" filterable placeholder="请选择关联商机" />
          </template>
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
import type { Business } from '@/api/crm/business'
import type { Contact } from '@/api/crm/contact'
import type { FollowUpRecord } from '@/api/crm/followup'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getBusinessListByCustomer } from '@/api/crm/business'
import { getContactListByCustomer } from '@/api/crm/contact'
import { createFollowUpRecord } from '@/api/crm/followup'
import { BizTypeEnum } from '@/api/crm/permission'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ bizId?: number | any, bizType?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const bizId = computed(() => Number(props.bizId))
const bizType = computed(() => Number(props.bizType))
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const nextTimeVisible = ref(false) // 时间选择器显示状态
const contactOptions = ref<Contact[]>([]) // 关联联系人选项
const businessOptions = ref<Business[]>([]) // 关联商机选项
const formData = ref<FollowUpRecord>({
  bizId: bizId.value,
  bizType: bizType.value,
  type: undefined,
  content: '',
  nextTime: undefined,
  picUrls: [],
  fileUrls: [],
  contactIds: [],
  businessIds: [],
}) // 表单数据
const formSchema = createFormSchema({
  type: [{ required: true, message: '跟进类型不能为空' }],
  content: [{ required: true, message: '跟进内容不能为空' }],
  nextTime: [{ required: true, message: '下次联系时间不能为空' }],
})
const canSelectRelated = computed(() => bizType.value === BizTypeEnum.CRM_CUSTOMER)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await createFollowUpRecord({
      ...formData.value,
      bizId: bizId.value,
      bizType: bizType.value,
      businessIds: formData.value.businessIds || [],
      contactIds: formData.value.contactIds || [],
      fileUrls: formData.value.fileUrls || [],
      picUrls: formData.value.picUrls || [],
    })
    toast.success('保存成功')
    uni.$emit('crm:followup:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 加载关联数据（仅客户支持关联联系人/商机） */
async function loadRelatedOptions() {
  if (!canSelectRelated.value || !bizId.value) {
    return
  }
  const [contactList, businessList] = await Promise.all([
    getContactListByCustomer(bizId.value),
    getBusinessListByCustomer(bizId.value),
  ])
  contactOptions.value = contactList
  businessOptions.value = businessList
}

/** 初始化 */
onMounted(async () => {
  await loadRelatedOptions()
})
</script>
