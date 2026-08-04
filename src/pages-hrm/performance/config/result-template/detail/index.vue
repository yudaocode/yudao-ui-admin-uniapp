<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考核结果设置详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="模板编号" :value="formData.id != null ? String(formData.id) : '-'" />
        <wd-cell title="结果设置名称" :value="formData.name || '-'" />
        <wd-cell title="创建人" :value="formData.creatorName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        <wd-cell title="最近更新" :value="formatDateTime(formData.updateTime) || '-'" />
      </wd-cell-group>

      <!-- 结果等级列表 -->
      <view class="mt-24rpx px-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          结果等级
        </view>
        <view
          v-if="!formData.levels?.length"
          class="rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
        >
          暂无结果等级
        </view>
        <view
          v-for="(level, index) in formData.levels"
          :key="index"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="px-24rpx py-20rpx">
            <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
              {{ level.name || '-' }}
            </view>
            <view class="text-24rpx text-[#666]">
              分数 {{ level.minScore }} ~ {{ level.maxScore }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#666]">
              绩效系数 {{ level.coefficient }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:performance:result-template:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:performance:result-template:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ResultTemplate } from '@/api/hrm/performance/config/result-template'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deletePerformanceResultTemplate,
  getPerformanceResultTemplate,
} from '@/api/hrm/performance/config/result-template'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
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
const dialog = useDialog()
const formData = ref<ResultTemplate>({ // 详情数据
  name: '',
  levels: [],
})
const deleting = ref(false) // 删除中
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:performance:result-template:update',
    'hrm:performance:result-template:delete',
  ])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/performance/config/result-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getPerformanceResultTemplate(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/performance/config/result-template/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除考核结果设置「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deletePerformanceResultTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:performance:result-template:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:performance:result-template:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:performance:result-template:reload', getDetail)
})
</script>
