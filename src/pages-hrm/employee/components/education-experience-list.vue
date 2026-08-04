<template>
  <view class="p-24rpx pb-8rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <text class="text-28rpx text-[#333] font-semibold">
        教育经历
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
      暂无教育经历
    </view>
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-12rpx flex items-center justify-between gap-16rpx">
        <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
          {{ item.graduateSchool || '-' }}
        </text>
        <dict-tag
          v-if="item.education != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
          :value="item.education"
        />
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        专业：{{ item.major || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        起止：{{ formatDate(item.admissionTime) || '-' }} ~ {{ formatDate(item.graduationTime) || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        教学方式：{{ formatEmployeeTeachingMethod(item.teachingMethods) }}
      </view>
      <view class="mb-16rpx text-26rpx text-[#666]">
        第一学历：{{ item.firstDegree ? '是' : '否' }}
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
    <EducationExperienceForm ref="formRef" @success="getList" />
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeEducationExperience } from '@/api/hrm/employee/education-experience'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import {
  deleteEmployeeEducationExperience,
  getEmployeeEducationExperienceList,
} from '@/api/hrm/employee/education-experience'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { formatEmployeeTeachingMethod } from '@/pages-hrm/utils/format'
import EducationExperienceForm from './education-experience-form.vue'

const props = defineProps<{
  employeeId: number
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<EmployeeEducationExperience[]>([])
const formRef = ref<InstanceType<typeof EducationExperienceForm>>()

/** 加载列表 */
async function getList() {
  if (!props.employeeId) {
    list.value = []
    return
  }
  list.value = await getEmployeeEducationExperienceList(props.employeeId)
}

/** 打开表单 */
function openForm(row?: EmployeeEducationExperience) {
  formRef.value?.open(props.employeeId, row)
}

/** 删除 */
async function handleDelete(item: EmployeeEducationExperience) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除教育经历“${item.graduateSchool || ''}”吗？`,
    })
  } catch {
    return
  }
  await deleteEmployeeEducationExperience(item.id)
  toast.success('删除成功')
  await getList()
}

watch(() => props.employeeId, () => getList())
onMounted(() => getList())
defineExpose({ getList })
</script>
