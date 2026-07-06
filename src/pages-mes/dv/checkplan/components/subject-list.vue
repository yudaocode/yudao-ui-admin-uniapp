<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        {{ subjectListTitle }}
      </view>
      <wd-button v-if="!readonly" size="small" type="primary" variant="plain" @click="openCreateForm">
        添加项目
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无关联项目
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
          <view class="shrink-0 text-24rpx text-[#999]">
            {{ item.subjectCode || '-' }}
          </view>
        </view>
        <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目类型：</text>
          <dict-tag v-if="item.subjectType != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.subjectType" />
          <text v-else>-</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目内容：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectContent || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">标准：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectStandard || '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
        <view v-if="!readonly" class="mt-16rpx flex justify-end">
          <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
            {{ deletingId === item.id ? '删除中...' : '删除' }}
          </wd-button>
        </view>
      </view>
    </view>
  </view>

  <!-- 添加项目弹窗 -->
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
          添加{{ subjectName }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              title="项目"
              title-width="200rpx"
              prop="subjectId"
              is-link
              :value="selectedSubjectText"
              :placeholder="`请选择${subjectName}`"
              @click="openSubjectPicker"
            />
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
    :title="`选择${subjectName}`"
    :type="props.type"
    :existing-ids="existingSubjectIds"
    @confirm="handleSubjectConfirm"
  />
</template>

<script lang="ts" setup>
import type { DvCheckPlanSubject } from '@/api/mes/dv/checkplan/subject'
import type { DvSubject } from '@/api/mes/dv/subject'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { create, deleteCheckPlanSubject, getListByPlan } from '@/api/mes/dv/checkplan/subject'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE, MesDvSubjectTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import SubjectPicker from '../../subject/components/subject-picker.vue'

const props = withDefaults(defineProps<{
  planId?: number
  type?: number
  readonly?: boolean
  showTitle?: boolean
}>(), {
  readonly: false,
  showTitle: true,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvCheckPlanSubject[]>([]) // 项目清单
const formVisible = ref(false) // 添加弹窗显示状态
const formLoading = ref(false) // 添加提交状态
const deletingId = ref<number>() // 删除中编号
const formRef = ref<FormInstance>() // 表单引用
const formData = ref({
  subjectId: undefined,
  remark: '',
}) // 添加表单数据
const selectedSubject = ref<DvSubject>() // 当前选择项目
const subjectPickerRef = ref<InstanceType<typeof SubjectPicker>>() // 项目选择器引用
const formSchema = createFormSchema({
  subjectId: [{ required: true, message: '项目不能为空' }],
})
const subjectName = computed(() => {
  if (props.type === MesDvSubjectTypeEnum.CHECK) {
    return '点检项目'
  }
  if (props.type === MesDvSubjectTypeEnum.MAINTENANCE) {
    return '保养项目'
  }
  return '项目'
})
const subjectListTitle = computed(() => `${subjectName.value}清单`)
const existingSubjectIds = computed(() => list.value.map(item => item.subjectId))
const selectedSubjectText = computed(() => {
  if (!selectedSubject.value) {
    return ''
  }
  return `${selectedSubject.value.code || '-'} ${selectedSubject.value.name || ''}`.trim()
})

/** 查询项目清单 */
async function getList() {
  if (!props.planId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

/** 打开添加弹窗 */
function openCreateForm() {
  formData.value = {
    subjectId: undefined,
    remark: '',
  }
  selectedSubject.value = undefined
  formVisible.value = true
}

/** 打开项目选择器 */
function openSubjectPicker() {
  subjectPickerRef.value?.open()
}

/** 确认选择项目 */
function handleSubjectConfirm(item: DvSubject) {
  selectedSubject.value = item
  formData.value.subjectId = item.id
}

/** 提交添加项目 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.planId || !formData.value.subjectId) {
    return
  }
  formLoading.value = true
  try {
    await create({
      planId: props.planId,
      subjectId: formData.value.subjectId,
      remark: formData.value.remark || undefined,
    })
    toast.success('添加成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除项目 */
async function handleDelete(item: DvCheckPlanSubject) {
  if (deletingId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除项目「${item.subjectName || item.subjectCode || item.id}」吗？`,
      confirmButtonText: '删除',
    })
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    await deleteCheckPlanSubject(item.id)
    toast.success('删除成功')
    await getList()
  } finally {
    deletingId.value = undefined
  }
}

/** 监听方案编号变化 */
watch(
  () => props.planId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
