<template>
  <view class="p-24rpx pb-8rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <text class="text-28rpx text-[#333] font-semibold">
        培训经历
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
      暂无培训经历
    </view>
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
        {{ item.course || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        机构：{{ item.organizationName || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        起止：{{ formatDate(item.startTime) || '-' }} ~ {{ formatDate(item.endTime) || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        时长/成绩：{{ item.duration || '-' }} / {{ item.result || '-' }}
      </view>
      <view class="mb-16rpx text-26rpx text-[#666]">
        证书：{{ item.certificateName || '-' }}
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
    <TrainingExperienceForm ref="formRef" @success="getList" />
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeTrainingExperience } from '@/api/hrm/employee/training-experience'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import {
  deleteEmployeeTrainingExperience,
  getEmployeeTrainingExperienceList,
} from '@/api/hrm/employee/training-experience'
import { useAccess } from '@/hooks/useAccess'
import { formatDate } from '@/utils/date'
import TrainingExperienceForm from './training-experience-form.vue'

const props = defineProps<{ employeeId: number }>()
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<EmployeeTrainingExperience[]>([])
const formRef = ref<InstanceType<typeof TrainingExperienceForm>>()

async function getList() {
  if (!props.employeeId) {
    list.value = []
    return
  }
  list.value = await getEmployeeTrainingExperienceList(props.employeeId)
}

function openForm(row?: EmployeeTrainingExperience) {
  formRef.value?.open(props.employeeId, row)
}

async function handleDelete(item: EmployeeTrainingExperience) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除培训经历“${item.course || ''}”吗？` })
  } catch {
    return
  }
  await deleteEmployeeTrainingExperience(item.id)
  toast.success('删除成功')
  await getList()
}

watch(() => props.employeeId, () => getList())
onMounted(() => getList())
defineExpose({ getList })
</script>
