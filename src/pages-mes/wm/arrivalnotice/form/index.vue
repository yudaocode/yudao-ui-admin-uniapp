<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="通知单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                placeholder="请输入通知单编号"
              />
              <wd-button size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="通知单名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入通知单名称"
            />
          </wd-form-item>
          <wd-form-item title="采购订单" title-width="200rpx" prop="purchaseOrderCode">
            <wd-input
              v-model="formData.purchaseOrderCode"
              clearable
              placeholder="请输入采购订单编号"
            />
          </wd-form-item>
          <VendorFormPicker v-model="formData.vendorId" label="供应商" label-width="200rpx" prop="vendorId" placeholder="请选择供应商" @change="handleVendorChange" />
          <wd-form-item
            title="到货日期"
            title-width="200rpx"
            prop="arrivalDate"
            is-link
            placeholder="请选择到货日期"
            :value="formatDate(formData.arrivalDate)"
            @click="pickerVisible.arrivalDate = true"
          />
          <wd-datetime-picker
            v-model="formData.arrivalDate"
            v-model:visible="pickerVisible.arrivalDate"
            title="请选择到货日期"
            type="date"
          />
          <wd-form-item title="联系人" title-width="200rpx" prop="contactName">
            <wd-input
              v-model="formData.contactName"
              clearable
              placeholder="请输入联系人"
            />
          </wd-form-item>
          <wd-form-item title="联系方式" title-width="200rpx" prop="contactTelephone">
            <wd-input
              v-model="formData.contactTelephone"
              clearable
              placeholder="请输入联系方式"
            />
          </wd-form-item>
          <wd-form-item v-if="props.id" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <ArrivalNoticeLineList v-if="formData.id" :notice-id="formData.id" :readonly="false" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          class="flex-1"
          type="primary"
          :loading="formLoading" @click="handleSubmit"
        >
          保存
        </wd-button>
        <wd-button
          v-if="canSubmit"
          class="flex-1"
          type="warning"
          :loading="submitLoading" @click="handleSubmitNotice"
        >
          提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendor } from '@/api/mes/md/vendor'
import type { WmArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createArrivalNotice, getArrivalNotice, submitArrivalNotice, updateArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmArrivalNoticeStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorFormPicker from '@/pages-mes/md/vendor/components/vendor-form-picker.vue'
import ArrivalNoticeLineList from '../components/arrival-notice-line-list.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const getTitle = computed(() => props.id ? '编辑到货通知' : '新增到货通知')
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmArrivalNotice>({
  code: '',
  name: '',
  purchaseOrderCode: '',
  arrivalDate: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '通知单编号不能为空' }],
  name: [{ required: true, message: '通知单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  arrivalDate: [{ required: true, message: '到货日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const canSubmit = computed(() => (
  props.id
  && formData.value.status === MesWmArrivalNoticeStatusEnum.PREPARE
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/arrivalnotice/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getArrivalNotice(Number(props.id))
}

/** 供应商变更 */
function handleVendorChange(vendor?: MdVendor) {
  if (!vendor) {
    return
  }
  formData.value.contactName = vendor.contact1Name || formData.value.contactName
  formData.value.contactTelephone = vendor.contact1Telephone || vendor.telephone || formData.value.contactTelephone
}

/** 生成通知单编号 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_ARRIVAL_NOTICE_CODE)
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
    if (props.id) {
      await updateArrivalNotice(formData.value)
      toast.success('修改成功')
    } else {
      await createArrivalNotice(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:arrivalnotice:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 提交到货通知单 */
async function handleSubmitNotice() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该到货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateArrivalNotice(formData.value)
    await submitArrivalNotice(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:wm:arrivalnotice:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
