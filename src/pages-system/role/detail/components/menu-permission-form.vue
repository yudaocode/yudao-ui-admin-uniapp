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
        <text class="text-32rpx text-[#333] font-semibold">菜单权限</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>

      <!-- 角色信息 -->
      <wd-cell-group border>
        <wd-cell title="角色名称" :value="role?.name || '-'" />
        <wd-cell title="角色标识" :value="role?.code || '-'" />
      </wd-cell-group>

      <!-- 菜单权限 -->
      <view class="mt-24rpx">
        <yd-tree-select
          ref="menuTreeRef"
          v-model="selectedMenuIds"
          title="菜单权限"
          placeholder="请选择菜单权限"
          :data="menuOptions"
          :props="treeProps"
          :check-strictly="false"
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
import type { Menu } from '@/api/system/menu'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getSimpleMenuList } from '@/api/system/menu'
import { assignRoleMenu, getRoleMenuList } from '@/api/system/permission'
import { handleTree } from '@/utils/tree'

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
}) // 菜单权限弹窗显示状态
const loading = ref(false) // 表单提交状态
const loadSucceeded = ref(false) // 权限加载状态
const menuList = ref<Menu[]>([]) // 菜单列表
const selectedMenuIds = ref<number[]>([]) // 已选菜单编号
const menuTreeRef = ref<any>() // 菜单树组件引用
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const menuOptions = computed(() => handleTree(menuList.value)) // 菜单树形选项
const canSubmit = computed(() => loadSucceeded.value && menuOptions.value.length > 0) // 是否允许提交

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

/** 加载菜单权限 */
async function loadData() {
  loading.value = true
  loadSucceeded.value = false
  try {
    const [menus, menuIds] = await Promise.all([
      menuList.value.length === 0 ? getSimpleMenuList() : Promise.resolve(menuList.value),
      getRoleMenuList(props.role.id),
    ])
    menuList.value = menus
    selectedMenuIds.value = menuIds
    loadSucceeded.value = true
  } catch {
    selectedMenuIds.value = []
  } finally {
    loading.value = false
  }
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 提交表单 */
async function handleConfirm() {
  if (!props.role?.id || !canSubmit.value) {
    return
  }
  loading.value = true
  try {
    const menuIds = [
      ...menuTreeRef.value.getCheckedKeys(false).map(parseId).filter(isIdType),
      ...menuTreeRef.value.getHalfCheckedKeys().map(parseId).filter(isIdType),
    ]
    await assignRoleMenu({
      roleId: props.role.id,
      menuIds,
    })
    toast.success('菜单权限分配成功')
    handleClose()
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
