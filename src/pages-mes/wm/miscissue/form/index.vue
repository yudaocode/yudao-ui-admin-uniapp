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
          <wd-form-item title="出库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入出库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="出库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入出库单名称" />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="业务类型" label-width="200rpx" prop="type" :disabled="isHeaderReadonly" :dict-type="DICT_TYPE.MES_WM_MISC_ISSUE_TYPE" placeholder="请选择业务类型" />
          <wd-form-item
            title="出库日期"
            title-width="200rpx"
            prop="issueDate"
            :is-link="!isHeaderReadonly"
            placeholder="请选择出库日期"
            :value="formatDateTime(formData.issueDate)"
            @click="openIssueDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.issueDate"
            v-model:visible="pickerVisible.issueDate"
            title="请选择出库日期"
            type="date"
          />
          <wd-form-item title="来源单据类型" title-width="200rpx" prop="sourceDocType">
            <wd-input v-model="formData.sourceDocType" clearable :disabled="isHeaderReadonly" placeholder="请输入来源单据类型" />
          </wd-form-item>
          <wd-form-item title="来源单据编号" title-width="200rpx" prop="sourceDocCode">
            <wd-input v-model="formData.sourceDocCode" clearable :disabled="isHeaderReadonly" placeholder="请输入来源单据编号" />
          </wd-form-item>
          <wd-form-item v-if="formData.id" title="单据状态" title-width="200rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_MISC_ISSUE_STATUS" :value="formData.status" />
            <text v-else>-</text>
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

      <MiscIssueLineList v-if="formData.id" :issue-id="formData.id" :readonly="!isEditable" />
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
          :loading="submitLoading" @click="handleSubmitIssue"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading" @click="handleFinishIssue"
        >
          执行出库
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmMiscIssue } from '@/api/mes/wm/miscissue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  createMiscIssue,
  finishMiscIssue,
  getMiscIssue,
  submitMiscIssue,
  updateMiscIssue,
} from '@/api/mes/wm/miscissue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmMiscIssueStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MiscIssueLineList from '../components/misc-issue-line-list.vue'

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
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const getTitle = computed(() => {
  if (routeMode.value === 'finish') {
    return '执行杂项出库'
  }
  return props.id ? '编辑杂项出库' : '新增杂项出库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const finishLoading = ref(false) // 执行出库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmMiscIssue>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '出库单编号不能为空' }],
  name: [{ required: true, message: '出库单名称不能为空' }],
  type: [{ required: true, message: '业务类型不能为空' }],
  issueDate: [{ required: true, message: '出库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const isFinish = computed(() => routeMode.value === 'finish' && formData.value.status === MesWmMiscIssueStatusEnum.APPROVED)
const isEditable = computed(() => (
  ((!props.id && !formData.value.id) || formData.value.status === MesWmMiscIssueStatusEnum.PREPARE)
  && (!routeMode.value || routeMode.value === 'update')
))
const isHeaderReadonly = computed(() => Boolean(formData.value.id || props.id) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && formData.value.id
  && formData.value.status === MesWmMiscIssueStatusEnum.PREPARE
))

/** 默认表单数据 */
function getDefaultFormData(): WmMiscIssue {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/miscissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMiscIssue(Number(props.id))
}

/** 打开出库日期选择 */
function openIssueDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.issueDate = true
}

/** 生成出库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_MISC_ISSUE_CODE)
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
    if (formData.value.id) {
      await updateMiscIssue(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createMiscIssue(formData.value)
      toast.success('新增成功')
      formData.value.id = id
      formData.value.status = MesWmMiscIssueStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:miscissue:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交杂项出库单 */
async function handleSubmitIssue() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该杂项出库单？提交前请确认已维护出库物料，提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateMiscIssue(formData.value)
    await submitMiscIssue(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:wm:miscissue:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行出库 */
async function handleFinishIssue() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行出库？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishMiscIssue(formData.value.id)
    toast.success('出库成功')
    uni.$emit('mes:wm:miscissue:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
