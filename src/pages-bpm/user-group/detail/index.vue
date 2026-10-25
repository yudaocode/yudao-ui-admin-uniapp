<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用户分组详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id" />
        <wd-cell title="组名" :value="formData?.name" />
        <wd-cell title="描述" :value="formData?.description || '-'" />
        <wd-cell title="成员">
          <view class="flex flex-wrap justify-end gap-8rpx">
            <wd-tag
              v-for="userId in (formData?.userIds || [])"
              :key="userId"
              type="primary"
              variant="plain"
            >
              {{ getUserNickname(userId) }}
            </wd-tag>
            <text v-if="!formData?.userIds?.length">-</text>
          </view>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['bpm:user-group:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['bpm:user-group:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@/api/bpm/user-group'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteUserGroup, getUserGroup } from '@/api/bpm/user-group'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const formData = ref<UserGroup>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/user-group/index')
}

/** 获取用户昵称 */
function getUserNickname(userId: number) {
  const user = userList.value.find(u => u.id === userId)
  return user?.nickname || userId
}

/** 加载用户列表 */
async function loadUserList() {
  userList.value = await getSimpleUserList()
}

/** 加载用户分组详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getUserGroup(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑用户分组 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-bpm/user-group/form/index?id=${props.id}`,
  })
}

/** 删除用户分组 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该用户分组吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteUserGroup(props.id)
    toast.success('删除成功')
    uni.$emit('bpm:user-group:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadUserList()
  getDetail()
})
</script>
