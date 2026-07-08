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
                :disabled="isHeaderReadonly"
                placeholder="请输入通知单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="通知单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入通知单名称" />
          </wd-form-item>
          <wd-form-item title="销售订单编号" title-width="200rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单编号" />
          </wd-form-item>
          <ClientFormPicker
            v-model="formData.clientId"
            label="客户"
            label-width="200rpx"
            prop="clientId"
            placeholder="请选择客户"
            :disabled="isHeaderReadonly"
            @change="handleClientChange"
          />
          <wd-form-item
            title="发货日期"
            title-width="200rpx"
            prop="salesDate"
            is-link
            placeholder="请选择发货日期"
            :value="formatDateTime(formData.salesDate)"
            @click="openSalesDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.salesDate"
            v-model:visible="pickerVisible.salesDate"
            title="请选择发货日期"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_SALES_NOTICE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="收货人" title-width="200rpx" prop="recipientName">
            <wd-input v-model="formData.recipientName" clearable :disabled="isHeaderReadonly" placeholder="请输入收货人" />
          </wd-form-item>
          <wd-form-item title="联系方式" title-width="200rpx" prop="recipientTelephone">
            <wd-input v-model="formData.recipientTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系方式" />
          </wd-form-item>
          <wd-form-item title="收货地址" title-width="200rpx" prop="recipientAddress">
            <wd-input v-model="formData.recipientAddress" clearable :disabled="isHeaderReadonly" placeholder="请输入收货地址" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <SalesNoticeLineList v-if="currentId" :notice-id="currentId" :readonly="!isEditable" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="isEditable"
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
          :loading="submitLoading" @click="handleSubmitSalesNotice"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          @click="handleFinishSalesNotice"
        >
          执行出库
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClient } from '@/api/mes/md/client'
import type { WmSalesNotice } from '@/api/mes/wm/salesnotice'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createSalesNotice, getSalesNotice, submitSalesNotice, updateSalesNotice } from '@/api/mes/wm/salesnotice'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmSalesNoticeStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ClientFormPicker from '../../../md/client/components/client-form-picker.vue'
import SalesNoticeLineList from '../components/sales-notice-line-list.vue'

const props = defineProps<{
  id?: number | string
  mode?: 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'finish') {
    return '执行出库'
  }
  return currentId.value ? '编辑发货通知' : '新增发货通知'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmSalesNotice>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '通知单编号不能为空' }],
  name: [{ required: true, message: '通知单名称不能为空' }],
  clientId: [{ required: true, message: '客户不能为空' }],
  salesDate: [{ required: true, message: '发货日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmSalesNoticeStatusEnum.PREPARE
})
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmSalesNoticeStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isFinish.value || (Boolean(currentId.value) && !isEditable.value))
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmSalesNoticeStatusEnum.PREPARE
))
/** 默认表单数据 */
function getDefaultFormData(): WmSalesNotice {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/salesnotice/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getSalesNotice(currentId.value)
}

/** 打开发货日期选择 */
function openSalesDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.salesDate = true
}

/** 客户变更 */
function handleClientChange(client?: MdClient) {
  formData.value.clientId = client?.id
  formData.value.clientCode = client?.code
  formData.value.clientName = client?.name
}

/** 生成通知单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_SALES_NOTICE_CODE)
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
    if (currentId.value) {
      await updateSalesNotice(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createSalesNotice(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmSalesNoticeStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:salesnotice:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交发货通知单 */
async function handleSubmitSalesNotice() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该发货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateSalesNotice(formData.value)
    await submitSalesNotice(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:salesnotice:reload')
    await getDetail()
  } finally {
    submitLoading.value = false
  }
}

/** 执行出库 */
function handleFinishSalesNotice() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?noticeId=${currentId.value}` })
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
  await getDetail()
})
</script>
