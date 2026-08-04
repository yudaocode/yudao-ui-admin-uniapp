<template>
  <view class="p-24rpx">
    <view v-if="!list.length" class="py-40rpx text-center text-28rpx text-[#999]">
      暂无调薪记录
    </view>
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-12rpx flex items-center justify-between gap-16rpx">
        <text class="text-30rpx text-[#333] font-semibold">
          {{ item.recordType === HrmSalaryRecordType.FIXED ? '定薪' : '调薪' }}
        </text>
        <dict-tag
          v-if="item.status != null"
          :type="DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS"
          :value="item.status"
        />
      </view>
      <view class="mb-8rpx flex items-center gap-12rpx text-26rpx text-[#666]">
        <text class="text-[#999]">调整原因：</text>
        <dict-tag
          v-if="item.changeReason != null"
          :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
          :value="item.changeReason"
        />
        <text v-else>-</text>
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        生效日期：{{ formatHrmDate(item.effectTime) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        正式：{{ formatHrmMoney(item.beforeTotal) }} → {{ formatHrmMoney(item.afterTotal) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        试用：{{ formatHrmMoney(item.probationBeforeTotal) }} → {{ formatHrmMoney(item.probationAfterTotal) }}
      </view>
      <view v-if="item.remark" class="mb-12rpx text-26rpx text-[#666]">
        备注：{{ item.remark }}
      </view>
      <view class="flex flex-wrap justify-end gap-16rpx">
        <wd-button
          v-if="canEditRecord(item) && hasAccessByCodes(['hrm:salary:employee-info:update'])"
          size="small"
          type="primary"
          variant="plain"
          @click="emit('edit', item)"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="item.status === HrmSalaryChangeRecordStatus.PENDING && hasAccessByCodes(['hrm:salary:employee-info:update'])"
          size="small"
          type="warning"
          variant="plain"
          @click="handleCancel(item.id)"
        >
          取消
        </wd-button>
        <wd-button
          v-if="item.status !== HrmSalaryChangeRecordStatus.EFFECTIVE && hasAccessByCodes(['hrm:salary:change-record:delete'])"
          size="small"
          type="error"
          variant="plain"
          @click="handleDelete(item.id)"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryChangeRecord } from '@/api/hrm/salary/change-record'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import {
  cancelSalaryChangeRecord,
  deleteSalaryChangeRecord,
  getSalaryChangeRecordList,
} from '@/api/hrm/salary/change-record'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmSalaryChangeRecordStatus,
  HrmSalaryRecordType,
} from '@/pages-hrm/utils/constants'
import { formatHrmDate, formatHrmMoney } from '@/pages-hrm/utils/format'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  employeeId: number
}>()

const emit = defineEmits<{
  edit: [record: SalaryChangeRecord]
  change: []
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<SalaryChangeRecord[]>([]) // 定薪/调薪记录

/** 加载调薪记录 */
async function getList() {
  if (!props.employeeId) {
    list.value = []
    return
  }
  list.value = await getSalaryChangeRecordList(props.employeeId)
}

/** 判断定薪/调薪记录是否允许编辑 */
function canEditRecord(record: SalaryChangeRecord) {
  if (record.recordType !== HrmSalaryRecordType.FIXED) {
    return record.status !== HrmSalaryChangeRecordStatus.EFFECTIVE
  }
  return !list.value.some(item =>
    item.recordType === HrmSalaryRecordType.CHANGE
    && item.status !== HrmSalaryChangeRecordStatus.CANCELLED,
  )
}

/** 取消待生效调整 */
async function handleCancel(recordId?: number) {
  if (!recordId) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该待生效的薪资调整吗？',
    })
  } catch {
    return
  }
  await cancelSalaryChangeRecord(recordId)
  toast.success('取消成功')
  await getList()
  emit('change')
}

/** 删除薪资调整记录 */
async function handleDelete(recordId?: number) {
  if (!recordId) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认删除该调薪记录吗？',
    })
  } catch {
    return
  }
  await deleteSalaryChangeRecord(recordId)
  toast.success('删除成功')
  await getList()
  emit('change')
}

watch(() => props.employeeId, () => getList())

onMounted(() => {
  getList()
})

defineExpose({ getList })
</script>
