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
          名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入名称"
          clearable
        />
      </view>
      <view v-if="showCategory" class="yd-search-form-item">
        <view class="yd-search-form-label">
          文件分类
        </view>
        <yd-search-picker
          v-model="formData.category"
          :columns="categoryOptions"
          all-option
          all-label="全部分类"
          placeholder="请选择文件分类"
        />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import { OA_FILE_CATEGORY } from '../../utils/constants'

const props = defineProps<{
  showCategory?: boolean // 是否展示文件分类筛选（回收站不按分类过滤）
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: undefined as string | undefined,
  category: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const categoryOptions = computed(() => // 文件分类选项，去掉「全部」字典项避免与 all-option 重复
  getIntDictOptions(DICT_TYPE.OA_FILE_CATEGORY).filter(item => item.value !== OA_FILE_CATEGORY.ALL))

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (props.showCategory && formData.category !== undefined) {
    conditions.push('已选分类')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索文件'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    category: props.showCategory ? formData.category : undefined,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.category = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
