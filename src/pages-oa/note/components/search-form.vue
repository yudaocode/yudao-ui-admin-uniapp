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
          标题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入标题"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          笔记类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_NOTE_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择笔记类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          优先级
        </view>
        <yd-search-picker
          v-model="formData.priority"
          :columns="priorityOptions"
          all-option
          all-label="全部优先级"
          placeholder="请选择优先级"
        />
      </view>
      <view v-if="showFavorite" class="yd-search-form-item">
        <view class="yd-search-form-label">
          收藏
        </view>
        <wd-radio-group v-model="formData.favorite" type="button">
          <wd-radio value="all">
            全部
          </wd-radio>
          <wd-radio :value="true">
            已收藏
          </wd-radio>
          <wd-radio :value="false">
            未收藏
          </wd-radio>
        </wd-radio-group>
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { OA_PRIORITY } from '../../utils/constants'

const props = defineProps<{
  showFavorite?: boolean // 是否展示收藏筛选（我的笔记）
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  title: undefined as string | undefined,
  type: undefined as number | undefined,
  priority: undefined as number | undefined,
  favorite: 'all' as boolean | 'all', // 'all' 为「全部」哨兵值，搜索时转为 undefined
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const priorityOptions = computed(() => // 笔记优先级只允许一般/重要，对齐后端 @Max(2)
  getIntDictOptions(DICT_TYPE.OA_PRIORITY).filter(item => Number(item.value) <= OA_PRIORITY.IMPORTANT))

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.OA_NOTE_TYPE, formData.type)}`)
  }
  if (formData.priority !== undefined) {
    conditions.push(`优先级:${getDictLabel(DICT_TYPE.OA_PRIORITY, formData.priority)}`)
  }
  if (props.showFavorite && formData.favorite !== 'all') {
    conditions.push(`收藏:${formData.favorite ? '已收藏' : '未收藏'}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索笔记'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    title: formData.title || undefined,
    type: formData.type,
    priority: formData.priority,
    favorite: props.showFavorite && formData.favorite !== 'all' ? formData.favorite : undefined,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.title = undefined
  formData.type = undefined
  formData.priority = undefined
  formData.favorite = 'all'
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
