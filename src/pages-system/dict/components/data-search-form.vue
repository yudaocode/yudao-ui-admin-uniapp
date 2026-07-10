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
      <DictTypeSearchPicker ref="dictTypePickerRef" v-model="formData.dictType" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          字典标签
        </view>
        <wd-input
          v-model="formData.label"
          placeholder="请输入字典标签"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
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
import { computed, reactive, ref, watch } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import DictTypeSearchPicker from '../type/components/dict-type-search-picker.vue'

const props = defineProps<{
  dictType?: string
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const formData = reactive({
  dictType: undefined as string | undefined,
  label: undefined as string | undefined,
  status: -1,
}) // 搜索表单数据
const visible = ref(false) // 搜索弹窗显示状态

const dictTypePickerRef = ref<InstanceType<typeof DictTypeSearchPicker>>() // 字典类型选择器

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.dictType) {
    conditions.push(`类型:${dictTypePickerRef.value?.format(formData.dictType) || formData.dictType}`)
  }
  if (formData.label) {
    conditions.push(`标签:${formData.label}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索字典数据'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    dictType: formData.dictType || undefined,
    label: formData.label || undefined,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.dictType = undefined
  formData.label = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 监听外部 dictType 变化 */
watch(
  () => props.dictType,
  (val) => {
    formData.dictType = val
  },
  { immediate: true },
)
</script>
