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
    <!-- 维修项目明细列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      :auto="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多维修项目明细了"
      empty-view-text="暂无维修项目明细"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx">
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
    </z-paging>
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createRepairLine,
  deleteRepairLine,
  getRepairLineListByRepairId,
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
const list = ref<DvRepairLine[]>([]) // 明细列表
const pagingRef = ref<ZPagingRef<DvRepairLine>>() // 分页组件引用
const formVisible = ref(false) // 明细表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<DvRepairLine>(getDefaultFormData()) // 表单数据
const subjectPickerRef = ref<InstanceType<typeof SubjectPicker>>() // 项目选择器引用
const existingSubjectIds = ref<number[]>([]) // 已关联项目编号
const formTitle = computed(() => formData.value.id ? '编辑明细' : '添加明细')
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
async function queryList(pageNo: number, pageSize: number) {
  if (!props.repairId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getRepairLinePage({
      pageNo,
      pageSize,
      repairId: props.repairId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新明细列表 */
function reload() {
  pagingRef.value?.reload()
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

/** 加载已关联项目编号 */
async function loadExistingSubjectIds() {
  const repairId = props.repairId
  if (!repairId) {
    existingSubjectIds.value = []
    return
  }
  const lines = await getRepairLineListByRepairId(repairId)
  const subjectIds = lines
    .filter(line => line.id !== formData.value.id)
    .map(line => line.subjectId)
    .filter((subjectId): subjectId is number => typeof subjectId === 'number')
  existingSubjectIds.value = Array.from(new Set(subjectIds))
}

/** 打开项目选择器 */
async function openSubjectPicker() {
  await loadExistingSubjectIds()
  await nextTick()
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
    reload()
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
  reload()
}

/** 监听维修编号变化 */
watch(
  () => props.repairId,
  async () => {
    await nextTick()
    reload()
  },
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:dv:repair:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:dv:repair:reload', reload)
})
</script>
