<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备配置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 配置内容 -->
    <view class="min-h-0 flex-1 overflow-y-auto p-24rpx pb-180rpx">
      <wd-loading v-if="loading" />
      <view v-else>
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
            {{ deviceData?.deviceName || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">设备编号：</text>{{ deviceData?.id || '-' }}
          </view>
        </view>

        <view class="mb-24rpx">
          <wd-notice-bar
            type="info"
            wrapable
            :scrollable="false"
            text="支持远程更新设备配置（JSON 格式），可编辑系统参数、网络参数等配置。配置完成后，点击「配置推送」下发到设备。"
          />
        </view>

        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">配置 JSON</text>
            <view v-if="isEditing" class="flex gap-12rpx">
              <wd-button size="small" variant="plain" @click="formatConfigText">
                格式化
              </wd-button>
              <wd-button size="small" variant="plain" @click="compactConfigText">
                压缩
              </wd-button>
            </view>
          </view>

          <template v-if="isEditing">
            <wd-textarea
              v-model="configText"
              placeholder="请输入设备配置 JSON"
              :maxlength="8000"
              show-word-limit
            />
            <view class="mt-12rpx text-24rpx" :class="jsonError ? 'text-[#fa4350]' : 'text-[#07c160]'">
              {{ jsonMessage }}
            </view>
          </template>
          <view v-else class="max-h-[760rpx] overflow-y-auto rounded-8rpx bg-[#f7f8fa] p-20rpx">
            <text class="whitespace-pre-wrap break-all text-24rpx text-[#333]">{{ previewText }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="isEditing" class="flex-1" type="info" @click="cancelEdit">
          取消
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:device:update']) && isEditing" class="flex-1" type="primary" :disabled="!!jsonError" :loading="saving" @click="handleSave">
          保存
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:device:update']) && !isEditing" class="flex-1" type="primary" @click="enableEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:device:update']) && !isEditing" class="flex-1" type="success" :loading="pushing" @click="handlePush">
          配置推送
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getDevice, sendDeviceMessage, updateDevice } from '@/api/iot/device/device'
import { useAccess } from '@/hooks/useAccess'
import { IotDeviceMessageMethodEnum } from '@/utils/constants'
import { navigateBackPlus } from '@/utils'
import { formatJson } from '@/utils/format'

const props = defineProps<{ deviceId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 页面加载状态
const saving = ref(false) // 保存状态
const pushing = ref(false) // 推送状态
const deviceData = ref<Device>() // 设备详情
const configText = ref('{}') // 配置 JSON 文本
const originalConfigText = ref('{}') // 原始配置文本
const isEditing = ref(false) // 编辑状态
const jsonError = computed(() => getJsonError(configText.value))
const jsonMessage = computed(() => jsonError.value || 'JSON 格式正确')
const previewText = computed(() => {
  const config = parseConfigText(false)
  return config === undefined ? configText.value : formatJson(config, '{}')
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 解析配置 JSON */
function parseConfigText(showToast = true) {
  try {
    return configText.value ? JSON.parse(configText.value) : {}
  } catch {
    if (showToast) {
      toast.warning('配置 JSON 格式不正确')
    }
    return undefined
  }
}

/** 获取 JSON 错误信息 */
function getJsonError(text: string) {
  if (!text?.trim()) {
    return ''
  }
  try {
    JSON.parse(text)
    return ''
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON 格式不正确'
    const match = message.match(/position\s+(\d+)/i)
    if (!match) {
      return `JSON 格式不正确：${message}`
    }
    const position = Number(match[1])
    const before = text.slice(0, position)
    const line = before.split('\n').length
    const column = before.length - before.lastIndexOf('\n')
    return `JSON 格式不正确：第 ${line} 行，第 ${column} 列`
  }
}

/** 加载设备详情 */
async function getDetail() {
  if (!props.deviceId) {
    return
  }
  loading.value = true
  try {
    deviceData.value = await getDevice(Number(props.deviceId))
    configText.value = formatJson(deviceData.value.config, '{}')
    originalConfigText.value = configText.value
    isEditing.value = false
  } finally {
    loading.value = false
  }
}

/** 启用编辑 */
function enableEdit() {
  isEditing.value = true
}

/** 取消编辑 */
function cancelEdit() {
  configText.value = originalConfigText.value
  isEditing.value = false
}

/** 格式化 JSON */
function formatConfigText() {
  const config = parseConfigText()
  if (config === undefined) {
    return
  }
  configText.value = formatJson(config, '{}')
}

/** 压缩 JSON */
function compactConfigText() {
  const config = parseConfigText()
  if (config === undefined) {
    return
  }
  configText.value = JSON.stringify(config)
}

/** 保存配置 */
async function handleSave() {
  if (!props.deviceId) {
    return
  }
  const config = parseConfigText()
  if (config === undefined) {
    return
  }
  saving.value = true
  try {
    await updateDevice({ id: Number(props.deviceId), config: JSON.stringify(config) } as Device)
    toast.success('保存成功')
    await getDetail()
  } finally {
    saving.value = false
  }
}

/** 推送配置 */
async function handlePush() {
  if (!props.deviceId || !hasAccessByCodes(['iot:device:update'])) {
    return
  }
  const config = parseConfigText()
  if (config === undefined) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要推送配置到设备吗？' })
  } catch {
    return
  }
  pushing.value = true
  try {
    await sendDeviceMessage({
      deviceId: Number(props.deviceId),
      method: IotDeviceMessageMethodEnum.CONFIG_PUSH.method,
      params: config,
    })
    toast.success('推送成功')
  } finally {
    pushing.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
