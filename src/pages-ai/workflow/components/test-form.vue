<template>
  <wd-popup v-model="visible" position="bottom" custom-style="max-height: 78vh; overflow: auto;" @close="handleClose">
    <view class="bg-white">
      <view class="border-b border-[#eee] p-28rpx text-32rpx font-semibold">
        测试工作流
      </view>
      <view class="p-24rpx">
        <wd-cell-group border>
          <wd-cell title="流程" :value="name || '-'" />
          <wd-cell title="标识" :value="code || '-'" />
          <wd-cell title="输入参数">
            <wd-textarea
              v-model="input"
              placeholder="请输入测试 JSON 参数"
              :maxlength="4000"
              show-word-limit
              clearable
            />
          </wd-cell>
          <wd-cell title="测试结果">
            <view class="min-h-160rpx whitespace-pre-wrap text-26rpx text-[#666]">
              {{ result || '暂无结果' }}
            </view>
          </wd-cell>
        </wd-cell-group>
        <view class="mt-24rpx">
          <wd-button block type="primary" :loading="testing" @click="handleTest">
            执行测试
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { testWorkflow } from '@/api/ai/workflow'
import { formatJson } from '@/utils/format'

const props = defineProps<{
  modelValue: boolean
  workflowId?: number
  name?: string
  code?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toast = useToast()
const visible = ref(false) // 测试弹窗显示状态
const testing = ref(false) // 测试状态
const input = ref('{}') // 测试输入参数
const result = ref('') // 测试结果

/** 执行测试 */
async function handleTest() {
  if (!props.workflowId) {
    return
  }
  let params: Record<string, any>
  try {
    params = JSON.parse(input.value || '{}')
  } catch {
    toast.warning('测试参数不是合法 JSON')
    return
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    toast.warning('测试参数必须是 JSON 对象')
    return
  }
  testing.value = true
  try {
    const data = await testWorkflow({
      id: props.workflowId,
      params,
    })
    result.value = formatJson(data)
  } finally {
    testing.value = false
  }
}

/** 关闭弹窗 */
function handleClose() {
  emit('update:modelValue', false)
}

/** 同步弹窗状态 */
watch(() => props.modelValue, (value) => {
  visible.value = value
  if (value) {
    input.value = '{}'
    result.value = ''
  }
}, { immediate: true })
</script>
