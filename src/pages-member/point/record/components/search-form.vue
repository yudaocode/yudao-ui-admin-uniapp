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
          用户昵称
        </view>
        <wd-input v-model="formData.nickname" placeholder="请输入用户昵称" clearable />
      </view>
      <yd-search-picker v-model="formData.bizType" label="业务类型" :dict-type="DICT_TYPE.MEMBER_POINT_BIZ_TYPE" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          积分标题
        </view>
        <wd-input v-model="formData.title" placeholder="请输入积分标题" clearable />
      </view>
      <yd-search-date-range v-model="formData.createDate" label="获得时间" />
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
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  nickname: undefined as string | undefined,
  bizType: undefined as number | undefined,
  title: undefined as string | undefined,
  createDate: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.nickname) {
    conditions.push(`用户:${formData.nickname}`)
  }
  if (formData.bizType !== undefined) {
    conditions.push(`业务类型:${getDictLabel(DICT_TYPE.MEMBER_POINT_BIZ_TYPE, formData.bizType)}`)
  }
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.createDate[0] && formData.createDate[1]) {
    conditions.push(`获得:${formatDate(formData.createDate[0])}~${formatDate(formData.createDate[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索积分记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    bizType: formData.bizType,
    createDate: formatDateRange(formData.createDate),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.nickname = undefined
  formData.bizType = undefined
  formData.title = undefined
  formData.createDate = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
