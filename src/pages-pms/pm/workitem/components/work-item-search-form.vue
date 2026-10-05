<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <scroll-view scroll-y class="yd-search-form-container max-h-70vh">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          标题
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="搜索标题或编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          数据范围
        </view>
        <wd-radio-group v-model="formData.lifecycleStatus" type="button">
          <wd-radio :value="PmsWorkItemLifecycleStatus.ACTIVE">
            当前
          </wd-radio>
          <wd-radio :value="PmsWorkItemLifecycleStatus.ARCHIVED">
            已归档
          </wd-radio>
          <wd-radio :value="PmsWorkItemLifecycleStatus.RECYCLED">
            回收站
          </wd-radio>
        </wd-radio-group>
      </view>
      <yd-search-picker
        v-if="!type"
        v-model="formData.types"
        label="事项类型"
        :columns="typeColumns"
        type="checkbox"
        placeholder="全部类型"
      />
      <yd-search-picker
        v-model="formData.statuses"
        label="语义状态"
        :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
        type="checkbox"
        placeholder="全部状态"
      />
      <yd-search-picker
        v-model="formData.priorities"
        label="优先级"
        :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
        type="checkbox"
        placeholder="全部优先级"
      />
      <template v-if="projectType === PmsProjectType.AGILE && !iterationId">
        <yd-search-picker
          v-model="formData.iterationIds"
          label="所属迭代"
          :columns="iterationColumns"
          type="checkbox"
          placeholder="全部迭代"
          filterable
        />
        <yd-search-picker
          v-model="formData.excludedIterationIds"
          label="排除迭代"
          :columns="iterationColumns"
          type="checkbox"
          placeholder="不显示所选迭代"
          filterable
        />
      </template>
      <ProjectMemberSearchPicker
        v-model="formData.assigneeUserIds"
        :project-id="projectId"
        type="checkbox"
        all-label="全部负责人"
      />
      <WorkItemLabelSearchPicker v-model="formData.labelIds" />
      <view v-if="!type && !iterationId" class="yd-search-form-item">
        <view class="yd-search-form-label">
          未规划事项
        </view>
        <wd-switch v-model="formData.unplannedOnly" />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </scroll-view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import { computed, reactive, ref, watch } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getIterationPage } from '@/api/pms/pm/iteration'
import ProjectMemberSearchPicker from '@/pages-pms/pm/project/components/project-member-search-picker.vue'
import WorkItemLabelSearchPicker from '@/pages-pms/pm/workitem/components/work-item-label-search-picker.vue'
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemType,
} from '@/pages-pms/pm/utils/constants'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { getAllPageItems } from '@/utils/page'

const props = withDefaults(
  defineProps<{
    projectId: number
    projectType: number
    type?: number // 工作项类型；为空表示全部事项
    iterationId?: number // 所属迭代编号；传入后隐藏迭代筛选
  }>(),
  {
    type: undefined,
    iterationId: undefined,
  },
)

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const iterations = ref<Iteration[]>([]) // 迭代选项来源
const formData = reactive({
  name: undefined as string | undefined,
  lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE as number,
  types: [] as number[],
  statuses: [] as number[],
  priorities: [] as number[],
  iterationIds: [] as number[],
  excludedIterationIds: [] as number[],
  assigneeUserIds: [] as number[],
  labelIds: [] as number[],
  unplannedOnly: false,
}) // 搜索表单数据

const typeColumns = computed(() =>
  // 事项类型选项：通用项目只有任务
  getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)
    .filter(
      item =>
        props.projectType === PmsProjectType.AGILE
        || item.value === PmsWorkItemType.TASK,
    )
    .map(item => ({ ...item })),
)
const iterationColumns = computed(() =>
  iterations.value.map(item => ({ label: item.name, value: item.id })),
) // 迭代选项

const placeholder = computed(() => {
  // 搜索条件 placeholder 拼接
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`标题:${formData.name}`)
  }
  if (formData.lifecycleStatus !== PmsWorkItemLifecycleStatus.ACTIVE) {
    conditions.push(
      formData.lifecycleStatus === PmsWorkItemLifecycleStatus.ARCHIVED
        ? '已归档'
        : '回收站',
    )
  }
  if (formData.statuses.length) {
    conditions.push(`状态:${formData.statuses.length}项`)
  }
  if (formData.priorities.length) {
    conditions.push(`优先级:${formData.priorities.length}项`)
  }
  if (formData.iterationIds.length) {
    conditions.push(`迭代:${formData.iterationIds.length}项`)
  }
  if (formData.excludedIterationIds.length) {
    conditions.push(`排除迭代:${formData.excludedIterationIds.length}项`)
  }
  if (formData.assigneeUserIds.length) {
    conditions.push(`负责人:${formData.assigneeUserIds.length}人`)
  }
  if (formData.labelIds.length) {
    conditions.push(`标签:${formData.labelIds.length}项`)
  }
  if (formData.unplannedOnly) {
    conditions.push('只显示未规划事项')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索标题或编号'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    lifecycleStatus: formData.lifecycleStatus,
    types: formData.types.length ? formData.types : undefined,
    statuses: formData.statuses.length ? formData.statuses : undefined,
    priorities: formData.priorities.length ? formData.priorities : undefined,
    iterationIds: formData.iterationIds.length
      ? formData.iterationIds
      : undefined,
    excludedIterationIds: formData.excludedIterationIds.length
      ? formData.excludedIterationIds
      : undefined,
    assigneeUserIds: formData.assigneeUserIds.length
      ? formData.assigneeUserIds
      : undefined,
    labelIds: formData.labelIds.length ? formData.labelIds : undefined,
    unplannedOnly: formData.unplannedOnly || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.lifecycleStatus = PmsWorkItemLifecycleStatus.ACTIVE
  formData.types = []
  formData.statuses = []
  formData.priorities = []
  formData.iterationIds = []
  formData.excludedIterationIds = []
  formData.assigneeUserIds = []
  formData.labelIds = []
  formData.unplannedOnly = false
  visible.value = false
  emit('reset')
}

/** 项目变化时加载迭代选项 */
watch(
  () => props.projectId,
  async (projectId) => {
    iterations.value = projectId
      ? await getAllPageItems((pageNo, pageSize) =>
          getIterationPage({ pageNo, pageSize, projectId }),
        )
      : []
  },
  { immediate: true },
)
</script>
