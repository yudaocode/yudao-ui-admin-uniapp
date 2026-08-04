<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="薪资组详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="薪资组编号" :value="formData.id != null ? String(formData.id) : '-'" />
        <wd-cell title="薪资组名称" :value="formData.name || '-'" />
        <wd-cell title="计薪标准" :value="`${formData.salaryStandard ?? 0} 天/月`" />
        <wd-cell title="计税规则" :value="formData.taxRuleName || '-'" />
        <wd-cell title="调薪规则" :value="formData.changeRule || '-'" />
        <wd-cell title="适用范围" :value="formatSalaryGroupScope(formData)" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:group:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:group:delete'])"
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
import type { SalaryGroup } from '@/api/hrm/salary/config/group'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteSalaryGroup, getSalaryGroup } from '@/api/hrm/salary/config/group'
import { useAccess } from '@/hooks/useAccess'
import { formatSalaryGroupScope } from '@/pages-hrm/utils/format'
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
const formData = ref<SalaryGroup>({ // 详情数据
  name: '',
})
const deleting = ref(false) // 删除中
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:salary:group:update',
    'hrm:salary:group:delete',
  ])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/group/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getSalaryGroup(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/salary/config/group/form/index?id=${props.id}`,
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
      msg: `确认删除薪资组「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteSalaryGroup(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:salary:group:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:group:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:group:reload', getDetail)
})
</script>
