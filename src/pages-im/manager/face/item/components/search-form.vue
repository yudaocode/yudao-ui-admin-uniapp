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
      <PackSearchPicker
        ref="packPickerRef"
        v-model="formData.packId"
        :disabled="Boolean(props.packId)"
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          表情名
        </view>
        <wd-input v-model="formData.name" placeholder="请输入表情名" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.COMMON_STATUS" all-option />
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import PackSearchPicker from '../../pack/components/pack-search-picker.vue'

const props = defineProps<{
  packId?: number
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const packPickerRef = ref<InstanceType<typeof PackSearchPicker>>() // 表情包选择器
const formData = reactive({
  packId: props.packId,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.packId) {
    conditions.push(`表情包:${packPickerRef.value?.format(formData.packId) || formData.packId}`)
  }
  if (formData.name) {
    conditions.push(`表情名:${formData.name}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索表情'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    packId: formData.packId,
    name: formData.name || undefined,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.packId = props.packId
  formData.name = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
