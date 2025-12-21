<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="参数配置详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="参数主键" :value="formData?.id" />
        <wd-cell title="参数分类" :value="formData?.category" />
        <wd-cell title="参数名称" :value="formData?.name" />
        <wd-cell title="参数键名" :value="formData?.key" />
        <wd-cell title="参数键值" :value="formData?.value" />
        <wd-cell title="是否可见">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.visible" />
        </wd-cell>
        <wd-cell title="系统内置">
          <dict-tag :type="DICT_TYPE.INFRA_CONFIG_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['infra:config:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:config:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Config } from '@/api/infra/config'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteConfig, getConfig } from '@/api/infra/config'
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
const formData = ref<Config>()
const deleting = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/config/index')
}

/** 加载参数配置详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getConfig(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑参数配置 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-infra/config/form/index?id=${props.id}`,
  })
}

/** 删除参数配置 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该参数配置吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteConfig(props.id)
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
