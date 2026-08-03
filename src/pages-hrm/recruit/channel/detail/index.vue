<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="招聘渠道详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="渠道名称" :value="formData.name || '-'" />
        <wd-cell title="系统内置" :value="formData.systemFlag ? '是' : '否'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="显示顺序" :value="formData.sort != null ? String(formData.sort) : '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:recruit:channel:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canDelete"
          class="flex-1"
          type="danger"
          @click="deleteFormVisible = true"
        >
          删除
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:recruit:channel:update'])"
          class="flex-1"
          type="info"
          @click="handleUpdateStatus"
        >
          {{ formData.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
        </wd-button>
      </view>
    </view>

    <!-- 删除弹窗 -->
    <ChannelDeleteForm
      v-model="deleteFormVisible"
      :channel="formData"
      @success="handleDeleteSuccess"
    />
  </view>
</template>

<script lang="ts" setup>
import type { RecruitChannel } from '@/api/hrm/recruit/channel'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getRecruitChannel, updateRecruitChannelStatus } from '@/api/hrm/recruit/channel'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ChannelDeleteForm from './components/channel-delete-form.vue'

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
const formData = ref<RecruitChannel>({
  name: '',
  sort: 0,
}) // 详情数据
const deleteFormVisible = ref(false) // 删除弹窗
const deleting = ref(false) // 删除中（阻止详情刷新）
const canDelete = computed(() => !formData.value.systemFlag && hasAccessByCodes(['hrm:recruit:channel:delete']))
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes(['hrm:recruit:channel:update']) || canDelete.value
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/recruit/channel/index')
}

/** 加载招聘渠道详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getRecruitChannel(Number(props.id))
}

/** 编辑招聘渠道 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/recruit/channel/form/index?id=${props.id}`,
  })
}

/** 修改招聘渠道状态 */
async function handleUpdateStatus() {
  if (!props.id || formData.value.status == null) {
    return
  }
  const willEnable = formData.value.status === CommonStatusEnum.DISABLE
  const text = willEnable ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${text}招聘渠道“${formData.value.name}”吗？`,
    })
  } catch {
    return
  }

  await updateRecruitChannelStatus({
    id: Number(props.id),
    status: willEnable ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE,
  })
  toast.success(`${text}成功`)
  uni.$emit('hrm:recruit:channel:reload')
  await getDetail()
}

/** 删除成功 */
function handleDeleteSuccess() {
  deleting.value = true
  uni.$emit('hrm:recruit:channel:reload')
  delay(handleBack)
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:recruit:channel:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:recruit:channel:reload', getDetail)
})
</script>
