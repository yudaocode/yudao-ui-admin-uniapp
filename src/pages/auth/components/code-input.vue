<template>
  <view class="input-item">
    <wd-icon name="lock-on" size="20px" color="#1890ff" />
    <wd-input
      :model-value="modelValue"
      placeholder="请输入验证码"
      clearable
      clear-trigger="focus"
      no-border
      type="number"
      :maxlength="6"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <view
      class="whitespace-nowrap border-l-1rpx border-l-[#e5e5e5] border-l-solid px-20rpx text-28rpx text-[#1890ff]"
      @click="handleSendCode"
    >
      <text :class="{ 'text-gray-400': countdown > 0 }">
        {{ countdown > 0 ? `${countdown} 秒后重发` : "获取验证码" }}
      </text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { sendSmsCode } from '@/api/login'
import { isMobile } from '@/utils/validator'

defineOptions({
  name: 'CodeInput',
})

const props = defineProps<{
  modelValue: string // 验证码值 (v-model)
  mobile: string // 手机号
  scene: number // 短信场景：21-登录 23-重置密码
  beforeSend?: () => boolean // 发送前的校验函数，返回 false 则不发送
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const toast = useToast()
const countdown = ref(0) // 验证码倒计时，单位秒
let countdownTimer: ReturnType<typeof setInterval> | null = null // 倒计时定时器

/** 页面卸载时清除倒计时定时器 */
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

/** 发送验证码 */
async function handleSendCode() {
  // 执行前置校验
  if (props.beforeSend && !props.beforeSend()) {
    return
  }
  if (countdown.value > 0) {
    return
  }
  if (!props.mobile) {
    toast.warning('请输入手机号')
    return
  }
  if (!isMobile(props.mobile)) {
    toast.warning('请输入正确的手机号')
    return
  }

  // 发送验证码
  await sendSmsCode({ mobile: props.mobile, scene: props.scene })
  toast.success('验证码已发送')

  // 开始倒计时
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      countdownTimer = null
    }
  }, 1000)
}
</script>
