<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="客户详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="基本信息" />
        <wd-tab title="产品清单" />
        <wd-tab title="出库记录" />
      </wd-tabs>
    </view>
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="客户编码" :value="formData?.code || '-'" />
        <wd-cell title="客户名称" :value="formData?.name || '-'" />
        <wd-cell title="客户简称" :value="formData?.nickname || '-'" />
        <wd-cell title="英文名称" :value="formData?.englishName || '-'" />
        <wd-cell title="客户类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_CLIENT_TYPE" :value="formData.type" /><text v-else>-</text>
        </wd-cell>
        <wd-cell title="客户简介" :value="formData?.description || '-'" />
        <wd-cell title="客户 LOGO">
          <wd-img v-if="formData?.logo" :src="formData.logo" width="96rpx" height="96rpx" radius="8rpx" mode="aspectFill" enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="客户地址" :value="formData?.address || '-'" />
        <wd-cell title="官网地址" :value="formData?.website || '-'" />
        <wd-cell title="邮箱地址" :value="formData?.email || '-'" />
        <wd-cell title="客户电话" :value="formData?.telephone || '-'" />
        <wd-cell title="联系人1" :value="formData?.contact1Name || '-'" />
        <wd-cell title="联系人1-电话" :value="formData?.contact1Telephone || '-'" />
        <wd-cell title="联系人1-邮箱" :value="formData?.contact1Email || '-'" />
        <wd-cell title="联系人2" :value="formData?.contact2Name || '-'" />
        <wd-cell title="联系人2-电话" :value="formData?.contact2Telephone || '-'" />
        <wd-cell title="联系人2-邮箱" :value="formData?.contact2Email || '-'" />
        <wd-cell title="信用代码" :value="formData?.creditCode || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>
    <ClientProductSalesLineList v-if="tabType === 'products' && formData?.id" :client-id="formData.id" :show-title="false" />
    <ClientProductSalesList v-if="tabType === 'sales' && formData?.id" :client-id="formData.id" :show-title="false" />
    <view
      v-if="tabType === 'basic' && (hasAccessByCodes(['mes:md-client:update']) || hasAccessByCodes(['mes:md-client:delete']))"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:md-client:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:md-client:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdClient } from '@/api/mes/md/client'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteClient, getClient } from '@/api/mes/md/client'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ClientProductSalesLineList from '../components/client-product-sales-line-list.vue'
import ClientProductSalesList from '../components/client-product-sales-list.vue'

const props = defineProps<{ id?: number | string }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<MdClient>() // 详情数据
const deleting = ref(false) // 删除状态
const tabTypes = ['basic', 'products', 'sales'] // tab 配置
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabTypes[tabIndex.value]) // 当前 tab 类型

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/client/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 加载客户详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getClient(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑客户 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/md/client/form/index?id=${props.id}` })
}

/** 删除客户 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该客户吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteClient(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:client:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
