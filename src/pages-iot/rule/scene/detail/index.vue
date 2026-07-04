<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="场景联动详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view class="pb-24rpx">
      <wd-cell-group border>
        <wd-cell title="规则编号" :value="String(formData?.id || '-')" />
        <wd-cell title="规则名称" :value="formData?.name || '-'" />
        <wd-cell title="规则状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="最近触发" :value="formatDateTime(formData?.lastTriggerTime) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="规则描述" :value="formData?.description || '-'" />
      </wd-cell-group>

      <!-- 触发器 -->
      <view class="mt-20rpx px-24rpx">
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          触发器（满足任一即触发）
        </view>
        <view v-for="(trigger, index) in formData?.triggers" :key="index" class="mb-16rpx rounded-12rpx bg-white p-24rpx">
          <view class="mb-8rpx text-28rpx text-[#333]">
            {{ index + 1 }}. {{ getTriggerTypeLabel(trigger.type) }}
          </view>
          <view v-if="trigger.type === IotRuleSceneTriggerTypeEnum.TIMER" class="text-26rpx text-[#666]">
            CRON：{{ trigger.cronExpression || '-' }}
          </view>
          <template v-else>
            <view v-if="trigger.identifier" class="text-26rpx text-[#666]">
              监控项：{{ trigger.identifier }}
            </view>
            <view v-if="trigger.operator" class="text-26rpx text-[#666]">
              条件：{{ operatorLabel(trigger.operator) }} {{ trigger.value ?? '' }}
            </view>
          </template>
        </view>
        <view v-if="!formData?.triggers?.length" class="text-26rpx text-[#999]">
          暂无触发器
        </view>
      </view>

      <!-- 执行器 -->
      <view class="mt-20rpx px-24rpx">
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          执行器
        </view>
        <view v-for="(action, index) in formData?.actions" :key="index" class="mb-16rpx rounded-12rpx bg-white p-24rpx">
          <view class="mb-8rpx text-28rpx text-[#333]">
            {{ index + 1 }}. {{ getActionTypeLabel(action.type) }}
          </view>
          <view v-if="action.identifier" class="text-26rpx text-[#666]">
            监控项：{{ action.identifier }}
          </view>
          <view v-if="action.params" class="break-all text-26rpx text-[#666]">
            参数：{{ action.params }}
          </view>
          <view v-if="action.alertConfigId" class="text-26rpx text-[#666]">
            告警配置：{{ alertConfigLabel(action.alertConfigId) }}
          </view>
        </view>
        <view v-if="!formData?.actions?.length" class="text-26rpx text-[#999]">
          暂无执行器
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['iot:scene-rule:update', 'iot:rule-scene:update'])"
          class="flex-1"
          type="info"
          :loading="statusLoading"
          :disabled="deleting"
          @click="handleToggleStatus"
        >
          {{ statusButtonText }}
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:scene-rule:update', 'iot:rule-scene:update'])"
          class="flex-1"
          type="warning"
          :disabled="deleting || statusLoading"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:scene-rule:delete', 'iot:rule-scene:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          :disabled="statusLoading"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AlertConfig } from '@/api/iot/alert/config'
import type { IotSceneRule } from '@/api/iot/rule/scene'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSimpleAlertConfigList } from '@/api/iot/alert/config'
import { deleteRuleScene, getRuleScene, updateRuleSceneStatus } from '@/api/iot/rule/scene'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, getActionTypeLabel, getTriggerTypeLabel, IotRuleSceneTriggerTypeEnum, operatorOptions } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<IotSceneRule>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 状态变更状态
const alertConfigOptions = ref<AlertConfig[]>([]) // 告警配置选项
const statusButtonText = computed(() => formData.value?.status === CommonStatusEnum.ENABLE ? '停用' : '启用')

/** 操作符标签 */
function operatorLabel(operator?: string) {
  return operatorOptions.find(item => item.value === operator)?.label || operator || ''
}

/** 告警配置名称 */
function alertConfigLabel(id?: number) {
  return alertConfigOptions.value.find(item => item.id === id)?.name || String(id ?? '-')
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/rule/scene/index')
}

/** 加载场景联动详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getRuleScene(Number(props.id))
}

/** 加载告警配置选项 */
async function loadAlertConfigOptions() {
  alertConfigOptions.value = await getSimpleAlertConfigList()
}

/** 编辑场景联动 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/rule/scene/form/index?id=${props.id}` })
}

/** 切换状态 */
async function handleToggleStatus() {
  if (!props.id || !formData.value || deleting.value || statusLoading.value) {
    return
  }
  const nextStatus = formData.value.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const actionName = formData.value.status === CommonStatusEnum.ENABLE ? '停用' : '启用'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该场景联动吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateRuleSceneStatus(Number(props.id), nextStatus)
    toast.success(`${actionName}成功`)
    uni.$emit('iot:scene-rule:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

/** 删除场景联动 */
async function handleDelete() {
  if (!props.id || deleting.value || statusLoading.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该场景联动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteRuleScene(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:scene-rule:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadAlertConfigOptions()
})

/** 页面显示时刷新详情 */
onShow(() => {
  getDetail()
})
</script>
