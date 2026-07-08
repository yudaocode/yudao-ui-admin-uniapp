<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        维修项目明细
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
      暂无维修项目明细
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
            {{ item.subjectName || `明细 #${item.id}` }}
          </view>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目内容：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectContent || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">标准：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectStandard || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">故障描述：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.malfunction || '-' }}</text>
        </view>
        <view v-if="item.malfunctionUrl" class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">故障图片：</text>
          <wd-img
            :src="item.malfunctionUrl"
            width="96rpx"
            height="96rpx"
            radius="8rpx"
            mode="aspectFill"
            enable-preview
          />
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">维修描述：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.description || '-' }}</text>
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
              title="维修项目"
              title-width="200rpx"
              prop="subjectId"
              is-link
              :value="selectedSubjectText"
              placeholder="请选择维修项目"
              @click="openSubjectPicker"
            />
            <wd-form-item title="故障描述" title-width="200rpx" prop="malfunction">
              <wd-textarea v-model="formData.malfunction" placeholder="请输入故障描述" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="故障图片" title-width="200rpx" prop="malfunctionUrl">
              <yd-upload-img v-model="formData.malfunctionUrl" directory="mes/dv/repair" />
            </wd-form-item>
            <wd-form-item title="维修描述" title-width="200rpx" prop="description">
              <wd-textarea v-model="formData.description" placeholder="请输入维修描述" :maxlength="500" show-word-limit clearable />
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
    title="选择维修项目"
    :existing-ids="existingSubjectIds"
    @confirm="handleSubjectConfirm"
  />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvSubject } from '@/api/mes/dv/subject'
import type { DvRepairLine } from '@/api/mes/dv/repair/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createRepairLine,
  deleteRepairLine,
  getRepairLinePage,
  updateRepairLine,
} from '@/api/mes/dv/repair/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import SubjectPicker from '../../subject/components/subject-picker.vue'

const props = defineProps<{
  repairId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvRepairLine[]>([]) // 明细列表
const formVisible = ref(false) // 明细表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<DvRepairLine>(getDefaultFormData()) // 表单数据
const subjectPickerRef = ref<InstanceType<typeof SubjectPicker>>() // 项目选择器引用
const formTitle = computed(() => formData.value.id ? '编辑明细' : '添加明细')
const existingSubjectIds = computed(() => list.value
  .filter(item => item.id !== formData.value.id && item.subjectId != null)
  .map(item => item.subjectId))
const selectedSubjectText = computed(() => {
  if (!formData.value.subjectId) {
    return ''
  }
  return formData.value.subjectName || ''
})
const formSchema = createFormSchema({
  malfunction: [{ required: true, message: '故障描述不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): DvRepairLine {
  return {
    repairId: props.repairId || 0,
    subjectId: undefined,
    malfunction: '',
    malfunctionUrl: '',
    description: '',
    remark: '',
  }
}

/** 查询明细列表 */
async function getList() {
  if (!props.repairId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getRepairLinePage({
      pageNo: 1,
      pageSize: 100,
      repairId: props.repairId,
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
function openUpdateForm(item: DvRepairLine) {
  formData.value = { ...item }
  formVisible.value = true
}

/** 打开项目选择器 */
function openSubjectPicker() {
  subjectPickerRef.value?.open()
}

/** 选择维修项目 */
function handleSubjectConfirm(item: DvSubject) {
  formData.value = {
    ...formData.value,
    subjectId: item.id,
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
  if (!props.repairId) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateRepairLine(formData.value)
      toast.success('修改成功')
    } else {
      await createRepairLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除明细 */
async function handleDelete(item: DvRepairLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.subjectName || item.malfunction || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteRepairLine(item.id)
  toast.success('删除成功')
  await getList()
}

/** 监听维修编号变化 */
watch(
  () => props.repairId,
  () => {
    getList()
  },
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:dv:repair:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:dv:repair:reload', getList)
})
</script>
