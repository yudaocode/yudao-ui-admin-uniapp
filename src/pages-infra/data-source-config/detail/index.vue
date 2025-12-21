<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="数据源配置详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="主键编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="数据源名称" :value="String(formData?.name ?? '-')" />
        <!-- TODO @AI：参考 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages-infra/api-access-log/detail/index.vue 复制的处理 -->
        <wd-cell title="数据源连接" :value="String(formData?.url ?? '-')" />
        <wd-cell title="用户名" :value="String(formData?.username ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮（主数据源不可编辑/删除） -->
    <view v-if="formData?.id !== 0" class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['infra:data-source-config:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:data-source-config:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DataSourceConfig } from '@/api/infra/data-source-config'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteDataSourceConfig, getDataSourceConfig } from '@/api/infra/data-source-config'
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
const formData = ref<DataSourceConfig>()
const deleting = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/data-source-config/index')
}

/** 加载数据源配置详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDataSourceConfig(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑数据源配置 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-infra/data-source-config/form/index?id=${props.id}`,
  })
}

/** 删除数据源配置 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该数据源配置吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteDataSourceConfig(props.id)
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
