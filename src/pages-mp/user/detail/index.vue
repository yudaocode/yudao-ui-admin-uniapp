<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号粉丝详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="头像">
          <wd-img v-if="formData?.headImageUrl" :src="formData.headImageUrl" width="96rpx" height="96rpx" mode="aspectFill" round enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="昵称" :value="formData?.nickname || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="用户标识">
          <view class="break-all text-right text-26rpx text-[#666]">
            {{ formData?.openid || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="标签">
          <view class="flex flex-wrap justify-end gap-8rpx">
            <wd-tag v-for="tagId in formData?.tagIds || []" :key="tagId" plain>
              {{ getTagName(tagId) }}
            </wd-tag>
            <text v-if="!formData?.tagIds?.length">-</text>
          </view>
        </wd-cell>
        <wd-cell title="订阅状态" :value="formData?.subscribeStatus === 0 ? '已订阅' : '未订阅'" />
        <wd-cell title="订阅时间" :value="formatDateTime(formData?.subscribeTime) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        v-if="hasAccessByCodes(['mp:user:update'])"
        type="warning"
        block
        @click="handleEdit"
      >
        编辑
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Tag } from '@/api/mp/tag'
import type { MpUser } from '@/api/mp/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getSimpleTagList } from '@/api/mp/tag'
import { getUser } from '@/api/mp/user'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
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
const formData = ref<MpUser>() // 详情数据
const tagList = ref<Tag[]>([]) // 标签列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/user/index')
}

/** 获取标签名称 */
function getTagName(tagId: number) {
  const tag = tagList.value.find(item => item.tagId === tagId)
  return tag?.name || tagId
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getUser(props.id)
  } catch {
    formData.value = undefined
  } finally {
    toast.close()
  }
}

/** 加载标签列表 */
async function loadTagList() {
  try {
    tagList.value = await getSimpleTagList()
  } catch {
    // 标签只是辅助展示，失败时保留编号
    tagList.value = []
  }
}

/** 编辑粉丝 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mp/user/form/index?id=${props.id}` })
}

/** 初始化 */
onMounted(() => {
  loadTagList()
  getDetail()
})
</script>
