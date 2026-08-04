<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="visible = false"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="bg-white px-24rpx pb-8rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          批量调整参保方案
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell title="已选员工" :value="`${formData.ids.length} 人`" />
          <SchemeFormPicker
            v-model="formData.schemeId"
            label="参保方案"
            prop="schemeId"
            placeholder="请选择参保方案"
            @change="handleSchemeChange"
          />
        </wd-form>
      </view>

      <scroll-view scroll-y class="min-h-0 flex-1 p-24rpx">
        <view v-if="!projectList.length" class="py-80rpx text-center text-28rpx text-[#999]">
          请先选择参保方案
        </view>
        <view
          v-for="(item, index) in projectList"
          :key="item.schemeProjectId || index"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <dict-tag
              v-if="item.type != null"
              :type="DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE"
              :value="item.type"
            />
          </view>
          <view v-if="schemeType === HrmInsuranceSchemeType.PROPORTION">
            <view class="mb-8rpx text-26rpx text-[#666]">
              缴纳基数
            </view>
            <wd-input-number
              v-model="item.baseAmount"
              allow-null
              :precision="2"
              :min="0"
              :step="1"
            />
            <view class="mt-12rpx text-26rpx text-[#666]">
              公司比例：{{ formatHrmRate(item.corporateRate) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              个人比例：{{ formatHrmRate(item.personalRate) }}
            </view>
          </view>
          <view v-else class="flex flex-col gap-12rpx">
            <view class="text-26rpx text-[#666]">
              公司金额
            </view>
            <wd-input-number
              v-model="item.corporateAmount"
              allow-null
              :precision="2"
              :min="0"
              :step="1"
            />
            <view class="text-26rpx text-[#666]">
              个人金额
            </view>
            <wd-input-number
              v-model="item.personalAmount"
              allow-null
              :precision="2"
              :min="0"
              :step="1"
            />
          </view>
        </view>
      </scroll-view>

      <view class="bg-white px-24rpx py-20rpx">
        <view class="flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="visible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
            确定
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { InsuranceMonthEmployeeProject } from '@/api/hrm/insurance/month-record/employee'
import type { InsuranceScheme } from '@/api/hrm/insurance/scheme'
import { ref } from 'vue'
import {
  updateInsuranceMonthEmployeeRecord,
} from '@/api/hrm/insurance/month-record/employee'
import { getInsuranceScheme } from '@/api/hrm/insurance/scheme'
import { createFormSchema } from '@/utils/wot'
import { executeBatch } from '@/pages-hrm/utils/batch'
import { HrmInsuranceSchemeType } from '@/pages-hrm/utils/constants'
import { formatHrmRate } from '@/pages-hrm/utils/format'
import { DICT_TYPE } from '@/utils/constants'
import SchemeFormPicker from './scheme-form-picker.vue'

const emit = defineEmits<{
  success: []
}>()

const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<any>() // 表单引用
const schemeType = ref<number>() // 参保方案类型
const projectList = ref<InsuranceMonthEmployeeProject[]>([]) // 参保项目列表
const formData = ref({
  ids: [] as number[],
  schemeId: undefined as number | undefined,
}) // 表单数据

const formSchema = createFormSchema({
  schemeId: [{ required: true, message: '请选择社保方案' }],
})

/** 打开弹窗 */
function open(ids: number[]) {
  if (!ids.length) {
    return
  }
  visible.value = true
  formData.value = { ids: [...ids], schemeId: undefined }
  schemeType.value = undefined
  projectList.value = []
}
defineExpose({ open })

/** 切换参保方案 */
async function handleSchemeChange(scheme?: InsuranceScheme) {
  if (!scheme?.id) {
    projectList.value = []
    schemeType.value = undefined
    return
  }
  const detail = await getInsuranceScheme(scheme.id)
  schemeType.value = detail.type
  projectList.value = (detail.projectList || []).map(project => ({
    ...project,
    schemeProjectId: project.id,
  }))
}

/** 构建参保项目修改参数 */
function buildProjectUpdateList() {
  return projectList.value.map(project => ({
    schemeProjectId: project.schemeProjectId!,
    ...(schemeType.value === HrmInsuranceSchemeType.PROPORTION
      ? { baseAmount: project.baseAmount }
      : {
          corporateAmount: project.corporateAmount,
          personalAmount: project.personalAmount,
        }),
  }))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !formData.value.schemeId) {
    return
  }
  formLoading.value = true
  try {
    const schemeId = formData.value.schemeId
    const projects = buildProjectUpdateList()
    const hasSuccess = await executeBatch(
      formData.value.ids.map(id =>
        updateInsuranceMonthEmployeeRecord({
          id,
          schemeId,
          projects,
        }),
      ),
    )
    if (hasSuccess) {
      visible.value = false
      emit('success')
    }
  } finally {
    formLoading.value = false
  }
}
</script>
