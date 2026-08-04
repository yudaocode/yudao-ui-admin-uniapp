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
      <yd-search-picker
        v-model="formData.planId"
        label="考核计划"
        :columns="planColumns"
        label-key="name"
        value-key="id"
        placeholder="请选择考核计划"
        filterable
        all-option
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
import type { PerformanceArchivePlan } from '@/api/hrm/performance/assessment'
import { computed, onMounted, reactive, ref } from 'vue'
import { getPerformanceArchivePlanSimpleList } from '@/api/hrm/performance/assessment'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const planList = ref<PerformanceArchivePlan[]>([]) // 归档计划列表
const formData = reactive({
  planId: undefined as number | undefined,
}) // 搜索表单数据

const planColumns = computed(() => planList.value.filter(item => item.id != null))
const placeholder = computed(() => {
  if (formData.planId == null) {
    return '搜索考核记录'
  }
  const plan = planList.value.find(item => item.id === formData.planId)
  return plan?.name ? `计划:${plan.name}` : '搜索考核记录'
})

/** 加载归档计划 */
async function loadPlanList() {
  planList.value = await getPerformanceArchivePlanSimpleList()
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    planId: formData.planId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.planId = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadPlanList()
})
</script>
