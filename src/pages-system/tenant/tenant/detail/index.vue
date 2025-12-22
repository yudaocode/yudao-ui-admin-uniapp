<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="租户详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="租户编号" :value="formData?.id" />
        <wd-cell title="租户名称" :value="formData?.name" />
        <wd-cell title="租户套餐" :value="getPackageName(formData?.packageId)" />
        <wd-cell title="联系人" :value="formData?.contactName ?? '-'" />
        <wd-cell title="联系手机" :value="formData?.contactMobile ?? '-'" />
        <wd-cell title="账号额度" :value="formData?.accountCount" />
        <wd-cell title="过期时间" :value="formatDateTime(formData?.expireTime)" />
        <wd-cell title="绑定域名" :value="formData?.websites?.join(', ') || '-'" />
        <wd-cell title="租户状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['system:tenant:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:tenant:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Tenant } from '@/api/system/tenant'
import type { TenantPackage } from '@/api/system/tenant/package'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteTenant, getTenant } from '@/api/system/tenant'
import { getTenantPackageList } from '@/api/system/tenant/package'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<Tenant>()
const packageList = ref<TenantPackage[]>([])
const deleting = ref(false)

/** 获取套餐名称 */
function getPackageName(packageId?: number) {
  if (packageId === 0) {
    return '系统租户'
  }
  const pkg = packageList.value.find(item => item.id === packageId)
  return pkg?.name || '-'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/tenant/index')
}

/** 加载租户套餐列表 */
async function loadPackageList() {
  packageList.value = await getTenantPackageList()
}

/** 加载租户详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTenant(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑租户 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/tenant/tenant/form/index?id=${props.id}`,
  })
}

/** 删除租户 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该租户吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteTenant(props.id)
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

/** 初始化 */
onMounted(async () => {
  await loadPackageList()
  await getDetail()
})
</script>

<style lang="scss" scoped>
</style>
