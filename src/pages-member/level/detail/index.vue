<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="会员等级详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id" />
        <wd-cell title="等级名称" :value="formData?.name || '-'" />
        <wd-cell title="等级" :value="formData?.level" />
        <wd-cell title="升级经验" :value="formData?.experience" />
        <wd-cell title="享受折扣" :value="`${formData?.discountPercent ?? 0}%`" />
        <wd-cell title="等级图标">
          <wd-img
            v-if="formData?.icon"
            :src="formData.icon"
            :width="48"
            :height="48"
            mode="aspectFill"
            round
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="背景图">
          <wd-img
            v-if="formData?.backgroundUrl"
            :src="formData.backgroundUrl"
            :width="96"
            :height="60"
            mode="aspectFill"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['member:level:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['member:level:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MemberLevel } from '@/api/member/level'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteMemberLevel, getMemberLevel } from '@/api/member/level'
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
const toast = useToast()
const dialog = useDialog()
const formData = ref<MemberLevel>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-member/level/index')
}

/** 加载等级详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMemberLevel(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑等级 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-member/level/form/index?id=${props.id}`,
  })
}

/** 删除等级 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该会员等级吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMemberLevel(props.id)
    toast.success('删除成功')
    uni.$emit('member:level:reload')
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
