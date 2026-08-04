<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    closable
    safe-area-inset-bottom
    @close="visible = false"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="WiFi 名称" prop="ssid" title-width="180rpx">
            <wd-input
              v-model="formData.ssid"
              clearable
              placeholder="请输入 WiFi 名称"
              :maxlength="50"
            />
          </wd-form-item>
          <wd-form-item title="MAC 地址" prop="mac" title-width="180rpx">
            <wd-input
              v-model="formData.mac"
              clearable
              placeholder="例如 00:11:22:33:44:55"
              :maxlength="17"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AttendanceWifi } from '@/api/hrm/attendance/group'
import { computed, ref } from 'vue'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  confirm: [wifi: AttendanceWifi]
}>()

const macPattern = /^(?:[0-9a-f]{2}(?::[0-9a-f]{2}){5}|[0-9a-f]{2}(?:-[0-9a-f]{2}){5})$/i // MAC 地址格式
const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<AttendanceWifi>(createDefaultWifi()) // 表单数据
const formSchema = createFormSchema({
  ssid: [{ required: true, message: 'WiFi 名称不能为空' }],
  mac: [
    { required: true, message: 'MAC 地址不能为空' },
    { pattern: macPattern, message: 'MAC 地址格式不正确' },
  ],
})
const title = computed(() => editing.value ? '编辑打卡 WiFi' : '新增打卡 WiFi')

/** 打开弹窗 */
function open(wifi?: AttendanceWifi) {
  editing.value = !!wifi
  formData.value = wifi ? { ...wifi } : createDefaultWifi()
  visible.value = true
}
defineExpose({ open })

/** 确认 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  emit('confirm', { ...formData.value })
  visible.value = false
}

/** 创建默认 WiFi */
function createDefaultWifi(): AttendanceWifi {
  return {
    ssid: '',
    mac: '',
  }
}
</script>
