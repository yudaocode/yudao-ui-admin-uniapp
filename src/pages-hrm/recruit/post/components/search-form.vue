<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-if="visible"
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          职位名称
        </view>
        <wd-input v-model="formData.postName" placeholder="请输入职位名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.jobNature"
        label="工作性质"
        :dict-type="DICT_TYPE.HRM_RECRUIT_JOB_NATURE"
        all-option
      />
      <yd-tree-select
        v-model="formData.areaId"
        :data="areaTree"
        label="工作城市"
        placeholder="请选择工作城市"
        :use-default-slot="true"
      >
        <template #default="{ label: displayValue }">
          <view class="yd-search-form-item">
            <view class="yd-search-form-label">
              工作城市
            </view>
            <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx">
              <text class="min-w-0 flex-1 truncate" :class="displayValue ? 'text-[#333]' : 'text-[#999]'">
                {{ displayValue || '请选择工作城市' }}
              </text>
              <wd-icon
                v-if="formData.areaId != null"
                name="close-circle"
                size="30rpx"
                custom-style="color: #c0c4cc;"
                @click.stop="formData.areaId = undefined"
              />
            </view>
          </view>
        </template>
      </yd-tree-select>
      <DeptSearchPicker
        v-model="formData.deptId"
        label="用人部门"
        placeholder="请选择用人部门"
      />
      <EmployeeSearchPicker
        v-model="formData.ownerEmployeeId"
        label="招聘负责人"
        placeholder="请选择招聘负责人"
        :entry-status="HrmEmployeeEntryStatus.ACTIVE"
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
import type { Area } from '@/api/system/area'
import { computed, onMounted, reactive, ref } from 'vue'
import { getAreaTree } from '@/api/system/area'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { HrmEmployeeEntryStatus } from '@/pages-hrm/utils/constants'
import { DeptSearchPicker } from '@/components/system-select'
import EmployeeSearchPicker from '@/pages-hrm/employee/components/employee-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const areaTree = ref<Area[]>([]) // 地区树
const formData = reactive({
  postName: undefined as string | undefined,
  jobNature: undefined as number | undefined,
  areaId: undefined as number | undefined,
  deptId: undefined as number | undefined,
  ownerEmployeeId: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.postName) {
    conditions.push(`职位:${formData.postName}`)
  }
  if (formData.jobNature !== undefined) {
    conditions.push(`性质:${getDictLabel(DICT_TYPE.HRM_RECRUIT_JOB_NATURE, formData.jobNature)}`)
  }
  if (formData.areaId !== undefined) {
    conditions.push('城市已选')
  }
  if (formData.deptId !== undefined) {
    conditions.push('部门已选')
  }
  if (formData.ownerEmployeeId !== undefined) {
    conditions.push('负责人已选')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索招聘职位'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    postName: formData.postName || undefined,
    jobNature: formData.jobNature,
    areaId: formData.areaId,
    deptId: formData.deptId,
    ownerEmployeeId: formData.ownerEmployeeId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.postName = undefined
  formData.jobNature = undefined
  formData.areaId = undefined
  formData.deptId = undefined
  formData.ownerEmployeeId = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
})
</script>
