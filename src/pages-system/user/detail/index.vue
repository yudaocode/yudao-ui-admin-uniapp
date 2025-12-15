<template>
  <view class="min-h-screen bg-[#f5f5f5]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用户详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="头像">
          <view v-if="formData?.avatar" class="h-80rpx w-80rpx overflow-hidden rounded-full">
            <image :src="formData.avatar" class="h-full w-full" mode="aspectFill" />
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="用户昵称" :value="formData?.nickname || '-'" />
        <wd-cell title="用户账号" :value="formData?.username || '-'" />
        <wd-cell title="手机号码" :value="formData?.mobile || '-'" />
        <wd-cell title="邮箱" :value="formData?.email || '-'" />
        <wd-cell title="部门" :value="formData?.deptName || '-'" />
        <wd-cell title="性别">
          <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="formData?.sex" />
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.sex" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="最后登录 IP" :value="formData?.loginIp || '-'" />
        <wd-cell title="最后登录时间" :value="formatDateTime(formData?.loginDate) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:user:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:user:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="hasMoreActions"
          class="flex-1" type="info" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
    <!-- 重置密码弹窗 -->
    <PasswordForm v-model="passwordFormVisible" :user-id="Number(props.id)" @success="getDetail" />
    <!-- 分配角色弹窗 -->
    <RoleAssignForm v-model="roleAssignFormVisible" :user-id="Number(props.id)" @success="getDetail" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteUser, getUser, updateUserStatus } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PasswordForm from './components/password-form.vue'
import RoleAssignForm from './components/role-assign-form.vue'
import { navigateBackPlus } from '@/utils';

const props = defineProps<{
  id: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<User>() // 详情数据
const deleting = ref(false) // 删除中
const moreActionVisible = ref(false) // 更多操作菜单
const passwordFormVisible = ref(false) // 密码表单弹窗
const roleAssignFormVisible = ref(false) // 角色分配弹窗
const moreActions = computed(() => {
  const actions = []
  // 修改状态权限
  if (hasAccessByCodes(['system:user:update'])) {
    actions.push({ name: formData.value?.status === 1 ? '禁用用户' : '开启用户', value: 'update-status' })
  }
  // 重置密码权限
  if (hasAccessByCodes(['system:user:update-password'])) {
    actions.push({ name: '重置密码', value: 'resetPassword' })
  }
  // 分配角色权限
  if (hasAccessByCodes(['system:permission:assign-user-role'])) {
    actions.push({ name: '分配角色', value: 'assignRole' })
  }
  return actions
})
const hasMoreActions = computed(() => moreActions.value.length > 0)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/user/index')
}

/** 加载用户详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getUser(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑用户 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/user/form/index?id=${props.id}`,
  })
}

/** 删除用户 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该用户吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteUser(Number(props.id))
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (item.value === 'resetPassword') {
    passwordFormVisible.value = true
  } else if (item.value === 'assignRole') {
    roleAssignFormVisible.value = true
  } else if (item.value === 'update-status') {
    handleUpdateStatus()
  }
}

/** 修改用户状态 */
function handleUpdateStatus() {
  const isDisable = formData.value.status === CommonStatusEnum.DISABLE
  uni.showModal({
    title: '提示',
    content: isDisable ? '确定要禁用该用户吗？' : '确定要开启该用户吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      await updateUserStatus(Number(props.id), formData.value.status === 1 ? 0 : 1)
      toast.success(isDisable ? '禁用成功' : '开启成功')
      await getDetail()
    },
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
