<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="发送工资条"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="px-24rpx pt-16rpx">
      <wd-cell-group border>
        <yd-form-picker
          v-model="templateId"
          label="工资条模板"
          label-width="200rpx"
          :columns="templateColumns"
          placeholder="请选择模板"
        />
        <wd-cell title="隐藏空工资项" center>
          <wd-switch v-model="hideEmpty" />
        </wd-cell>
      </wd-cell-group>
      <view class="mt-16rpx text-24rpx text-[#999]">
        模板请在 PC 端维护；移动端仅选择模板、勾选员工后发送。
      </view>
    </view>

    <!-- 待发员工列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      class="min-h-0 flex-1"
      :fixed="false"
      :default-page-size="20"
      @query="queryList"
    >
      <view
        v-for="item in list"
        :key="item.employeeId"
        class="mx-24rpx mt-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="toggleEmployee(item)"
      >
        <view class="flex items-start gap-16rpx">
          <wd-checkbox
            :model-value="selectedIds.includes(item.employeeId)"
            @click.stop="toggleEmployee(item)"
          />
          <view class="min-w-0 flex-1">
            <view class="mb-8rpx flex items-center justify-between gap-16rpx">
              <text class="text-30rpx text-[#333] font-semibold">
                {{ item.employeeName || '-' }}
              </text>
              <text class="text-24rpx" :class="item.sent ? 'text-[#52c41a]' : 'text-[#999]'">
                {{ item.sent ? '已发送' : '未发送' }}
              </text>
            </view>
            <view class="text-26rpx text-[#666]">
              {{ item.jobNumber || '-' }} · {{ item.deptName || '-' }}
            </view>
            <view class="mt-8rpx text-26rpx text-[#666]">
              应发 {{ item.expectedPaySalary ?? '-' }} / 实发 {{ item.realPaySalary ?? '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 底部操作 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="handleSelectAllPage">
          全选本页
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit(false)">
          发放已选({{ selectedIds.length }})
        </wd-button>
        <wd-button class="flex-1" type="warning" :loading="formLoading" @click="handleSubmit(true)">
          全部发放
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalarySlipSendEmployee } from '@/api/hrm/salary/slip/send-record'
import type { SalarySlipTemplate } from '@/api/hrm/salary/slip/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  getSalarySlipSendEmployeePage,
  sendSalarySlip,
} from '@/api/hrm/salary/slip/send-record'
import { getSalarySlipTemplateList } from '@/api/hrm/salary/slip/template'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  monthRecordId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const list = ref<SalarySlipSendEmployee[]>([]) // 待发员工
const pagingRef = ref<any>() // 分页组件引用
const formLoading = ref(false) // 提交中
const templates = ref<SalarySlipTemplate[]>([]) // 模板列表
const templateId = ref<number>() // 选中模板
const hideEmpty = ref(true) // 隐藏空工资项
const selectedIds = ref<number[]>([]) // 已选员工
const queryParams = ref({ // 待发筛选，默认未发送对齐 PC
  sent: false as boolean | undefined,
})

const templateColumns = computed(() =>
  templates.value.map(item => ({ label: item.name, value: item.id! })),
)
const selectedTemplate = computed(() =>
  templates.value.find(item => item.id === templateId.value),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/month-record/index')
}

/** 查询待发员工 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.monthRecordId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getSalarySlipSendEmployeePage({
      pageNo,
      pageSize,
      monthRecordId: Number(props.monthRecordId),
      sent: queryParams.value.sent,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 切换员工选中 */
function toggleEmployee(item: SalarySlipSendEmployee) {
  const index = selectedIds.value.indexOf(item.employeeId)
  if (index >= 0) {
    selectedIds.value.splice(index, 1)
    return
  }
  selectedIds.value.push(item.employeeId)
}

/** 全选本页 */
function handleSelectAllPage() {
  const pageIds = list.value.map(item => item.employeeId)
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageIds]))
}

/** 提交发送 */
async function handleSubmit(all: boolean) {
  if (!props.monthRecordId) {
    return
  }
  if (!selectedTemplate.value?.options?.length) {
    toast.warning('请先选择工资条模板（无模板请在 PC 端维护）')
    return
  }
  if (!all && !selectedIds.value.length) {
    toast.warning('请选择待发员工')
    return
  }
  formLoading.value = true
  try {
    await sendSalarySlip({
      monthRecordId: Number(props.monthRecordId),
      hideEmpty: hideEmpty.value,
      options: selectedTemplate.value.options,
      all,
      employeeIds: all ? undefined : selectedIds.value,
      // 全部发放必须带当前筛选，避免已发员工被纳入后整单回滚
      sent: all ? queryParams.value.sent : undefined,
    })
    toast.success('发送成功')
    handleBack()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  templates.value = await getSalarySlipTemplateList()
  const defaultTemplate = templates.value.find(item => item.defaultStatus) || templates.value[0]
  templateId.value = defaultTemplate?.id
  hideEmpty.value = defaultTemplate?.hideEmpty ?? true
  if (!templates.value.length) {
    toast.warning('暂无工资条模板，请先在 PC 端维护')
  }
})
</script>
