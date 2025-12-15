<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="岗位详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="p-24rpx pb-200rpx">
      <wd-cell-group custom-class="cell-group" border>
        <wd-cell title="岗位名称" :value="formData?.name || '-'" />
        <wd-cell title="岗位编码" :value="formData?.code || '-'" />
        <wd-cell title="显示顺序" :value="String(formData?.sort ?? '-')" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="safe-area-inset-bottom fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { Post } from '@/api/system/post'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deletePost, getPost } from '@/api/system/post'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id: number
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<Post>() // 详情数据
const deleting = ref(false) // 删除中

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 加载岗位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getPost(props.id)
}

/** 编辑岗位 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/post/form/index?id=${props.id}`,
  })
}

/** 删除岗位 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该岗位吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deletePost(props.id)
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
:deep(.cell-group) {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}

.safe-area-inset-bottom {
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
