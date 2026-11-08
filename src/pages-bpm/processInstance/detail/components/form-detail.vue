<!-- 表单详情：流程表单/业务表单 -->
<template>
  <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
    <!-- 标题 -->
    <view class="px-24rpx pt-24rpx text-28rpx text-[#333] font-bold">
      审批详情
    </view>
    <!-- 表单内容：业务表单 -->
    <template v-if="processDefinition?.formType === BpmModelFormType.CUSTOM">
      <!--
        同分包业务表单：直接内嵌组件。
        ⚠️ 不变量：当前 pages-bpm 内"可内嵌的业务详情"只有 OA 请假，故 isSamePackageForm 成立 == 请假表单。
        若以后往 PC_TO_MOBILE_PATH_MAP 新增其它 pages-bpm 的 view 表单，必须在此按具体路径区分组件，
        否则会被误判为同分包而错误渲染成 LeaveDetail（uniapp 小程序不支持动态组件，只能静态 import + 显式分支）。
      -->
      <LeaveDetail
        v-if="isSamePackageForm"
        :id="processInstance?.businessKey"
        embedded
      />
      <!-- 其它业务表单（如 CRM 合同 / 回款）：跨分包无法内嵌组件，改为跳转到对应详情页 -->
      <view
        v-else-if="businessDetailPath"
        class="m-24rpx flex items-center rounded-12rpx bg-[#f7f8fa] p-24rpx active:opacity-60"
        @click="openBusinessDetail"
      >
        <view class="h-72rpx w-72rpx flex shrink-0 items-center justify-center rounded-full bg-[#e6f4ff]">
          <wd-icon name="eye" size="40rpx" color="#1890ff" />
        </view>
        <view class="ml-20rpx flex-1">
          <view class="text-28rpx text-[#333] font-medium">
            查看业务表单详情
          </view>
          <view class="mt-6rpx text-24rpx text-[#999]">
            点击跳转查看完整业务数据
          </view>
        </view>
        <wd-icon name="arrow-right" size="32rpx" color="#c0c4cc" />
      </view>
      <!-- 未配置的业务表单 -->
      <view v-else class="px-24rpx py-32rpx text-26rpx text-[#999]">
        暂不支持该业务表单，请参考 LeaveDetail 配置
      </view>
    </template>
    <!-- 表单内容：流程表单 -->
    <template v-else-if="processDefinition?.formType === BpmModelFormType.NORMAL">
      <FormCreate
        v-if="normalForm.rule.length > 0"
        v-model="normalForm.value"
        v-model:api="normalFormApi"
        :option="normalForm.option"
        :rule="normalForm.rule"
      />
      <view v-else class="px-24rpx py-32rpx text-26rpx text-[#999]">
        暂无流程表单数据
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { ProcessDefinition, ProcessInstance } from '@/api/bpm/processInstance'
import type { FormCreateApi } from '@/pages-bpm/components/form-create/packages/wot-ui/types'
import type { FormCreatePreview } from '@/pages-bpm/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, ref, watch } from 'vue'
// 特殊：业务表单组件（uniapp 小程序不支持动态组件，需要静态导入）
import FormCreate from '@/pages-bpm/components/form-create/packages/wot-ui/src/index.vue'
import { FORM_FIELD_PERMISSION } from '@/pages-bpm/components/form-create/types/typing'
import LeaveDetail from '@/pages-bpm/oa/leave/detail/index.vue'
import { applySubFormsPermission, getMobileFormCustomPath, isSubFieldPermissionField, setConfAndFields2 } from '@/pages-bpm/utils'
import { getLastPage } from '@/utils'
import { BpmModelFormType } from '@/utils/constants'
import { isSamePackage } from '@/utils/url'

const props = defineProps<{
  /** 流程定义 */
  processDefinition?: ProcessDefinition
  /** 流程实例 */
  processInstance?: ProcessInstance
  /** 流程表单字段权限 */
  formFieldsPermission?: Record<string, string>
}>()

const toast = useToast()
const normalFormApi = ref<FormCreateApi>()
const writableFields = ref<string[]>([])
const normalForm = ref<FormCreatePreview>({
  option: {},
  rule: [],
  value: {},
})

/** 业务表单对应的移动端详情页路径（无映射则为 undefined） */
const businessDetailPath = computed(() =>
  getMobileFormCustomPath(props.processDefinition?.formCustomViewPath),
)
/**
 * 业务表单详情是否与当前审批页同分包（纯由路由第一层计算，当前页分包动态取，不写死）。
 * 同分包 → 内嵌组件（如 OA 请假）；跨分包（如 pages-crm）→ 仅路由跳转。
 */
const isSamePackageForm = computed(() => isSamePackage(businessDetailPath.value, getLastPage()?.route))

/** 跳转到业务表单详情页（跨分包仅做路由跳转，不内嵌组件，避免微信小程序分包不兼容） */
function openBusinessDetail() {
  const path = businessDetailPath.value
  const businessKey = props.processInstance?.businessKey
  if (!path) {
    return
  }
  if (!businessKey) {
    toast.show('缺少业务数据标识')
    return
  }
  uni.navigateTo({
    url: `${path}?id=${businessKey}`,
    fail: () => toast.show('打开业务详情失败'),
  })
}

/** 初始化 */
watch(
  () => [
    props.processDefinition?.formConf,
    props.processDefinition?.formFields,
    props.processDefinition?.formType,
    props.processInstance?.formVariables,
    props.formFieldsPermission,
  ],
  () => {
    if (props.processDefinition?.formType !== BpmModelFormType.NORMAL) {
      normalForm.value = { option: {}, rule: [], value: {} }
      writableFields.value = []
      return
    }
    setConfAndFields2(
      normalForm,
      props.processDefinition?.formConf,
      props.processDefinition?.formFields,
      props.processInstance?.formVariables || {},
    )
    normalForm.value.option = {
      ...normalForm.value.option,
      submitBtn: false,
      resetBtn: false,
    }
    // 子表单的子字段权限需要在渲染前写入规则
    applySubFormsPermission(normalForm.value.rule, props.formFieldsPermission)
    applyFieldPermission()
  },
  { deep: true, immediate: true },
)

/** 表单 API 或字段权限变化后重新应用权限 */
watch(
  () => [normalFormApi.value, props.formFieldsPermission, normalForm.value.rule],
  () => applyFieldPermission(),
  { deep: true, immediate: true },
)

/** 应用流程表单字段权限 */
async function applyFieldPermission() {
  await nextTick()
  const api = normalFormApi.value
  if (!api || props.processDefinition?.formType !== BpmModelFormType.NORMAL) {
    return
  }

  writableFields.value = []
  // 默认展示全部字段并禁用编辑，再按后端字段权限逐项放开或隐藏
  api.hidden(false)
  api.disabled(true)

  Object.entries(props.formFieldsPermission || {})
    .filter(([field]) => !isSubFieldPermissionField(field)) // 子表单的子字段权限，已写入规则
    .forEach(([field, permission]) => {
      api.setFieldPermission(field, permission)
      if (permission === FORM_FIELD_PERMISSION.WRITE) {
        writableFields.value.push(field)
      }
    })
}

/** 校验当前流程表单 */
async function validate() {
  if (!normalFormApi.value) {
    return { valid: true, errors: [] }
  }
  return normalFormApi.value.validate()
}

/** 获取当前节点允许编辑的流程变量 */
function getWritableVariables() {
  const formData = normalFormApi.value?.formData() || normalForm.value.value || {}
  return writableFields.value.reduce<Record<string, any>>((variables, field) => {
    variables[field] = formData[field]
    return variables
  }, {})
}

defineExpose({
  validate,
  getWritableVariables,
  writableFields,
})
</script>
