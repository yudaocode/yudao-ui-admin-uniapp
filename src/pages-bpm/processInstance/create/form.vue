<template>
  <view class="yd-page-container pb-[120rpx]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="processName"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单加载状态 -->
    <view v-if="loading" class="py-100rpx text-center">
      <wd-loading size="40rpx" />
      <view class="mt-24rpx text-26rpx text-[#999]">
        加载表单中...
      </view>
    </view>

    <template v-else>
      <!-- 流程表单 -->
      <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
        <FormCreate
          v-model="detailForm.value"
          v-model:api="fApi"
          :option="detailForm.option"
          :rule="detailForm.rule"
          style=""
          @change="handleFormChange"
        />
      </view>

      <!-- 流程预览 -->
      <view class="mx-24rpx mt-24rpx rounded-16rpx bg-white">
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-bold">流程预览</text>
            <wd-loading v-if="processTimeLineLoading" size="32rpx" />
          </view>

          <ProcessInstanceTimeline
            v-if="activityNodes.length > 0"
            :activity-nodes="activityNodes"
            :show-status-icon="false"
            @select-user-confirm="selectUserConfirm"
          />

          <!-- 无流程预览数据 -->
          <view v-else-if="!processTimeLineLoading" class="py-40rpx text-center">
            <text class="text-24rpx text-[#999]">暂无流程预览数据</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 底部提交按钮 -->
    <view v-if="!loading" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" class="flex-1" :loading="submitting" @click="handleSubmit">
          提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ApprovalNodeInfo } from '@/api/bpm/processInstance'
import type { FormCreateApi } from '@/pages-bpm/components/form-create/packages/wot-ui/types'
import type { FormCreatePreview } from '@/pages-bpm/utils'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { nextTick, ref, watch } from 'vue'
import { getProcessDefinition } from '@/api/bpm/definition'
import { createProcessInstance, getApprovalDetail, getProcessInstance } from '@/api/bpm/processInstance'
import FormCreate from '@/pages-bpm/components/form-create/packages/wot-ui/src/index.vue'
import ProcessInstanceTimeline from '@/pages-bpm/processInstance/detail/components/time-line.vue'
import { applySubFormsPermission, decodeFields, filterFormVariablesByFields, hasSubForm, isSubFieldPermissionField, setConfAndFields2 } from '@/pages-bpm/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BpmCandidateStrategyEnum, BpmNodeIdEnum } from '@/utils/constants'
import { setTabParams } from '@/utils/url'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()

const loading = ref(true) // 页面加载状态
const submitting = ref(false) // 表单提交状态
const processTimeLineLoading = ref(false) // 流程预览加载状态
const initialized = ref(false) // 表单初始化完成后才响应字段变更
const processName = ref('流程表单') // 流程名称
const processDefinitionId = ref('') // 流程定义编号
const processInstanceId = ref('') // 重新发起时的流程实例编号
const fApi = ref<FormCreateApi>() // 流程表单 API
const detailForm = ref<FormCreatePreview>({
  option: {},
  rule: [],
  value: {},
}) // 流程表单配置和数据
const activityNodes = ref<ApprovalNodeInfo[]>([]) // 流程预览节点
const startUserSelectTasks = ref<ApprovalNodeInfo[]>([]) // 发起人需要选择审批人的节点
const startUserSelectAssignees = ref<Record<string, number[]>>({}) // 发起人选择的审批人
const tempStartUserSelectAssignees = ref<Record<string, number[]>>({}) // 刷新预览前临时保留的审批人
let previewTimer: ReturnType<typeof setTimeout> | undefined // 流程预览刷新防抖定时器
let previewPromise: Promise<void> | undefined // 进行中的流程预览重算
let formFields: string[] | undefined // 流程表单字段，子表单的子字段权限变化时重新解析
let subFormsPermission: string | undefined // 已写入表单规则的字段权限（子表单的子字段权限）

/** 返回流程发起页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/processInstance/create/index')
}

/** 同步流程表单数据 */
function handleFormChange(data: Record<string, any>) {
  detailForm.value.value = data
}

/** 加载流程预览和发起人自选审批节点 */
async function getProcessApprovalDetail() {
  if (!processDefinitionId.value) {
    return
  }

  processTimeLineLoading.value = true
  try {
    // 根据当前表单变量查询流程预览，后端会同步返回节点审批人和字段权限
    const data = await getApprovalDetail({
      processDefinitionId: processDefinitionId.value,
      activityId: BpmNodeIdEnum.START_USER_NODE_ID,
      processVariablesStr: JSON.stringify(detailForm.value.value || {}),
    })
    if (!data) {
      toast.show('查询不到审批详情信息')
      return
    }

    activityNodes.value = data.activityNodes || []
    // 只保留“发起人自选审批人”的节点，提交前必须校验这些节点已选择审批人
    startUserSelectTasks.value = (data.activityNodes || []).filter(
      node => BpmCandidateStrategyEnum.START_USER_SELECT === node.candidateStrategy,
    )

    // 刷新流程预览后恢复已选择的发起人自选审批人
    if (startUserSelectTasks.value.length > 0) {
      for (const node of startUserSelectTasks.value) {
        const tempAssignees = tempStartUserSelectAssignees.value[node.id]
        startUserSelectAssignees.value[node.id] = tempAssignees?.length ? tempAssignees : []
      }
    }

    // 后端会根据表单变量返回字段权限，移动端同步给 form-create
    if (data.formFieldsPermission) {
      setSubFormsPermission(data.formFieldsPermission)
      await nextTick()
      Object.entries(data.formFieldsPermission)
        .filter(([field]) => !isSubFieldPermissionField(field)) // 子表单的子字段权限，已写入规则
        .forEach(([field, permission]) => {
          fApi.value?.setFieldPermission(field, permission)
        })
    }
  } finally {
    processTimeLineLoading.value = false
  }
}

/** 设置子表单的子字段权限：需要写入规则后重新渲染表单，所以仅在权限变化时设置 */
function setSubFormsPermission(formFieldsPermission: Record<string, string>) {
  const permission = JSON.stringify(formFieldsPermission)
  if (permission === subFormsPermission || !hasSubForm(detailForm.value.rule)) {
    return
  }
  subFormsPermission = permission
  const rule = decodeFields(formFields)
  applySubFormsPermission(rule, formFieldsPermission)
  detailForm.value.rule = rule
}

/** 确认发起人自选审批人 */
function selectUserConfirm(activityId: string, userList: any[]) {
  startUserSelectAssignees.value[activityId] = userList?.map(item => item.id) || []
}

/** 刷新流程预览 */
function refreshPreview() {
  tempStartUserSelectAssignees.value = { ...startUserSelectAssignees.value }
  startUserSelectAssignees.value = {}
  previewPromise = getProcessApprovalDetail()
  return previewPromise
}

/** 提交前等待流程预览，失败返回 false */
async function flushPreview(): Promise<boolean> {
  if (previewTimer) {
    clearTimeout(previewTimer)
    previewTimer = undefined
    refreshPreview()
  } else if (!previewPromise) {
    refreshPreview()
  }
  try {
    await previewPromise
    return true
  } catch {
    previewPromise = undefined
    return false
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (!fApi.value || submitting.value) {
    return
  }
  // 提交前等待流程预览，再校验
  const previewOk = await flushPreview()
  if (!previewOk) {
    toast.show('流程预览加载失败，请重试')
    return
  }

  const { valid } = await fApi.value.validate()
  if (!valid) {
    return
  }

  // 校验所有发起人自选审批节点都已选择审批人
  if (startUserSelectTasks.value.length > 0) {
    for (const userTask of startUserSelectTasks.value) {
      const assignees = startUserSelectAssignees.value[userTask.id]
      if (!Array.isArray(assignees) || assignees.length === 0) {
        toast.show(`请选择${userTask.name}的审批人`)
        return
      }
    }
  }

  submitting.value = true
  try {
    // 只提交流程表单字段，避免把审批人等辅助变量混入表单变量
    await createProcessInstance({
      processDefinitionId: processDefinitionId.value,
      variables: filterFormVariablesByFields(detailForm.value.rule, fApi.value.formData()),
      startUserSelectAssignees: startUserSelectAssignees.value,
    })
    toast.success('发起流程成功')
    // 通知工作台「我的流程」刷新，并跳转到对应 tab
    uni.$emit('bpm:task:reload')
    delay(() => {
      setTabParams({ tab: 'my' })
      uni.switchTab({ url: '/pages/bpm/index' })
    })
  } finally {
    submitting.value = false
  }
}

/** 表单变化后防抖刷新流程预览 */
watch(
  () => detailForm.value.value,
  () => {
    if (!initialized.value) {
      return
    }
    if (previewTimer) {
      clearTimeout(previewTimer)
    }
    previewTimer = setTimeout(() => {
      previewTimer = undefined
      refreshPreview()
    }, 300)
  },
  { deep: true },
)

/** 初始化 */
onLoad(async (options) => {
  const id = options?.processDefinitionId
  const instanceId = options?.processInstanceId
  if (!id) {
    toast.show('参数错误')
    loading.value = false
    return
  }

  processDefinitionId.value = id
  processInstanceId.value = instanceId || ''
  try {
    // 先加载流程定义，拿到表单配置、表单字段和页面标题
    const definition = await getProcessDefinition(id)
    processName.value = definition.name || '流程表单'
    if (!definition.formFields?.length) {
      toast.show('该流程暂无表单字段')
      return
    }

    const formVariables = processInstanceId.value
      ? await getRestartFormVariables(definition.formFields)
      : {}
    setConfAndFields2(detailForm, definition.formConf, definition.formFields, formVariables)
    formFields = definition.formFields
    detailForm.value.option = {
      ...detailForm.value.option,
      // 发起页使用页面底部按钮提交，隐藏 form-create 内置按钮
      submitBtn: false,
      resetBtn: false,
    }

    // 等 form-create 渲染完成后再查询流程预览和字段权限
    await nextTick()
    try {
      previewPromise = getProcessApprovalDetail()
      await previewPromise
    } finally {
      // 表单就绪即可响应字段变更，预览失败也置位
      initialized.value = true
    }
  } finally {
    loading.value = false
  }
})

/** 获取重新发起时可回填的流程表单变量 */
async function getRestartFormVariables(formFields?: string[]) {
  const processInstance = await getProcessInstance(processInstanceId.value)
  if (!processInstance) {
    toast.show('重新发起流程失败，原因：流程实例不存在')
    return {}
  }
  return filterFormVariablesByFields(formFields, processInstance.formVariables || {})
}
</script>
