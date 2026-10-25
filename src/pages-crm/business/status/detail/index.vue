<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商机状态组详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 基本信息 -->
    <wd-cell-group border>
      <wd-cell title="状态组名" :value="formData.name || '-'" />
      <wd-cell title="应用部门" :value="formData.deptNames?.length ? formData.deptNames.join('、') : '全公司'" />
    </wd-cell-group>

    <!-- 阶段设置（只读） -->
    <view class="mt-24rpx bg-white">
      <view class="px-24rpx py-20rpx">
        <text class="text-30rpx text-[#333] font-semibold">阶段设置</text>
      </view>
      <view
        v-for="(status, index) in formData.statuses || []"
        :key="index"
        class="mx-24rpx mb-20rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
      >
        <text class="text-28rpx text-[#333]">{{ status.name || '-' }}</text>
        <text class="text-28rpx text-[#999]">{{ status.percent ?? 0 }}%</text>
      </view>
      <wd-empty v-if="!(formData.statuses && formData.statuses.length)" icon="content" tip="暂无阶段" />
    </view>

    <!-- 底部操作 -->
    <view v-if="hasAccessByCodes(['crm:business-status:update']) || hasAccessByCodes(['crm:business-status:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['crm:business-status:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['crm:business-status:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { BusinessStatusType } from '@/api/crm/business/status'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteBusinessStatus, getBusinessStatus } from '@/api/crm/business/status'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<BusinessStatusType>({ name: '', statuses: [] }) // 详情数据
const deleting = ref(false) // 删除状态
const statusId = computed(() => props.id)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/business/status/index')
}

/** 加载详情 */
async function getDetail() {
  if (!statusId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getBusinessStatus(statusId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/business/status/form/index?id=${statusId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!statusId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该商机状态组吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteBusinessStatus(statusId.value)
    toast.success('删除成功')
    uni.$emit('crm:businessStatus:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:businessStatus:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:businessStatus:reload', getDetail)
})
</script>
