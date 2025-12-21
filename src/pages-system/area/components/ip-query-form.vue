<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom>
    <view class="p-32rpx">
      <view class="mb-24rpx text-32rpx font-semibold">
        IP 查询
      </view>
      <wd-input
        v-model="ipAddress"
        label="IP 地址"
        label-width="160rpx"
        placeholder="请输入 IP 地址"
        clearable
      />
      <wd-input
        v-model="ipResult"
        label="地址"
        label-width="160rpx"
        placeholder="展示查询 IP 结果"
        readonly
        class="mt-24rpx"
      />
      <wd-button type="primary" block class="mt-32rpx" @click="handleQueryIp">
        查询
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { getAreaByIp } from '@/api/system/area'
import { isIp } from '@/utils/validator'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(false)
const ipAddress = ref('')
const ipResult = ref('')

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    ipAddress.value = ''
    ipResult.value = ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

/** 查询 IP */
async function handleQueryIp() {
  if (!ipAddress.value) {
    uni.showToast({ title: '请输入 IP 地址', icon: 'none' })
    return
  }
  if (!isIp(ipAddress.value)) {
    uni.showToast({ title: '请输入正确的 IP 地址', icon: 'none' })
    return
  }
  ipResult.value = await getAreaByIp(ipAddress.value)
  uni.showToast({ title: '查询成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
</style>
