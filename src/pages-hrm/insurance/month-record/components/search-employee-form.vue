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
          员工姓名
        </view>
        <wd-input v-model="formData.employeeName" placeholder="请输入员工姓名" clearable />
      </view>
      <SchemeSearchPicker
        v-model="formData.schemeId"
        label="参保方案"
        placeholder="请选择参保方案"
      />
      <yd-tree-select
        v-model="formData.areaId"
        :data="areaTree"
        label="参保城市"
        placeholder="请选择参保城市"
        :use-default-slot="true"
      >
        <template #default="{ label: displayValue }">
          <view class="yd-search-form-item">
            <view class="yd-search-form-label">
              参保城市
            </view>
            <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx">
              <text class="min-w-0 flex-1 truncate" :class="displayValue ? 'text-[#333]' : 'text-[#999]'">
                {{ displayValue || '请选择参保城市' }}
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import SchemeSearchPicker from './scheme-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const areaTree = ref<Area[]>([]) // 地区树
const formData = reactive({
  employeeName: undefined as string | undefined,
  schemeId: undefined as number | undefined,
  areaId: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.employeeName) {
    conditions.push(`姓名:${formData.employeeName}`)
  }
  if (formData.schemeId !== undefined) {
    conditions.push('方案已选')
  }
  if (formData.areaId !== undefined) {
    conditions.push('城市已选')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索参保员工'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    employeeName: formData.employeeName || undefined,
    schemeId: formData.schemeId,
    areaId: formData.areaId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.employeeName = undefined
  formData.schemeId = undefined
  formData.areaId = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
})
</script>
