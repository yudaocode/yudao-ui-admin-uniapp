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
          SN 码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入 SN 码" clearable />
      </view>
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="物料" placeholder="请选择物料" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input
          v-model="formData.batchCode"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <yd-search-date-range v-model="createTimeRange" label="创建时间" />
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
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateRange } from '@/utils/date'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const createTimeRange = ref<[number | undefined, number | undefined]>() // 创建时间范围
const formData = reactive<Record<string, any>>({
  code: '',
  itemId: undefined,
  batchCode: '',
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`SN 码:${formData.code}`)
  }
  if (formData.itemId) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次号:${formData.batchCode}`)
  }
  if (createTimeRange.value?.length === 2) {
    conditions.push('创建时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索 SN 码'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    itemId: formData.itemId,
    batchCode: formData.batchCode || undefined,
    createTime: formatDateRange(createTimeRange.value),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.itemId = undefined
  formData.batchCode = ''
  createTimeRange.value = undefined
  visible.value = false
  emit('reset')
}
</script>
