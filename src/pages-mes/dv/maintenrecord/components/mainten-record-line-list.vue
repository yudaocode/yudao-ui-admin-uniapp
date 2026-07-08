<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        保养项目明细
      </view>
      <wd-button
        v-if="!readonly"
        size="small"
        type="primary"
        variant="plain"
        @click="openCreateForm"
      >
        添加明细
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无保养项目明细
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
            {{ item.subjectName || item.subjectCode || '-' }}
          </view>
          <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_MAINTEN_STATUS" :value="item.status" />
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目编码：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectCode || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目内容：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectContent || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">标准：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectStandard || '-' }}</text>
        </view>
        <view v-if="item.result" class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">异常描述：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.result }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
        <view v-if="!readonly" class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" size="small" type="warning" variant="plain" @click="openUpdateForm(item)">
            编辑
          </wd-button>
          <wd-button class="flex-1" size="small" type="danger" variant="plain" @click="handleDelete(item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>
  </view>

  <!-- 明细表单弹窗 -->
  <wd-popup
    v-model="formVisible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              title="保养项目"
              title-width="200rpx"
              prop="subjectId"
              is-link
              :value="selectedSubjectText"
              placeholder="请选择保养项目"
              @click="openSubjectPicker"
            />
            <yd-form-picker v-model="formData.status" label="保养结果" label-width="200rpx" prop="status" :dict-type="DICT_TYPE.MES_MAINTEN_STATUS" placeholder="请选择保养结果" />
            <wd-form-item title="异常描述" title-width="200rpx" prop="result">
              <wd-textarea v-model="formData.result" placeholder="请输入异常描述" :maxlength="300" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <SubjectPicker
    ref="subjectPickerRef"
    title="选择保养项目"
    :type="MesDvSubjectTypeEnum.MAINTENANCE"
    :existing-ids="existingSubjectIds"
    @confirm="handleSubjectConfirm"
  />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvSubject } from '@/api/mes/dv/subject'
import type { DvMaintenRecordLine } from '@/api/mes/dv/maintenrecord/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createMaintenRecordLine,
  deleteMaintenRecordLine,
  getMaintenRecordLinePage,
  updateMaintenRecordLine,
} from '@/api/mes/dv/maintenrecord/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE, MesDvMaintenStatusEnum, MesDvSubjectTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import SubjectPicker from '../../subject/components/subject-picker.vue'

const props = defineProps<{
  recordId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvMaintenRecordLine[]>([]) // 明细列表
const formVisible = ref(false) // 明细表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<DvMaintenRecordLine>(getDefaultFormData()) // 表单数据
const subjectPickerRef = ref<InstanceType<typeof SubjectPicker>>() // 项目选择器引用
const formTitle = computed(() => formData.value.id ? '编辑明细' : '添加明细')
const existingSubjectIds = computed(() => list.value
  .filter(item => item.id !== formData.value.id)
  .map(item => item.subjectId))
const selectedSubjectText = computed(() => {
  if (!formData.value.subjectId) {
    return ''
  }
  return `${formData.value.subjectCode || '-'} ${formData.value.subjectName || ''}`.trim()
})
const formSchema = createFormSchema({
  subjectId: [{ required: true, message: '保养项目不能为空' }],
  status: [{ required: true, message: '保养结果不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): DvMaintenRecordLine {
  return {
    recordId: props.recordId || 0,
    subjectId: undefined,
    status: MesDvMaintenStatusEnum.NORMAL,
    result: '',
    remark: '',
  }
}

/** 查询明细列表 */
async function getList() {
  if (!props.recordId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getMaintenRecordLinePage({
      pageNo: 1,
      pageSize: 100,
      recordId: props.recordId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: DvMaintenRecordLine) {
  formData.value = { ...item }
  formVisible.value = true
}

/** 打开项目选择器 */
function openSubjectPicker() {
  subjectPickerRef.value?.open()
}

/** 选择保养项目 */
function handleSubjectConfirm(item: DvSubject) {
  formData.value = {
    ...formData.value,
    subjectId: item.id,
    subjectCode: item.code,
    subjectName: item.name,
    subjectContent: item.content,
    subjectStandard: item.standard,
  }
}

/** 提交明细 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.recordId) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateMaintenRecordLine(formData.value)
      toast.success('修改成功')
    } else {
      await createMaintenRecordLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除明细 */
async function handleDelete(item: DvMaintenRecordLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.subjectName || item.subjectCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteMaintenRecordLine(item.id)
  toast.success('删除成功')
  await getList()
}

/** 监听记录编号变化 */
watch(
  () => props.recordId,
  () => {
    getList()
  },
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:dv:maintenrecord:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:dv:maintenrecord:reload', getList)
})
</script>
