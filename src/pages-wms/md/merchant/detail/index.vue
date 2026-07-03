<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="往来企业详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="企业编号" :value="formData?.code || '-'" />
        <wd-cell title="企业名称" :value="formData?.name || '-'" />
        <wd-cell title="企业类型">
          <dict-tag :type="DICT_TYPE.WMS_MERCHANT_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="级别" :value="formData?.level || '-'" />
        <wd-cell title="联系人" :value="formData?.contact || '-'" />
        <wd-cell title="手机号" :value="formData?.mobile || '-'" />
        <wd-cell title="座机号" :value="formData?.telephone || '-'" />
        <wd-cell title="Email" :value="formData?.email || '-'" />
        <wd-cell title="开户行" :value="formData?.bankName || '-'" />
        <wd-cell title="银行账户" :value="formData?.bankAccount || '-'" />
        <wd-cell title="地址" :value="formData?.address || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['wms:merchant:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['wms:merchant:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Merchant } from '@/api/wms/md/merchant'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteMerchant, getMerchant } from '@/api/wms/md/merchant'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
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
const dialog = useDialog()
const toast = useToast()
const formData = ref<Merchant>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/merchant/index')
}

/** 加载往来企业详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMerchant(Number(props.id))
}

/** 编辑往来企业 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-wms/md/merchant/form/index?id=${props.id}`,
  })
}

/** 删除往来企业 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该往来企业吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteMerchant(Number(props.id))
    toast.success('删除成功')
    uni.$emit('wms:merchant:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
