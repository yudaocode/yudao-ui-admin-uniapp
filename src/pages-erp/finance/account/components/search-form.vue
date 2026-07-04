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
          账户名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入账户名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          账户编码
        </view>
        <wd-input v-model="formData.no" placeholder="请输入账户编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
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

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const formData = reactive({
  name: undefined as string | undefined,
  no: undefined as string | undefined,
  remark: undefined as string | undefined,
}) // 搜索表单数据
const visible = ref(false) // 搜索弹窗显示状态

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.no) {
    conditions.push(`编码:${formData.no}`)
  }
  if (formData.remark) {
    conditions.push(`备注:${formData.remark}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索结算账户'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    no: formData.no || undefined,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.no = undefined
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
