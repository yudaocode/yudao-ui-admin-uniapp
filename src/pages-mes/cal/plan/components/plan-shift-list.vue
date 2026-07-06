<template>
  <view class="mt-24rpx bg-white">
    <!-- 班次标题 -->
    <view class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        班次
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openForm()">
        添加班次
      </wd-button>
    </view>

    <!-- 班次列表 -->
    <view class="px-24rpx pb-8rpx">
      <wd-loading v-if="loading" />
      <view v-else-if="list.length === 0" class="py-48rpx text-center text-26rpx text-[#999]">
        暂无班次
      </view>
      <template v-else>
        <view v-for="item in list" :key="item.id" class="mb-20rpx rounded-12rpx bg-[#f8fafc] p-20rpx">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.sort }}. {{ item.name }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.startTime }} - {{ item.endTime }}
              </view>
            </view>
            <view v-if="editable" class="flex shrink-0 gap-16rpx">
              <wd-button size="small" type="warning" variant="plain" @click="openForm(item)">
                编辑
              </wd-button>
              <wd-button v-if="item.id" size="small" type="danger" variant="plain" @click="handleDelete(item)">
                删除
              </wd-button>
            </view>
          </view>
          <view class="text-26rpx text-[#666]">
            备注：{{ item.remark || '-' }}
          </view>
        </view>
      </template>
    </view>

    <!-- 班次弹层 -->
    <wd-popup v-model="formVisible" position="bottom" :safe-area-inset-bottom="true">
      <view class="max-h-[86vh] flex flex-col bg-white">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">
            {{ formData.id ? '编辑班次' : '添加班次' }}
          </text>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="顺序" title-width="180rpx" prop="sort" center>
                <wd-input-number v-model="formData.sort" :min="1" :precision="0" />
              </wd-form-item>
              <wd-form-item title="班次名称" title-width="180rpx" prop="name">
                <wd-input v-model="formData.name" placeholder="请输入班次名称" clearable />
              </wd-form-item>
              <wd-form-item title="开始时间" title-width="180rpx" prop="startTime">
                <wd-input v-model="formData.startTime" placeholder="例如 08:00" clearable />
              </wd-form-item>
              <wd-form-item title="结束时间" title-width="180rpx" prop="endTime">
                <wd-input v-model="formData.endTime" placeholder="例如 18:00" clearable />
              </wd-form-item>
              <wd-form-item title="备注" title-width="180rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </scroll-view>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalPlanShift } from '@/api/mes/cal/plan/shift'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref, watch } from 'vue'
import { createPlanShift, deletePlanShift, getPlanShiftListByPlan, updatePlanShift } from '@/api/mes/cal/plan/shift'
import { createFormSchema } from '@/utils/wot'

const props = withDefaults(defineProps<{
  planId?: number
  editable?: boolean
}>(), {
  planId: undefined,
  editable: false,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 班次加载状态
const list = ref<CalPlanShift[]>([]) // 班次列表
const formVisible = ref(false) // 表单弹层显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = reactive<CalPlanShift>({
  id: undefined,
  planId: 0,
  sort: 1,
  name: '',
  startTime: '',
  endTime: '',
  remark: undefined,
}) // 班次表单
const formSchema = createFormSchema({
  sort: [{ required: true, message: '顺序不能为空' }],
  name: [{ required: true, message: '班次名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
})

/** 查询班次列表 */
async function getList() {
  if (!props.planId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getPlanShiftListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

/** 打开班次表单 */
function openForm(row?: CalPlanShift) {
  if (!props.planId) {
    toast.warning('请先保存排班计划后再维护班次')
    return
  }
  formData.id = row?.id
  formData.planId = props.planId
  formData.sort = row?.sort ?? list.value.length + 1
  formData.name = row?.name || ''
  formData.startTime = row?.startTime || ''
  formData.endTime = row?.endTime || ''
  formData.remark = row?.remark
  formRef.value?.reset()
  formVisible.value = true
}

/** 保存班次 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.planId) {
    return
  }

  formLoading.value = true
  try {
    if (formData.id) {
      await updatePlanShift(formData)
      toast.success('修改成功')
    } else {
      await createPlanShift(formData)
      toast.success('新增成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除班次 */
async function handleDelete(item: CalPlanShift) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${item.name}」班次吗？`,
    })
  } catch {
    return
  }
  await deletePlanShift(item.id)
  toast.success('删除成功')
  await getList()
}

/** 监听计划编号变化 */
watch(
  () => props.planId,
  () => getList(),
  { immediate: true },
)
</script>
