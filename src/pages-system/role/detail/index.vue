<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="角色详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="角色名称" :value="formData?.name || '-'" />
        <wd-cell title="角色标识" :value="formData?.code || '-'" />
        <wd-cell title="显示顺序" :value="formData?.sort" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:role:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:role:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
      <!-- TODO @芋艿：1）数据权限；2）菜单权限 -->
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Role } from '@/api/system/role'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteRole, getRole } from '@/api/system/role'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
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
const formData = ref<Role>()
const deleting = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/role/index')
}

/** 加载角色详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getRole(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑角色 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/role/form/index?id=${props.id}`,
  })
}

/** 删除角色 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该角色吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteRole(props.id)
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
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
