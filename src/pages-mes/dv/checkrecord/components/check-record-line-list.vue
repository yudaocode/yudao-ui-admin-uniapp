<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        点检项目明细
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
      暂无点检项目明细
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
          <view class="flex shrink-0 items-center gap-16rpx">
            <dict-tag v-if="item.checkStatus != null" :type="DICT_TYPE.MES_DV_CHECK_RESULT" :value="item.checkStatus" />
            <template v-if="!readonly">
              <wd-button size="small" variant="plain" @click.stop="openUpdateForm(item)">
                编辑
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
                删除
              </wd-button>
            </template>
          </view>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目编码：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectCode || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">检查内容：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectContent || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">检查标准：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectStandard || '-' }}</text>
        </view>
        <view v-if="item.checkResult" class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">异常描述：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.checkResult }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 明细表单弹窗 -->
  <wd-popup
    v-model="formVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
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
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              title="点检项目"
              title-width="200rpx"
              prop="subjectId"
              is-link
              :value="selectedSubjectText"
              placeholder="请选择点检项目"
              @click="openSubjectPicker"
            />
            <yd-form-picker v-model="formData.checkStatus" label="点检结果" label-width="200rpx" prop="checkStatus" :dict-type="DICT_TYPE.MES_DV_CHECK_RESULT" placeholder="请选择点检结果" />
            <wd-form-item
              v-if="formData.checkStatus === MesDvCheckResultEnum.ABNORMAL"
              title="异常描述"
              title-width="200rpx"
              prop="checkResult"
            >
              <wd-textarea v-model="formData.checkResult" placeholder="请输入异常描述" :maxlength="300" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="h-48rpx" />
      </scroll-view>
    </view>
  </wd-popup>
  <SubjectPicker
    ref="subjectPickerRef"
    title="选择点检项目"
    :type="MesDvSubjectTypeEnum.CHECK"
    :existing-ids="existingSubjectIds"
    @confirm="handleSubjectConfirm"
  />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvSubject } from '@/api/mes/dv/subject'
import type { DvCheckRecordLine } from '@/api/mes/dv/checkrecord/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import {
  createCheckRecordLine,
  deleteCheckRecordLine,
  getCheckRecordLinePage,
  updateCheckRecordLine,
} from '@/api/mes/dv/checkrecord/line'
import { DICT_TYPE, MesDvCheckResultEnum, MesDvSubjectTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import SubjectPicker from '../../subject/components/subject-picker.vue'

const props = defineProps<{
  recordId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvCheckRecordLine[]>([]) // 明细列表
const formVisible = ref(false) // 明细表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<DvCheckRecordLine>(getDefaultFormData()) // 表单数据
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
  subjectId: [{ required: true, message: '点检项目不能为空' }],
  checkStatus: [{ required: true, message: '点检结果不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): DvCheckRecordLine {
  return {
    recordId: props.recordId || 0,
    subjectId: undefined,
    checkStatus: MesDvCheckResultEnum.NORMAL,
    checkResult: '',
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
    const data = await getCheckRecordLinePage({
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
function openUpdateForm(item: DvCheckRecordLine) {
  formData.value = { ...item }
  formVisible.value = true
}

/** 打开项目选择器 */
function openSubjectPicker() {
  subjectPickerRef.value?.open()
}

/** 选择点检项目 */
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
    if (formData.value.checkStatus !== MesDvCheckResultEnum.ABNORMAL) {
      formData.value.checkResult = undefined
    }
    if (formData.value.id) {
      await updateCheckRecordLine(formData.value)
      toast.success('修改成功')
    } else {
      await createCheckRecordLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除明细 */
async function handleDelete(item: DvCheckRecordLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.subjectName || item.subjectCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteCheckRecordLine(item.id)
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
</script>
