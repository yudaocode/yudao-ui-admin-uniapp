<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="假期详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="日期" :value="dayText || '-'" />
        <wd-cell title="日期类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_CAL_HOLIDAY_TYPE" :value="formData.type" />
          <text v-else>
            工作日
          </text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:cal-holiday:create'])"
          type="primary"
          block
          @click="handleEdit"
        >
          设置
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import type { CalHoliday } from '@/api/mes/cal/holiday'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getHolidayByDay } from '@/api/mes/cal/holiday'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateOnly, formatDateStartTime } from '@/utils/date'

const props = defineProps<{ day?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<CalHoliday>() // 详情数据
const dayText = computed(() => formatDateOnly(props.day)) // 日期文案

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/holiday/index')
}

/** 加载详情 */
async function getDetail() {
  if (!dayText.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getHolidayByDay(formatDateStartTime(dayText.value))
  } finally {
    toast.close()
  }
}

/** 设置假期 */
function handleEdit() {
  if (!dayText.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/holiday/form/index?day=${dayText.value}` })
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
