<template>
  <view v-if="tenantEnabled" class="input-item">
    <wd-icon name="home" size="20px" color="#1890ff" />
    <view class="ml-16rpx flex flex-1 items-center justify-between" @click="handleOpen">
      <text class="text-28rpx text-[#333]">
        {{ getWotPickerDisplay(tenantList, tenantId, { valueKey: 'id', labelKey: 'name', placeholder: '请选择租户' }) }}
      </text>
    </view>
    <wd-picker
      v-model:visible="pickerVisible.tenantId"
      :model-value="tenantPickerValue"
      :columns="tenantList"
      label-key="name"
      value-key="id"
      @confirm="({ value }) => handleTenantConfirm(value[0])"
    />
  </view>
</template>

<script lang="ts" setup>
import type { TenantVO } from '@/api/login'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  getTenantByWebsite,
  getTenantSimpleList,
} from '@/api/login'
import { useUserStore } from '@/store/user'
import { getWotPickerDisplay } from '@/utils/wot'

const props = defineProps<{
  preferredTenantId?: number
  disabled?: boolean
}>()

const toast = useToast()
const userStore = useUserStore()

const tenantEnabled = computed(
  () => import.meta.env.VITE_APP_TENANT_ENABLE === 'true',
) // 租户开关：通过环境变量控制
const tenantList = ref<TenantVO[]>([]) // 租户列表数据
const pickerVisible = ref<Record<string, boolean>>({})
const tenantLoading = ref(false) // 租户信息初始化状态

const tenantId = computed(
  () =>
    props.preferredTenantId
    || userStore.tenantId
    || Number(import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT_ID)
    || undefined,
) // 当前选中的租户
const tenantPickerValue = computed(() => tenantId.value !== undefined ? [tenantId.value] : []) // Wot Picker 使用数组值

/** 获取租户列表，并根据域名/appId 自动选中租户 */
async function fetchTenantList() {
  if (!tenantEnabled.value) {
    return
  }
  tenantLoading.value = true
  try {
    // 1. 并行获取租户列表和域名对应的租户
    const websiteTenantPromise = fetchTenantByWebsite()
    const list = await getTenantSimpleList()
    tenantList.value = list || []

    // 2. 确定选中的租户：授权指定租户 > 域名/appId > store 中的租户 > 列表第一个
    const websiteTenant = await websiteTenantPromise
    let selectedTenantId: number | null = props.preferredTenantId || null
    // 2.1 授权未指定租户时，使用域名/appId 对应的租户
    if (!selectedTenantId && websiteTenant?.id) {
      selectedTenantId = websiteTenant.id
    }
    // 2.2 如果没有从域名获取到，使用 store 中的租户
    if (!selectedTenantId && userStore.tenantId) {
      selectedTenantId = userStore.tenantId
    }
    // 2.3 如果还是没有，使用列表第一个
    if (!selectedTenantId && tenantList.value.length > 0) {
      selectedTenantId = tenantList.value[0].id
    }

    // 3. 设置选中的租户
    if (selectedTenantId && selectedTenantId !== userStore.tenantId) {
      userStore.setTenantId(selectedTenantId)
    }
  } catch (error) {
    console.error('获取租户列表失败:', error)
  } finally {
    tenantLoading.value = false
  }
}

/** 打开租户选择器 */
function handleOpen() {
  if (!props.disabled) {
    pickerVisible.value.tenantId = true
  }
}

/** 根据域名或 appId 获取租户 */
async function fetchTenantByWebsite(): Promise<TenantVO | null> {
  try {
    let website: string | null = null

    // #ifdef H5
    // H5 环境：使用域名
    if (window?.location?.hostname) {
      website = window.location.hostname
    }
    // #endif

    // #ifdef MP
    // 小程序环境：使用 appId
    const appId = uni.getAccountInfoSync?.()?.miniProgram?.appId
    if (appId) {
      website = appId
    }
    // #endif

    if (website) {
      return await getTenantByWebsite(website)
    }
  } catch (error) {
    // 域名未配置租户时会报错，忽略即可
    console.debug('根据域名获取租户失败:', error)
  }
  return null
}

/** 切换当前租户 */
function handleTenantConfirm(value?: number | string) {
  if (value !== undefined && value !== '') {
    userStore.setTenantId(Number(value))
  }
}

/** 校验租户是否已选择 */
function validate(): boolean {
  if (!tenantEnabled.value) {
    return true
  }
  if (tenantLoading.value) {
    toast.info('租户信息加载中，请稍后再试')
    return false
  }
  if (!tenantId.value) {
    toast.warning('请选择租户')
    return false
  }
  if (tenantId.value !== userStore.tenantId) {
    userStore.setTenantId(tenantId.value)
  }
  return true
}

/** 页面加载时获取租户列表 */
onMounted(() => {
  if (tenantEnabled.value && tenantId.value && tenantId.value !== userStore.tenantId) {
    userStore.setTenantId(tenantId.value)
  }
  fetchTenantList()
})

defineExpose({ validate })
</script>

<style lang="scss" scoped>
@import '../styles/auth.scss';
</style>
