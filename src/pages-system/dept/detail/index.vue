<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="部门详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="部门名称" :value="formData?.name" />
        <wd-cell title="上级部门" :value="getParentName() || '-'" />
        <wd-cell title="负责人" :value="getLeaderName() || '-'" />
        <wd-cell title="联系电话" :value="formData?.phone || '-'" />
        <wd-cell title="邮箱" :value="formData?.email || '-'" />
        <wd-cell title="显示顺序" :value="formData?.sort" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button class="flex-1" type="error" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteDept, getDept, getSimpleDeptList } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<Dept>()
const deleting = ref(false)
const deptList = ref<Dept[]>([])
const userList = ref<User[]>([])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dept/index')
}

/** 获取上级部门名称 */
function getParentName(): string {
  if (!formData.value?.parentId || formData.value.parentId === 0) {
    return '顶级部门'
  }
  const parent = deptList.value.find(d => d.id === formData.value?.parentId)
  return parent?.name || '未知'
}

/** 获取负责人名称 */
function getLeaderName(): string {
  if (!formData.value?.leaderUserId) {
    return '未设置'
  }
  const user = userList.value.find(u => u.id === formData.value?.leaderUserId)
  return user?.nickname || '未知'
}

/** 加载部门详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  toast.loading('加载中...')
  try {
    formData.value = await getDept(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑部门 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/dept/form/index?id=${props.id}`,
  })
}

/** 删除部门 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该部门吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteDept(props.id)
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

/** 初始化 */
onMounted(async () => {
  // 获取部门列表
  deptList.value = await getSimpleDeptList()
  // 获取用户列表
  userList.value = await getSimpleUserList()
  // 获取详情
  await getDetail()
})
</script>

<style lang="scss" scoped>
</style>
