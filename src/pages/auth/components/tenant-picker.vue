<template>
  <view v-if="tenantEnabled" class="input-item">
    <wd-icon name="home" size="20px" color="#1890ff" />
    <wd-picker
      :model-value="tenantId"
      :columns="tenantList"
      label-key="name"
      value-key="id"
      label=""
      placeholder="请选择租户"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { TenantVO } from '@/api/login'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import {
  getTenantByWebsite,
  getTenantSimpleList,

} from '@/api/login'
import { useUserStore } from '@/store/user'

const toast = useToast()
const userStore = useUserStore()

const tenantEnabled = computed(
  () => import.meta.env.VITE_APP_TENANT_ENABLE === 'true',
) // 租户开关：通过环境变量控制
const tenantList = ref<TenantVO[]>([]) // 租户列表数据

const tenantId = computed(
  () =>
    userStore.tenantId
    || Number(import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT_ID)
    || undefined,
) // 当前选中的租户

/** 获取租户列表，并根据域名/appId 自动选中租户 */
async function fetchTenantList() {
  if (!tenantEnabled.value) {
    return
  }
  try {
    // 1. 并行获取租户列表和域名对应的租户
    const websiteTenantPromise = fetchTenantByWebsite()
    const list = await getTenantSimpleList()
    tenantList.value = list || []

    // 2. 确定选中的租户：域名/appId > store 中的租户 > 列表第一个
    let selectedTenantId: number | null = null
    // 2.1 优先使用域名/appId 对应的租户
    const websiteTenant = await websiteTenantPromise
    if (websiteTenant?.id) {
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

/** 租户选择确认 */
function handleConfirm({ value }: { value: number }) {
  userStore.setTenantId(value)
}

/** 校验租户是否已选择 */
function validate(): boolean {
  if (!tenantEnabled.value) {
    return true
  }
  if (!tenantId.value) {
    toast.warning('请选择租户')
    return false
  }
  return true
}

/** 页面加载时获取租户列表 */
onMounted(() => {
  fetchTenantList()
})

defineExpose({ validate })
</script>

<style lang="scss" scoped>
@import '../styles/auth.scss';
</style>
