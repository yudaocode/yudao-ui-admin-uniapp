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
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          项目名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入项目名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.sortType"
        label="排序方式"
        :columns="sortTypeOptions"
      />
      <yd-search-picker
        v-if="isParticipatedScene"
        v-model="formData.groupId"
        label="个人分组"
        :columns="groupColumns"
      />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ProjectGroup } from '@/api/pms/pm/project/group'
import { computed, reactive, ref, watch } from 'vue'
import { PmsProjectGroupType, PmsProjectSortType } from '@/pages-pms/pm/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const props = withDefaults(defineProps<{
  isParticipatedScene?: boolean // 是否「我参与的」场景，决定是否展示个人分组筛选
  groups?: ProjectGroup[] // 个人分组选项
}>(), {
  isParticipatedScene: false,
  groups: () => [],
})

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: undefined as string | undefined,
  sortType: PmsProjectSortType.ACCESS_TIME as number,
  groupId: undefined as number | undefined,
}) // 搜索表单数据

const sortTypeOptions = [ // 排序方式选项
  { label: '按访问时间', value: PmsProjectSortType.ACCESS_TIME },
  { label: '按创建时间', value: PmsProjectSortType.CREATE_TIME },
]
const groupColumns = computed(() => props.groups.map(item => ({
  label: `${item.name}（${item.projectCount ?? 0}）`,
  value: item.id,
}))) // 个人分组选项

const placeholder = computed(() => { // 搜索条件 placeholder 拼接
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`项目名称:${formData.name}`)
  }
  if (formData.sortType !== PmsProjectSortType.ACCESS_TIME) {
    conditions.push('按创建时间')
  }
  if (props.isParticipatedScene && formData.groupId !== undefined) {
    const group = props.groups.find(item => item.id === formData.groupId)
    if (group) {
      conditions.push(`分组:${group.name}`)
    }
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索项目名称'
})

/** 参与场景下同步默认分组（全部） */
watch(() => [props.isParticipatedScene, props.groups], () => {
  if (props.isParticipatedScene && formData.groupId === undefined && props.groups.length > 0) {
    // 默认选中「全部」分组，不依赖后端返回顺序
    formData.groupId = props.groups.find(item => item.type === PmsProjectGroupType.ALL)?.id ?? props.groups[0]?.id
  }
}, { immediate: true })

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    sortType: formData.sortType,
    groupId: props.isParticipatedScene ? formData.groupId : undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.sortType = PmsProjectSortType.ACCESS_TIME
  formData.groupId = props.groups.find(item => item.type === PmsProjectGroupType.ALL)?.id ?? props.groups[0]?.id
  visible.value = false
  emit('reset')
}
</script>
