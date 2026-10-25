<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">数据权限</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>

      <!-- 角色信息 -->
      <wd-cell-group border>
        <wd-cell title="角色名称" :value="role?.name || '-'" />
        <wd-cell title="角色标识" :value="role?.code || '-'" />
      </wd-cell-group>

      <!-- 权限范围 -->
      <wd-cell-group border class="mt-24rpx">
        <wd-cell
          title="权限范围"
          is-link
          :value="getWotPickerFormValue(dataScopeOptions, formData.dataScope)"
          placeholder="请选择权限范围"
          @click="pickerVisible.dataScope = true"
        />
        <wd-picker
          v-model:visible="pickerVisible.dataScope"
          :model-value="formData.dataScope"
          :columns="dataScopeOptions"
          @confirm="handleDataScopeConfirm"
        />
      </wd-cell-group>

      <!-- 部门范围 -->
      <view v-if="formData.dataScope === SystemDataScopeEnum.DEPT_CUSTOM" class="mt-24rpx">
        <wd-cell-group border>
          <wd-cell title="父子联动" center>
            <wd-switch v-model="treeLinkage" />
          </wd-cell>
        </wd-cell-group>
        <yd-tree-select
          ref="deptTreeRef"
          v-model="formData.dataScopeDeptIds"
          class="mt-24rpx"
          title="部门范围"
          placeholder="请选择部门范围"
          :data="deptOptions"
          :props="treeProps"
          :check-strictly="!treeLinkage"
          multiple
          filterable
          show-toolbar
        />
      </view>

      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="loading" :disabled="!canSubmit" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { isIdType, parseId } from '@/utils/id'

import type { Role } from '@/api/system/role'
import type { Dept } from '@/api/system/dept'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getSimpleDeptList } from '@/api/system/dept'
import { assignRoleDataScope } from '@/api/system/permission'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE, SystemDataScopeEnum } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { getWotPickerFormValue } from '@/utils/wot'

const props = defineProps<{
  modelValue: boolean
  role?: Role
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
}) // 数据权限弹窗显示状态
const loading = ref(false) // 表单提交状态
const dataLoaded = ref(false) // 权限加载状态
const deptLoaded = ref(false) // 部门加载状态
const deptList = ref<Dept[]>([]) // 部门列表
const deptTreeRef = ref<any>() // 部门树组件引用
const pickerVisible = ref({
  dataScope: false,
}) // 选择器显示状态
const formData = ref<{ dataScope?: number, dataScopeDeptIds: number[] }>({
  dataScope: undefined,
  dataScopeDeptIds: [],
}) // 表单数据
const treeLinkage = ref(true) // 部门树父子联动（关闭则父子独立勾选）
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const dataScopeOptions = computed(() => getIntDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE)) // 数据范围选项
const deptOptions = computed(() => handleTree(deptList.value)) // 部门树形选项
const canSubmit = computed(() => { // 是否允许提交
  if (!props.role?.id || !dataLoaded.value) {
    return false
  }
  if (formData.value.dataScope !== SystemDataScopeEnum.DEPT_CUSTOM) {
    return true
  }
  return deptLoaded.value && deptOptions.value.length > 0
})

/** 监听弹窗打开，加载数据 */
watch(
  () => props.modelValue,
  async (val) => {
    if (!val || !props.role?.id) {
      return
    }
    await loadData()
  },
)

/** 加载数据权限 */
async function loadData() {
  loading.value = true
  dataLoaded.value = false
  deptLoaded.value = false
  treeLinkage.value = true
  formData.value = {
    dataScope: props.role.dataScope,
    dataScopeDeptIds: props.role.dataScopeDeptIds || [],
  }
  dataLoaded.value = true
  try {
    if (deptList.value.length === 0) {
      deptList.value = await getSimpleDeptList()
    }
    deptLoaded.value = true
  } catch {
    deptLoaded.value = false
  } finally {
    loading.value = false
  }
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 选择权限范围 */
function handleDataScopeConfirm({ value }: { value: number[] }) {
  formData.value.dataScope = value[0]
}

/** 提交表单 */
async function handleConfirm() {
  if (!props.role?.id || !canSubmit.value) {
    return
  }
  loading.value = true
  try {
    const dataScopeDeptIds = formData.value.dataScope === SystemDataScopeEnum.DEPT_CUSTOM
      ? deptTreeRef.value.getCheckedKeys(false).map(parseId).filter(isIdType)
      : []
    await assignRoleDataScope({
      roleId: props.role.id,
      dataScope: formData.value.dataScope,
      dataScopeDeptIds,
    })
    toast.success('数据权限分配成功')
    handleClose()
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
