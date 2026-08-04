<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="调薪模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="模板编号" :value="formData.id != null ? String(formData.id) : '-'" />
        <wd-cell title="模板名称" :value="formData.name || '-'" />
        <wd-cell
          title="默认模板"
          :value="formData.defaultStatus == null ? '-' : (formData.defaultStatus ? '是' : '否')"
        />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>

      <!-- 调薪项 -->
      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          调薪项
        </view>
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view v-if="(formData.options || []).length" class="flex flex-wrap gap-12rpx">
            <view
              v-for="option in formData.options"
              :key="option.code"
              class="rounded-6rpx bg-[#e6f4ff] px-12rpx py-4rpx text-22rpx text-[#1677ff]"
            >
              {{ option.name }}
            </view>
          </view>
          <view v-else class="py-24rpx text-center text-28rpx text-[#999]">
            暂无调薪项
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:change-template:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:change-template:delete'])"
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
import type { SalaryChangeTemplate } from '@/api/hrm/salary/config/change-template'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deleteSalaryChangeTemplate,
  getSalaryChangeTemplate,
} from '@/api/hrm/salary/config/change-template'
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
const formData = ref<SalaryChangeTemplate>({ // 详情数据
  name: '',
  defaultStatus: false,
  options: [],
})
const deleting = ref(false) // 删除中
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:salary:change-template:update',
    'hrm:salary:change-template:delete',
  ])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/change-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getSalaryChangeTemplate(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/salary/config/change-template/form/index?id=${props.id}`,
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
      msg: `确认删除调薪模板「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteSalaryChangeTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:salary:change-template:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:change-template:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:change-template:reload', getDetail)
})
</script>
