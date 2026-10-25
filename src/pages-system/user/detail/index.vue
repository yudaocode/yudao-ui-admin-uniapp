<template>
  <view class="yd-page-container">
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
          <wd-img v-if="formData?.avatar" :src="formData.avatar" width="80rpx" height="80rpx" mode="aspectFill" round enable-preview />
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
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="最后登录 IP" :value="formData?.loginIp || '-'" />
        <wd-cell title="最后登录时间" :value="formatDateTime(formData?.loginDate) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['system:user:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:user:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
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
    <PasswordForm v-model="passwordFormVisible" :user-id="props.id" @success="getDetail" />
    <!-- 分配角色弹窗 -->
    <RoleAssignForm v-model="roleAssignFormVisible" :user-id="props.id" @success="getDetail" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteUser, getUser, updateUserStatus } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PasswordForm from './components/password-form.vue'
import RoleAssignForm from './components/role-assign-form.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<User>() // 详情数据
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 更多操作菜单
const passwordFormVisible = ref(false) // 密码表单弹窗
const roleAssignFormVisible = ref(false) // 角色分配弹窗
const moreActions = computed(() => {
  const actions = []
  // 修改状态权限
  if (hasAccessByCodes(['system:user:update'])) {
    actions.push({
      name: formData.value?.status === CommonStatusEnum.ENABLE ? '禁用用户' : '开启用户',
      value: 'update-status',
    })
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
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getUser(props.id)
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
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该用户吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteUser(props.id)
    toast.success('删除成功')
    uni.$emit('system:user:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
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
async function handleUpdateStatus() {
  const willEnable = formData.value.status === CommonStatusEnum.DISABLE
  try {
    await dialog.confirm({
      title: '提示',
      msg: willEnable ? '确定要开启该用户吗？' : '确定要禁用该用户吗？',
    })
  } catch {
    return
  }

  await updateUserStatus(
    props.id,
    willEnable ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE,
  )
  toast.success(willEnable ? '开启成功' : '禁用成功')
  uni.$emit('system:user:reload')
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:user:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('system:user:reload', getDetail)
})
</script>
