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
      <PropertySearchPicker
        v-if="propertyId == null"
        ref="propertyPickerRef"
        v-model="formData.propertyId"
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          属性值
        </view>
        <wd-input v-model="formData.name" placeholder="请输入属性值" clearable />
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
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import PropertySearchPicker from '../components/property-search-picker.vue'

defineProps<{
  propertyId?: number // 限定属性时隐藏所属属性筛选
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const propertyPickerRef = ref<InstanceType<typeof PropertySearchPicker>>() // 属性选择器
const formData = reactive({
  propertyId: undefined as number | undefined,
  name: undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.propertyId != null) {
    conditions.push(`属性:${propertyPickerRef.value?.format(formData.propertyId) || formData.propertyId}`)
  }
  if (formData.name) {
    conditions.push(`属性值:${formData.name}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索属性值'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    propertyId: formData.propertyId ?? undefined,
    name: formData.name || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.propertyId = undefined
  formData.name = undefined
  visible.value = false
  emit('reset')
}
</script>
