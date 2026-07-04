<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="结算账户详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="账户名称" :value="formData?.name || '-'" />
        <wd-cell title="账户编码" :value="formData?.no || '-'" />
        <wd-cell title="账户状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="是否默认">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.defaultStatus" />
        </wd-cell>
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['erp:account:update']) || hasAccessByCodes(['erp:account:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['erp:account:update'])" class="flex-1" type="warning" :disabled="defaultLoading || deleting" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['erp:account:update'])"
          class="flex-1"
          type="primary"
          :loading="defaultLoading"
          :disabled="deleting"
          @click="handleUpdateDefaultStatus"
        >
          {{ formData?.defaultStatus ? '取消默认' : '设为默认' }}
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['erp:account:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          :disabled="defaultLoading"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Account } from '@/api/erp/finance/account'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteAccount, getAccount, updateAccountDefaultStatus } from '@/api/erp/finance/account'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const formData = ref<Account>() // 详情数据
const deleting = ref(false) // 删除状态
const defaultLoading = ref(false) // 默认状态修改状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/account/index')
}

/** 加载结算账户详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getAccount(props.id)
}

/** 编辑结算账户 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-erp/finance/account/form/index?id=${props.id}`,
  })
}

/** 删除结算账户 */
async function handleDelete() {
  if (!props.id || deleting.value || defaultLoading.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该结算账户吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAccount(props.id)
    toast.success('删除成功')
    uni.$emit('erp:account:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 修改默认状态 */
async function handleUpdateDefaultStatus() {
  if (!props.id || !formData.value || defaultLoading.value || deleting.value) {
    return
  }
  const nextDefaultStatus = !formData.value.defaultStatus
  const actionName = nextDefaultStatus ? '设置' : '取消'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要${actionName}“${formData.value.name || '该结算账户'}”默认吗？`,
    })
  } catch {
    return
  }
  defaultLoading.value = true
  try {
    await updateAccountDefaultStatus(props.id, nextDefaultStatus)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:account:reload')
    await getDetail()
  } finally {
    defaultLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('erp:account:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:account:reload', getDetail)
})
</script>
