<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计税规则详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="规则编号" :value="formData.id != null ? String(formData.id) : '-'" />
        <wd-cell title="方案名称" :value="formData.name || '-'" />
        <wd-cell title="个税类型">
          <dict-tag
            v-if="formData.type != null"
            :type="DICT_TYPE.HRM_SALARY_TAX_TYPE"
            :value="formData.type"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell
          title="是否计税"
          :value="formData.taxEnabled == null ? '-' : (formData.taxEnabled ? '是' : '否')"
        />
        <wd-cell
          title="起征点"
          :value="formData.threshold == null ? '-' : `${formData.threshold}元/月`"
        />
        <wd-cell
          title="小数位"
          :value="formData.decimalScale == null ? '-' : `保留${formData.decimalScale}位小数`"
        />
        <wd-cell title="计税周期" :value="formatHrmSalaryTaxCycleType(formData.cycleType)" />
        <wd-cell
          title="适用薪资组"
          :value="`${formData.usedGroupCount ?? 0}个薪资组正在使用`"
        />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:tax-rule:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:tax-rule:delete'])"
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
import type { SalaryTaxRule } from '@/api/hrm/salary/config/tax-rule'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteSalaryTaxRule, getSalaryTaxRule } from '@/api/hrm/salary/config/tax-rule'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmSalaryTaxCycleType } from '@/pages-hrm/utils/format'
import { delay, navigateBackPlus } from '@/utils'
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
const dialog = useDialog()
const formData = ref<SalaryTaxRule>({ // 详情数据
  name: '',
})
const deleting = ref(false) // 删除中
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:salary:tax-rule:update',
    'hrm:salary:tax-rule:delete',
  ])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/tax-rule/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getSalaryTaxRule(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/salary/config/tax-rule/form/index?id=${props.id}`,
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
      msg: `确认删除计税规则「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteSalaryTaxRule(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:salary:tax-rule:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:tax-rule:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:tax-rule:reload', getDetail)
})
</script>
