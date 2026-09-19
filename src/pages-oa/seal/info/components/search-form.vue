<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索印章" hide-cancel disabled />
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
          印章编码
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入印章编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          印章名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入印章名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          印章类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_SEAL_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择印章类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          印章分类
        </view>
        <yd-search-picker
          v-model="formData.category"
          :columns="getIntDictOptions(DICT_TYPE.OA_SEAL_CATEGORY)"
          all-option
          all-label="全部分类"
          placeholder="请选择印章分类"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          印章状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_SEAL_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择印章状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          所属部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择所属部门" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          保管人
        </view>
        <UserSearchPicker v-model="formData.keeperUserId" placeholder="请选择保管人" />
      </view>
      <yd-search-date-range v-model="formData.purchaseTime" label="购入时间" />
      <yd-search-date-range v-model="formData.enableTime" label="启用时间" />
      <yd-search-date-range v-model="formData.disableTime" label="停用时间" />
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
import { DeptSearchPicker, UserSearchPicker } from '@/components/system-select'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  deptId: undefined as number | undefined,
  keeperUserId: undefined as number | undefined,
  purchaseTime: [undefined, undefined] as [number | undefined, number | undefined],
  enableTime: [undefined, undefined] as [number | undefined, number | undefined],
  disableTime: [undefined, undefined] as [number | undefined, number | undefined],
  no: undefined as string | undefined,
  name: undefined as string | undefined,
  type: undefined as number | undefined,
  category: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    deptId: formData.deptId,
    keeperUserId: formData.keeperUserId,
    purchaseTime: formatDateRange(formData.purchaseTime),
    enableTime: formatDateRange(formData.enableTime),
    disableTime: formatDateRange(formData.disableTime),
    no: formData.no || undefined,
    name: formData.name || undefined,
    type: formData.type,
    category: formData.category,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.deptId = undefined
  formData.keeperUserId = undefined
  formData.purchaseTime = [undefined, undefined]
  formData.enableTime = [undefined, undefined]
  formData.disableTime = [undefined, undefined]
  formData.no = undefined
  formData.name = undefined
  formData.type = undefined
  formData.category = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
