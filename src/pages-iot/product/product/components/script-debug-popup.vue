<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="bg-white p-24rpx">
      <view class="mb-16rpx text-center text-32rpx text-[#333] font-semibold">
        脚本调试
      </view>
      <scroll-view scroll-y class="max-h-[70vh]">
        <!-- 调试方向：调试执行中不允许切换，避免旧方向的结果展示在新方向下 -->
        <wd-radio-group v-model="direction" type="button" :disabled="debugging">
          <wd-radio value="decode">
            上行解码
          </wd-radio>
          <wd-radio value="encode">
            下行编码
          </wd-radio>
        </wd-radio-group>
        <view class="my-16rpx text-24rpx text-[#999]">
          调试对象为当前编辑内容（未保存也可以），不会发送给设备。
        </view>

        <!-- 调试输入 -->
        <view class="rounded-8rpx bg-[#f7f8fa] p-8rpx">
          <wd-textarea
            v-if="direction === 'decode'"
            v-model="inputHex"
            placeholder="输入 HEX，空格可选，例如 01 03 04 00 FA 02 58"
            custom-textarea-class="!h-200rpx !font-mono !text-24rpx"
          />
          <wd-textarea
            v-else
            v-model="inputJson"
            :placeholder="JSON_PLACEHOLDER"
            custom-textarea-class="!h-200rpx !font-mono !text-24rpx"
          />
        </view>

        <!-- 调试结果 -->
        <view v-if="result" class="mt-24rpx">
          <wd-cell-group border>
            <wd-cell title="执行结果">
              <wd-tag :type="result.success ? 'success' : 'danger'" variant="plain">
                {{ result.success ? '成功' : '失败' }}
              </wd-tag>
            </wd-cell>
            <wd-cell title="耗时" :value="`${result.durationMs ?? 0} ms`" />
            <template v-if="result.error">
              <wd-cell title="错误类型" :value="getErrorTypeLabel(result.error.type)" />
              <wd-cell v-if="result.error.line != null" title="错误行号" :value="`第 ${result.error.line} 行`" />
            </template>
            <wd-cell v-if="direction === 'encode' && result.success" title="下发方式" :value="result.standard ? '按标准消息下发' : '脚本编码'" />
          </wd-cell-group>
          <view v-if="result.error" class="mt-16rpx break-all rounded-8rpx bg-[#fff1f0] p-16rpx text-24rpx text-[#cf1322]">
            {{ result.error.message || '-' }}
          </view>
          <template v-if="direction === 'decode' && result.success">
            <view class="mb-8rpx mt-16rpx text-26rpx text-[#666]">
              解析消息
            </view>
            <view class="rounded-8rpx bg-[#f7f8fa] p-16rpx">
              <text class="whitespace-pre-wrap break-all font-mono text-24rpx text-[#333]">{{ messageJson }}</text>
            </view>
          </template>
          <template v-if="direction === 'encode' && result.success && !result.standard">
            <view class="mb-8rpx mt-16rpx text-26rpx text-[#666]">
              输出 HEX
            </view>
            <view class="break-all rounded-8rpx bg-[#f7f8fa] p-16rpx font-mono text-24rpx text-[#333]">
              {{ formatHex(result.outputHex) || '-' }}
            </view>
          </template>
        </view>
      </scroll-view>

      <!-- 底部操作按钮 -->
      <view class="mt-24rpx flex gap-16rpx">
        <wd-button class="flex-1" variant="plain" :disabled="debugging" @click="visible = false">
          关闭
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="debugging" @click="handleDebug">
          调试
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ProductScriptDebugReq, ProductScriptDebugResp } from '@/api/iot/product/product'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { debugProductScript } from '@/api/iot/product/product'
import { formatHex, parseHex } from '@/pages-iot/utils/raw'

const props = defineProps<{ productId?: number, content: string }>()
const visible = defineModel<boolean>({ default: false })

const JSON_PLACEHOLDER = '输入 JSON 消息，例如 {"method":"thing.property.set","params":{}}' // 下行编码输入提示

const toast = useToast()
const direction = ref<'decode' | 'encode'>('decode') // 调试方向
const inputHex = ref('') // 上行解码输入 HEX
const inputJson = ref('') // 下行编码输入 JSON 消息
const debugging = ref(false) // 调试执行状态
const result = ref<ProductScriptDebugResp>() // 调试结果
let debugSeq = 0 // 调试请求序号：切换方向或重新调试时递增，用于丢弃迟到的旧结果
const errorTypeLabels: Record<string, string> = { // 调试错误类型
  ERROR: '执行错误',
  TIMEOUT: '执行超时',
  REJECTED: '执行被拒绝',
  OUTPUT_INVALID: '输出非法',
  ENCODE_EMPTY: '编码结果为空',
}
const messageJson = computed(() => result.value?.message ? JSON.stringify(result.value.message, null, 2) : '无业务消息（实际上报时记录为透传上报）') // 解析消息 JSON

/** 切换调试方向时清空上次结果，并作废进行中的调试请求 */
watch(direction, () => {
  debugSeq++
  result.value = undefined
})

/** 获取错误类型名称 */
function getErrorTypeLabel(type?: string) {
  return (type && errorTypeLabels[type]) || type || '-'
}

/** 构建调试请求；输入不合法时提示并返回 undefined */
function buildDebugReq(): ProductScriptDebugReq | undefined {
  const data: ProductScriptDebugReq = {
    id: props.productId as number,
    scriptContent: props.content,
    direction: direction.value,
  }
  if (direction.value === 'decode') {
    const hex = parseHex(inputHex.value)
    if (!hex) {
      toast.warning('请输入合法的 HEX')
      return undefined
    }
    data.inputHex = hex
    return data
  }
  let message: any
  try {
    message = JSON.parse(inputJson.value)
  } catch {
    message = undefined
  }
  if (!message || typeof message !== 'object' || Array.isArray(message) || typeof message.method !== 'string') {
    toast.warning('请输入合法的 JSON 消息，并包含 method')
    return undefined
  }
  data.message = message
  return data
}

/** 执行调试 */
async function handleDebug() {
  if (!props.productId || debugging.value) {
    return
  }
  if (!props.content.trim()) {
    toast.warning('脚本内容为空')
    return
  }
  const data = buildDebugReq()
  if (!data) {
    return
  }
  const seq = ++debugSeq
  debugging.value = true
  result.value = undefined
  try {
    const resp = await debugProductScript(data)
    // 请求期间切换过方向时丢弃结果，旧方向的结果不能按新方向渲染
    if (seq !== debugSeq || data.direction !== direction.value) {
      return
    }
    result.value = resp
  } finally {
    debugging.value = false
  }
}
</script>
