<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="名称" :value="formData?.name || '-'" />
        <wd-cell title="联系人" :value="formData?.contact || '-'" />
        <wd-cell title="手机号码" :value="formData?.mobile || '-'" />
        <wd-cell title="联系电话" :value="formData?.telephone || '-'" />
        <wd-cell title="电子邮箱" :value="formData?.email || '-'" />
        <wd-cell title="传真" :value="formData?.fax || '-'" />
        <wd-cell title="开启状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="纳税人识别号" :value="formData?.taxNo || '-'" />
        <wd-cell title="税率(%)" :value="formatPercent(formData?.taxPercent)" />
        <wd-cell title="开户行" :value="formData?.bankName || '-'" />
        <wd-cell title="开户账号" :value="formData?.bankAccount || '-'" />
        <wd-cell title="开户地址" :value="formData?.bankAddress || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['erp:customer:update']) || hasAccessByCodes(['erp:customer:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['erp:customer:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['erp:customer:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Customer } from '@/api/erp/sale/customer'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteCustomer, getCustomer } from '@/api/erp/sale/customer'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatPercent } from '@/utils/format'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Customer>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/sale/customer/index')
}

/** 加载客户详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getCustomer(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑客户 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/sale/customer/form/index?id=${props.id}` })
}

/** 删除客户 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该客户吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCustomer(props.id)
    toast.success('删除成功')
    uni.$emit('erp:customer:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:customer:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:customer:reload', getDetail)
})
</script>
