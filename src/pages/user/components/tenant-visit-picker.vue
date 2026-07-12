<template>
  <view v-if="$slots.default" @click="open">
    <slot :value="displayValue" />
  </view>

  <wd-select-picker
    ref="pickerRef"
    :model-value="pickerValue"
    title="切换租户"
    :columns="tenantOptions"
    :loading="loading"
    value-key="id"
    label-key="displayName"
    type="radio"
    filterable
    root-portal
    :z-index="1100"
    :scroll-into-view="false"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { TenantVO } from '@/api/login'
import { computed, onMounted, ref } from 'vue'
import { getTenantSimpleList } from '@/api/login'
import { useUserStore } from '@/store/user'

interface TenantOption extends TenantVO {
  displayName: string
}

const emit = defineEmits<{
  confirm: [tenant: TenantVO]
}>()

const userStore = useUserStore()
const pickerRef = ref<SelectPickerInstance>() // 租户选择器
const tenantList = ref<TenantVO[]>([]) // 租户选项
const loading = ref(false) // 租户选项加载状态
const pickerValue = computed(() => userStore.visitTenantId || userStore.tenantId || '')
const tenantOptions = computed<TenantOption[]>(() => tenantList.value.map(tenant => ({
  ...tenant,
  displayName: tenant.id === userStore.tenantId
    ? `${tenant.name}（当前登录）`
    : tenant.id === userStore.visitTenantId
      ? `${tenant.name}（当前访问）`
      : tenant.name,
})))
const displayValue = computed(() => {
  const tenantId = userStore.visitTenantId || userStore.tenantId
  return tenantList.value.find(tenant => tenant.id === tenantId)?.name || (tenantId ? `租户 ${tenantId}` : '未选择')
})

/** 打开租户选择器 */
function open() {
  pickerRef.value?.open()
  if (tenantList.value.length === 0) {
    loadTenantOptions()
  }
}

/** 确认租户选择 */
function handleConfirm({ value }: { value: number | string }) {
  if (loading.value) {
    return
  }
  const tenant = tenantList.value.find(item => item.id === Number(value))
  if (tenant) {
    emit('confirm', tenant)
  }
}

/** 加载租户选项 */
async function loadTenantOptions() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    tenantList.value = await getTenantSimpleList()
  } catch {
    tenantList.value = []
  } finally {
    loading.value = false
  }
}

/** 初始化租户选项 */
onMounted(loadTenantOptions)
</script>
