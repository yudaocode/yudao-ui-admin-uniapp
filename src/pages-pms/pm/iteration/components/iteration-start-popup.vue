<template>
  <!-- 开始迭代弹窗 -->
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        开始迭代
      </view>
      <wd-cell-group border>
        <wd-cell title="开始时间" title-width="200rpx">
          <wd-datetime-picker v-model="startTime" type="datetime" placeholder="请选择开始时间" />
        </wd-cell>
        <wd-cell title="结束时间" title-width="200rpx">
          <wd-datetime-picker v-model="endTime" type="datetime" placeholder="请选择结束时间" />
        </wd-cell>
      </wd-cell-group>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { startIteration } from '@/api/pms/pm/iteration'
import { toTimestamp } from '@/utils/date'

const emit = defineEmits<{ success: [] }>() // 开始成功事件，供父级刷新

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const submitting = ref(false) // 提交中
const iterationId = ref(0) // 迭代编号
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择

/** 打开弹窗（回显迭代已有周期） */
function open(iteration: Iteration) {
  if (!iteration.id) {
    return
  }
  iterationId.value = iteration.id
  startTime.value = iteration.startTime ? toTimestamp(iteration.startTime) : ''
  endTime.value = iteration.endTime ? toTimestamp(iteration.endTime) : ''
  visible.value = true
}

/** 确认开始迭代 */
async function handleSubmit() {
  if (!startTime.value || !endTime.value) {
    toast.warning('迭代周期不能为空')
    return
  }
  submitting.value = true
  try {
    await startIteration({
      id: iterationId.value,
      startTime: Number(startTime.value),
      endTime: Number(endTime.value),
    })
    toast.success('迭代已开始')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
