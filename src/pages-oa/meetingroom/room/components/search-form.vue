<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索会议室" hide-cancel disabled />
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
          会议室名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入会议室名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          位置
        </view>
        <wd-input
          v-model="formData.location"
          placeholder="请输入位置"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          负责人
        </view>
        <wd-input
          v-model="formData.managerName"
          placeholder="请输入负责人"
          clearable
        />
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
import { reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  location: undefined as string | undefined,
  managerName: undefined as string | undefined,
  name: undefined as string | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    location: formData.location || undefined,
    managerName: formData.managerName || undefined,
    name: formData.name || undefined,
    type: formData.type,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.location = undefined
  formData.managerName = undefined
  formData.name = undefined
  formData.type = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
