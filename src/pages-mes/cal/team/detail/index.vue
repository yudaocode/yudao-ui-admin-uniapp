<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="班组详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="班组编码" :value="formData?.code || '-'" />
        <wd-cell title="班组名称" :value="formData?.name || '-'" />
        <wd-cell title="班组类型">
          <dict-tag
            v-if="formData?.calendarType != null"
            :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE"
            :value="formData.calendarType"
          />
          <text v-else>
            -
          </text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <TeamMemberList v-if="props.id" :team-id="Number(props.id)" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:cal-team:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:cal-team:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { CalTeam } from '@/api/mes/cal/team'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import { deleteTeam, getTeam } from '@/api/mes/cal/team'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import TeamMemberList from '../components/team-member-list.vue'

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
const formData = ref<CalTeam>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/team/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTeam(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑班组 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/team/form/index?id=${props.id}` })
}

/** 删除班组 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${formData.value?.name || formData.value?.code || props.id}」班组吗？删除后会级联清理班组成员和排班记录。`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteTeam(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:cal:team:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

/** 监听班组编号变化 */
watch(() => props.id, () => {
  getDetail()
})
</script>
