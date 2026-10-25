<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="佣金记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="用户编号" :value="formData.userId != null ? String(formData.userId) : '-'" />
      <wd-cell title="用户昵称" :value="formData.userNickname || '-'" />
      <wd-cell title="业务类型">
        <dict-tag v-if="formData.bizType != null" :type="DICT_TYPE.BROKERAGE_RECORD_BIZ_TYPE" :value="formData.bizType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="业务编号" :value="formData.bizId != null ? String(formData.bizId) : '-'" />
      <wd-cell title="标题" :value="formData.title || '-'" />
      <wd-cell title="说明" :value="formData.description || '-'" />
      <wd-cell title="来源用户" :value="formData.sourceUserNickname || '-'" />
      <wd-cell title="佣金金额" :value="formatDisplayMoney(formData.price)" />
      <wd-cell title="当前佣金" :value="formatDisplayMoney(formData.totalPrice)" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.BROKERAGE_RECORD_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="冻结天数" :value="formData.frozenDays != null ? String(formData.frozenDays) : '-'" />
      <wd-cell title="解冻时间" :value="formatDateTime(formData.unfreezeTime) || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { TradeBrokerageRecord } from '@/api/mall/trade/brokerage/record'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getTradeBrokerageRecord } from '@/api/mall/trade/brokerage/record'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<TradeBrokerageRecord>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/brokerage/record/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTradeBrokerageRecord(props.id)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
