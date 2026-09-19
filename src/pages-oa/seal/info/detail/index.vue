<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="印章详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="印章名称" :value="formData?.name || '-'" />
        <wd-cell title="印章编码" :value="formData?.no || '-'" />
        <wd-cell title="印章类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SEAL_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="印章分类">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SEAL_CATEGORY" :value="formData.category" />
        </wd-cell>
        <wd-cell title="印章状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SEAL_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="保管人" :value="formData?.keeperName || '-'" />
        <wd-cell title="保管部门" :value="formData?.keeperDeptName || '-'" />
        <wd-cell title="所属部门" :value="formData?.deptName || '-'" />
        <wd-cell title="购买时间" :value="formatDate(formData?.purchaseTime) || '-'" />
        <wd-cell title="启用时间" :value="formatDate(formData?.enableTime) || '-'" />
        <wd-cell title="停用时间" :value="formatDate(formData?.disableTime) || '-'" />
        <wd-cell title="显示顺序" :value="formData?.sort != null ? String(formData.sort) : '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 印章照片 -->
      <view v-if="formData?.picUrl" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          印章照片
        </view>
        <wd-img :src="formData.picUrl" width="200rpx" height="200rpx" radius="12rpx" mode="aspectFill" enable-preview />
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:seal:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:seal:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Seal } from '@/api/oa/seal'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteSeal, getSeal } from '@/api/oa/seal'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: string
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
const formData = ref<Seal>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/seal/info/index')
}

/** 加载印章详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSeal(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑印章 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/seal/info/form/index?id=${props.id}`,
  })
}

/** 删除印章 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该印章吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSeal(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:seal:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:seal:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:seal:reload', getDetail)
})
</script>
