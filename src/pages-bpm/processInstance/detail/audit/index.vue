<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="isApprove ? '审批同意' : '审批拒绝'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 审批表单 -->
    <view class="p-24rpx">
      <!-- 节点表单 -->
      <view v-if="isApprove && approveForm.rule.length > 0" class="mb-24rpx overflow-hidden rounded-16rpx bg-white">
        <FormCreate
          v-model="approveForm.value"
          v-model:api="approveFormApi"
          :option="approveForm.option"
          :rule="approveForm.rule"
          @change="handleApproveFormChange"
        />
      </view>

      <!-- 审批操作表单 -->
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 下一个节点的审批人 -->
          <view v-if="isApprove && nextAssigneesActivityNode.length > 0" class="p-24rpx">
            <view class="mb-16rpx flex items-center">
              <text class="mr-8rpx text-[#f56c6c]">*</text>
              <text class="text-28rpx text-[#333]">下一个节点的审批人</text>
            </view>
            <ProcessInstanceTimeline
              :activity-nodes="nextAssigneesActivityNode"
              :show-status-icon="false"
              :enable-approve-user-select="true"
              @select-user-confirm="selectNextAssigneesConfirm"
            />
          </view>
          <!-- 签名 -->
          <view v-if="isApprove && taskInfo?.signEnable" class="border-b border-[#eee] p-24rpx">
            <view class="mb-16rpx flex items-center">
              <text class="mr-8rpx text-[#f56c6c]">*</text>
              <text class="text-28rpx text-[#333]">签名</text>
            </view>
            <view class="flex items-center gap-16rpx">
              <wd-button type="primary" size="small" @click="openSignatureModal">
                {{ formData.signPicUrl ? '重新签名' : '点击签名' }}
              </wd-button>
              <wd-img
                v-if="formData.signPicUrl"
                :src="formData.signPicUrl"
                width="192rpx"
                height="80rpx"
                mode="aspectFit"
                radius="8rpx"
                enable-preview
              />
            </view>
          </view>
          <!-- 审批意见 -->
          <wd-form-item prop="reason" title="审批意见：" title-width="180rpx">
            <wd-textarea
              v-model="formData.reason"
              placeholder="请输入审批意见"
              :maxlength="500"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-cell title="附件/图片" title-width="180rpx" />
          <view class="px-24rpx pb-24rpx">
            <wd-upload
              v-model:file-list="attachmentFiles"
              :accept="attachmentAccept"
              :extension="APPROVAL_ATTACHMENT_EXTENSIONS"
              :max-size="APPROVAL_ATTACHMENT_MAX_SIZE"
              multiple
              :limit="10"
              :upload-method="attachmentUploadMethod"
            />
          </view>
        </wd-cell-group>
      </wd-form>

      <!-- 提交按钮 -->
      <view class="mt-48rpx">
        <wd-button
          :type="isApprove ? 'primary' : 'danger'"
          block
          :loading="formLoading"
          :disabled="formLoading"
          @click="handleSubmit"
        >
          {{ isApprove ? '同意' : '拒绝' }}
        </wd-button>
      </view>
    </view>

    <!-- 签名弹窗 -->
    <wd-popup v-model="showSignatureModal" position="bottom" custom-style="height: 60vh;">
      <view class="h-full flex flex-col">
        <view class="flex items-center justify-between border-b border-[#eee] p-24rpx">
          <text class="text-32rpx text-[#333] font-bold">手写签名</text>
          <wd-icon name="close" size="40rpx" @click="showSignatureModal = false" />
        </view>
        <view class="flex-1 p-24rpx">
          <wd-signature
            :height="300"
            :export-scale="2"
            background-color="#ffffff"
            @confirm="handleSignatureConfirm"
            @clear="handleSignatureClear"
          />
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { UploadFileItem, UploadMethod } from '@wot-ui/ui/components/wd-upload/types'
import type { ApprovalNodeInfo } from '@/api/bpm/processInstance'
import type { Task } from '@/api/bpm/task'
import type { FormCreateApi } from '@/pages-bpm/components/form-create/packages/wot-ui/types'
import type { FormCreatePreview } from '@/pages-bpm/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { getApprovalDetail, getNextApproveNodes } from '@/api/bpm/processInstance'
import { approveTask, rejectTask } from '@/api/bpm/task'
import { uploadFile as uploadFileToServer } from '@/api/infra/file'
import FormCreate from '@/pages-bpm/components/form-create/packages/wot-ui/src/index.vue'
import ProcessInstanceTimeline from '@/pages-bpm/processInstance/detail/components/time-line.vue'
import { setConfAndFields2 } from '@/pages-bpm/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BpmCandidateStrategyEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { isEmptyValue } from '@/utils/is'

const props = defineProps<{
  processInstanceId?: string
  taskId?: string
  pass?: string
  variablesCacheKey?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
const taskId = computed(() => props.taskId || '')
const processInstanceId = computed(() => props.processInstanceId)
const isApprove = computed(() => props.pass !== 'false') // true: 同意, false: 拒绝
const toast = useToast()
const formLoading = ref(false) // 审批提交状态
const taskInfo = ref<Task | null>(null) // 任务信息
const attachmentFiles = ref<UploadFileItem[]>([]) // 审批附件
const APPROVAL_ATTACHMENT_EXTENSIONS = [
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
]
const APPROVAL_ATTACHMENT_MAX_SIZE = 5 * 1024 * 1024
const attachmentAccept = computed(() => {
  // #ifdef H5 || MP-WEIXIN
  return 'all'
  // #endif
  // #ifndef H5 || MP-WEIXIN
  return 'image'
  // #endif
})

const nextAssigneesActivityNode = ref<ApprovalNodeInfo[]>([]) // 下一个节点审批人列表
const approveUserSelectTasks = ref<ApprovalNodeInfo[]>([]) // 需要选择审批人的节点列表
const approveUserSelectAssignees = ref<Record<string, number[]>>({}) // 审批人选择的审批人数据
const normalFormVariables = ref<Record<string, any>>({}) // 详情页流程表单暂存的可写变量
const approveFormApi = ref<FormCreateApi>() // 节点表单 API
const approveForm = ref<FormCreatePreview>({
  option: {},
  rule: [],
  value: {},
}) // 节点表单配置和数据
let nextAssigneeTimer: ReturnType<typeof setTimeout> | undefined // 下一节点审批人刷新防抖定时器
let nextAssigneePromise: Promise<void> | undefined // 进行中的下一节点审批人重算

const showSignatureModal = ref(false) // 签名相关

const formData = reactive({
  reason: '',
  signPicUrl: '', // 签名图片 URL
}) // 表单数据
const formSchema = createFormSchema({
  reason: [{ required: () => !!taskInfo.value?.reasonRequire, message: '审批意见不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-bpm/processInstance/detail/index?id=${processInstanceId.value}&taskId=${taskId.value}`)
}

/** 加载任务信息 */
async function loadTaskInfo() {
  const data = await getApprovalDetail({
    processInstanceId: processInstanceId.value,
    taskId: taskId.value,
  })
  taskInfo.value = data?.todoTask || null
  normalFormVariables.value = getCachedNormalFormVariables()

  if (isApprove.value && taskInfo.value?.formConf && taskInfo.value?.formFields?.length) {
    setConfAndFields2(
      approveForm,
      taskInfo.value.formConf,
      taskInfo.value.formFields,
      taskInfo.value.formVariables || {},
    )
    approveForm.value.option = {
      ...approveForm.value.option,
      // 审批页使用页面底部按钮提交，隐藏 form-create 内置按钮
      submitBtn: false,
      resetBtn: false,
    }
  } else {
    approveForm.value = { option: {}, rule: [], value: {} }
  }
}

/** 加载下一个节点审批人 */
async function loadNextApproveNodes() {
  if (!isApprove.value) {
    return
  }
  const params = {
    processInstanceId: processInstanceId.value,
    taskId: taskId.value,
    processVariablesStr: JSON.stringify(getApprovalVariables()),
  }
  const data = await getNextApproveNodes(params)
  nextAssigneesActivityNode.value = []
  approveUserSelectTasks.value = []
  approveUserSelectAssignees.value = {}
  if (data && data.length > 0) {
    nextAssigneesActivityNode.value = data
    // 获取需要自选审批人的节点（已返回 candidateUsers，则无需自选）
    approveUserSelectTasks.value = data.filter(
      (node: ApprovalNodeInfo) =>
        // 审批人自选
        (BpmCandidateStrategyEnum.APPROVE_USER_SELECT === node.candidateStrategy
          && isEmptyValue(node.candidateUsers))
        // 发起人自选（仅当节点尚无任务时才要求选人）
        || (BpmCandidateStrategyEnum.START_USER_SELECT === node.candidateStrategy
          && isEmptyValue(node.tasks)
          && isEmptyValue(node.candidateUsers)),
    ) || []
  }
}

/** 选择下一个节点审批人确认 */
function selectNextAssigneesConfirm(activityId: string, userList: any[]) {
  approveUserSelectAssignees.value[activityId] = userList.map(user => user.id)
}

/** 同步节点表单数据 */
function handleApproveFormChange(data: Record<string, any>) {
  approveForm.value.value = data
}

/** 获取当前任务的流程表单变量缓存键 */
function getNormalFormVariablesCacheKey() {
  if (!processInstanceId.value || !taskId.value) {
    return undefined
  }
  const cacheKey = `bpm-normal-form-variables:${processInstanceId.value}:${taskId.value}`
  return props.variablesCacheKey === cacheKey ? cacheKey : undefined
}

/** 获取详情页暂存的流程表单变量 */
function getCachedNormalFormVariables() {
  const cacheKey = getNormalFormVariablesCacheKey()
  if (!cacheKey) {
    return {}
  }
  return uni.getStorageSync(cacheKey) || {}
}

/** 清理详情页暂存的流程表单变量 */
function clearCachedNormalFormVariables() {
  const cacheKey = getNormalFormVariablesCacheKey()
  if (cacheKey) {
    uni.removeStorageSync(cacheKey)
  }
}

/** 合并流程表单变量和节点表单变量 */
function getApprovalVariables() {
  return {
    ...normalFormVariables.value,
    ...(approveFormApi.value?.formData() || approveForm.value.value || {}),
  }
}

/** 清理下一节点审批人刷新定时器 */
function clearNextAssigneeTimer() {
  if (nextAssigneeTimer) {
    clearTimeout(nextAssigneeTimer)
    nextAssigneeTimer = undefined
  }
}

/** 提交前等待下一节点审批人，失败返回 false */
async function flushNextApproveNodes(): Promise<boolean> {
  if (nextAssigneeTimer) {
    clearNextAssigneeTimer()
    nextAssigneePromise = loadNextApproveNodes()
  } else if (!nextAssigneePromise) {
    nextAssigneePromise = loadNextApproveNodes()
  }
  try {
    await nextAssigneePromise
    return true
  } catch {
    nextAssigneePromise = undefined
    return false
  }
}

/** 打开签名弹窗 */
function openSignatureModal() {
  showSignatureModal.value = true
}

/** 签名确认 */
async function handleSignatureConfirm(result: { tempFilePath: string, base64: string }) {
  toast.loading('上传中...')
  try {
    // 上传签名图片
    formData.signPicUrl = await uploadSignatureFile(result.tempFilePath)
    showSignatureModal.value = false
    toast.success('签名成功')
  } catch (err) {
    console.error('上传失败：', err)
    toast.show('上传失败')
  }
}

/** 上传签名文件 */
async function uploadSignatureFile(tempFilePath: string): Promise<string> {
  try {
    return await uploadFileToServer(tempFilePath)
  } catch (err) {
    console.error('上传失败:', err)
    throw err
  }
}

/** 签名清除 */
function handleSignatureClear() {
  formData.signPicUrl = ''
}

/** 附件上传 */
const attachmentUploadMethod: UploadMethod = (file, formData, options) => {
  const filePath = file.url || (file as any).path
  if (!filePath) {
    options.onError({ errMsg: '上传文件路径为空' } as UniApp.GeneralCallbackResult, file, formData)
    return
  }

  return uploadFileToServer(filePath)
    .then((url) => {
      options.onSuccess({
        data: JSON.stringify({ code: 0, data: url }),
        errMsg: 'uploadFile:ok',
        statusCode: 200,
      } as UniApp.UploadFileSuccessCallbackResult, file, formData)
    })
    .catch((error) => {
      const message = error?.message || error?.errMsg || '上传失败'
      toast.show(message)
      options.onError({ errMsg: message } as UniApp.GeneralCallbackResult, file, formData)
    })
}

/** 获取已上传附件 URL */
function getUploadedUrl(item: UploadFileItem) {
  const response = parseUploadResponse(item.response)
  if (typeof response === 'string') {
    return response
  }
  if (response?.code !== undefined) {
    if (response.code === 0) {
      return extractUploadedUrl(response.data) || response.url
    }
    toast.show(response.msg || response.message || '上传失败')
    return undefined
  }
  return extractUploadedUrl(response?.data) || response?.url || item.url
}

/** 获取提交附件列表 */
function getSubmitAttachments() {
  return attachmentFiles.value
    .filter(file => file.status === 'success')
    .map(file => getUploadedUrl(file))
    .filter(Boolean) as string[]
}

/** 校验附件上传状态 */
function validateAttachmentFiles() {
  const hasUploadingFile = attachmentFiles.value.some(file =>
    file.status === 'pending' || file.status === 'loading',
  )
  if (hasUploadingFile) {
    toast.show('附件正在上传中，请稍后提交')
    return false
  }
  const hasFailedFile = attachmentFiles.value.some(file => file.status === 'fail')
  if (hasFailedFile) {
    toast.show('存在上传失败的附件，请删除或重新上传')
    return false
  }
  return true
}

function extractUploadedUrl(data: any) {
  if (typeof data === 'string') {
    return data
  }
  if (data && typeof data === 'object') {
    return data.url || data.fileUrl || data.path
  }
}

function parseUploadResponse(response?: string | Record<string, any>) {
  if (!response) {
    return undefined
  }
  if (typeof response !== 'string') {
    return response
  }
  try {
    return JSON.parse(response)
  } catch {
    return response
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (formLoading.value) {
    return
  }

  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  // 验证签名
  if (isApprove.value && taskInfo.value?.signEnable && !formData.signPicUrl) {
    toast.show('请先进行签名')
    return
  }
  if (isApprove.value && approveForm.value.rule.length > 0) {
    const { valid } = await (approveFormApi.value?.validate() || Promise.resolve({ valid: true, errors: [] }))
    if (!valid) {
      return
    }
  }

  // 提交前等待下一节点审批人，失败则阻断
  if (isApprove.value) {
    const nodesOk = await flushNextApproveNodes()
    if (!nodesOk) {
      toast.show('下一节点审批人加载失败，请重试')
      return
    }
  }

  // 验证审批人选择
  if (isApprove.value && approveUserSelectTasks.value.length > 0) {
    for (const task of approveUserSelectTasks.value) {
      if (!approveUserSelectAssignees.value[task.id] || approveUserSelectAssignees.value[task.id].length === 0) {
        toast.show(`请选择「${task.name}」的审批人`)
        return
      }
    }
  }
  if (!validateAttachmentFiles()) {
    return
  }

  formLoading.value = true
  try {
    const attachments = getSubmitAttachments()
    if (isApprove.value) {
      const variables = getApprovalVariables()
      // 审批通过
      await approveTask({
        id: taskId.value as string,
        reason: formData.reason,
        attachments,
        signPicUrl: formData.signPicUrl || undefined,
        variables,
        nextAssignees: Object.keys(approveUserSelectAssignees.value).length > 0
          ? approveUserSelectAssignees.value
          : undefined,
      })
    } else {
      // 审批拒绝
      await rejectTask({
        id: taskId.value as string,
        reason: formData.reason,
        attachments,
      })
    }
    clearCachedNormalFormVariables()
    toast.success('审批成功')
    uni.$emit('bpm:processInstance:reload')
    uni.$emit('bpm:task:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 审批表单变化后防抖刷新下一节点审批人 */
watch(
  () => approveForm.value.value,
  () => {
    if (!isApprove.value || approveForm.value.rule.length === 0) {
      return
    }
    clearNextAssigneeTimer()
    nextAssigneeTimer = setTimeout(() => {
      nextAssigneeTimer = undefined
      nextAssigneePromise = loadNextApproveNodes()
    }, 300)
  },
  { deep: true },
)

/** 页面卸载时清理定时器 */
onBeforeUnmount(() => {
  clearNextAssigneeTimer()
})

/** 初始化 */
onMounted(async () => {
  // 参数校验
  if (!props.taskId || !props.processInstanceId) {
    toast.show('参数错误')
    return
  }
  try {
    toast.loading('加载中...')
    // 加载任务信息和下一个节点审批人
    await loadTaskInfo()
    nextAssigneePromise = loadNextApproveNodes()
    await nextAssigneePromise
  } finally {
    toast.close()
  }
})
</script>
