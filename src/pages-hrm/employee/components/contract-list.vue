<template>
  <view class="p-24rpx pb-160rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <text class="text-28rpx text-[#333] font-semibold">
        合同信息
      </text>
      <text
        v-if="hasAccessByCodes(['hrm:employee:update'])"
        class="text-28rpx text-[#1677ff]"
        @click="openForm()"
      >
        新增
      </text>
    </view>
    <view v-if="!list.length" class="py-40rpx text-center text-28rpx text-[#999]">
      暂无合同信息
    </view>
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-12rpx flex items-center justify-between gap-16rpx">
        <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
          {{ item.no || '-' }}
        </text>
        <text class="shrink-0 text-26rpx text-[#666]">
          {{ formatEmployeeContractStatus(item.status) }}
        </text>
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        类型：{{ formatEmployeeContractType(item.type) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        期限：{{ item.term != null ? `${item.term} 年` : '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        起止：{{ formatDate(item.startTime) || '-' }} ~ {{ formatDate(item.endTime) || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        签约公司：{{ item.signCompany || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        签订日期：{{ formatDate(item.signTime) || '-' }}
      </view>
      <view v-if="item.remark" class="mb-8rpx text-26rpx text-[#666]">
        备注：{{ item.remark }}
      </view>
      <view
        v-if="item.fileUrls?.length"
        class="mb-16rpx"
      >
        <view
          v-for="(url, index) in item.fileUrls"
          :key="`${url}-${index}`"
          class="mb-8rpx text-26rpx text-[#1677ff]"
          @click="openAttachment(url)"
        >
          {{ getFileNameFromUrl(url) || `附件 ${index + 1}` }}
        </view>
      </view>
      <view
        v-if="hasAccessByCodes(['hrm:employee:update']) || hasAccessByCodes(['hrm:employee:delete'])"
        class="flex gap-32rpx border-t border-[#f0f0f0] pt-16rpx"
      >
        <text
          v-if="hasAccessByCodes(['hrm:employee:update'])"
          class="text-28rpx text-[#1677ff]"
          @click="openForm(item)"
        >
          编辑
        </text>
        <text
          v-if="hasAccessByCodes(['hrm:employee:delete'])"
          class="text-28rpx text-[#f5222d]"
          @click="handleDelete(item)"
        >
          删除
        </text>
      </view>
    </view>
    <ContractForm ref="formRef" @success="getList" />
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeContract } from '@/api/hrm/employee/contract'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import {
  deleteEmployeeContract,
  getEmployeeContractList,
} from '@/api/hrm/employee/contract'
import { useAccess } from '@/hooks/useAccess'
import { getFileNameFromUrl, openAttachment } from '@/utils/download'
import { formatDate } from '@/utils/date'
import {
  formatEmployeeContractStatus,
  formatEmployeeContractType,
} from '@/pages-hrm/utils/format'
import ContractForm from './contract-form.vue'

const props = defineProps<{
  employeeId: number
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<EmployeeContract[]>([])
const formRef = ref<InstanceType<typeof ContractForm>>()

/** 加载合同列表 */
async function getList() {
  if (!props.employeeId) {
    list.value = []
    return
  }
  list.value = await getEmployeeContractList(props.employeeId)
}

/** 打开表单 */
function openForm(row?: EmployeeContract) {
  formRef.value?.open(props.employeeId, row)
}

/** 删除合同 */
async function handleDelete(item: EmployeeContract) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除合同“${item.no || ''}”吗？`,
    })
  } catch {
    return
  }
  await deleteEmployeeContract(item.id)
  toast.success('删除成功')
  await getList()
}

watch(() => props.employeeId, () => getList())
onMounted(() => getList())
defineExpose({ getList, openAdd: () => openForm() })
</script>
