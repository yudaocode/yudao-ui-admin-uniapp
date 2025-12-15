<template>
  <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;" @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">分配角色</text>
        <wd-icon name="close" size="20px" @click="handleClose" />
      </view>
      <wd-checkbox-group v-model="selectedIds" cell shape="button">
        <wd-checkbox v-for="item in roleList" :key="item.id" :model-value="item.id">
          {{ item.name }}
        </wd-checkbox>
      </wd-checkbox-group>
      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="loading" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Role } from '@/api/system/role'
import { computed, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSimpleRoleList } from '@/api/system/role'
import { assignUserRole, getUserRoleIds } from '@/api/system/user'

const props = defineProps<{
  modelValue: boolean
  userId: number | any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})
const loading = ref(false)
const roleList = ref<Role[]>([])
const selectedIds = ref<number[]>([])

/** 监听弹窗打开，加载数据 */
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      // 加载角色列表
      if (roleList.value.length === 0) {
        roleList.value = await getSimpleRoleList()
      }
      // 加载用户已有角色
      selectedIds.value = await getUserRoleIds(props.userId)
    }
  },
)

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 确认提交 */
async function handleConfirm() {
  loading.value = true
  try {
    await assignUserRole(props.userId, selectedIds.value)
    toast.success('角色分配成功')
    handleClose()
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
