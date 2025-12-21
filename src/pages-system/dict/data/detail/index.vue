<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="字典数据详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="字典编码" :value="String(formData?.id ?? '-')" />
        <wd-cell title="字典类型" :value="String(formData?.dictType ?? '-')" />
        <wd-cell title="字典标签" :value="String(formData?.label ?? '-')" />
        <wd-cell title="字典键值" :value="String(formData?.value ?? '-')" />
        <wd-cell title="字典排序" :value="String(formData?.sort ?? '-')" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="颜色类型">
          <view v-if="formData?.colorType" class="rounded-4rpx px-8rpx py-2rpx text-24rpx text-white" :style="{ backgroundColor: getColorStyle(formData.colorType) }">
            {{ formData.colorType }}
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="CSS Class">
          <view v-if="formData?.cssClass" class="rounded-4rpx px-8rpx py-2rpx text-24rpx text-white" :style="{ backgroundColor: formData.cssClass }">
            {{ formData.cssClass }}
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="String(formData?.remark ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:dict:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:dict:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DictData } from '@/api/system/dict/data'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteDictData, getDictData } from '@/api/system/dict/data'
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
const formData = ref<DictData>()
const deleting = ref(false)

/** 颜色类型映射 */
const colorMap: Record<string, string> = {
  processing: '#1890ff',
  success: '#52c41a',
  default: '#d9d9d9',
  warning: '#faad14',
  error: '#ff4d4f',
  pink: '#eb2f96',
  red: '#f5222d',
  orange: '#fa8c16',
  green: '#52c41a',
  cyan: '#13c2c2',
  blue: '#1890ff',
  purple: '#722ed1',
}

/** 获取颜色样式 */
function getColorStyle(colorType: string) {
  return colorMap[colorType] || colorType
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dict/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDictData(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/dict/data/form/index?id=${props.id}`,
  })
}

/** 删除 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该字典数据吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteDictData(props.id)
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
