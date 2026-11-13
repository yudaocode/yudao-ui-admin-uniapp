<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="技能详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="技能名称" :value="formData?.name || '-'" />
        <wd-cell title="技能描述" :value="formData?.description || '-'" />
        <wd-cell title="版本" :value="formData?.version || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="文件数" :value="formData?.fileCount ?? '-'" />
        <wd-cell title="引用角色" :value="formData?.roleNames?.length ? formData.roleNames.join('、') : '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="更新时间" :value="formatDateTime(formData?.updateTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleFile">
          文件管理
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['ai:skill:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['ai:skill:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Skill } from '@/api/ai/skill'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteSkill, getSkill } from '@/api/ai/skill'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Skill>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/skill/index')
}

/** 加载技能详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSkill(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 文件管理 */
function handleFile() {
  uni.navigateTo({
    url: `/pages-ai/skill/file/index?skillId=${props.id}`,
  })
}

/** 编辑技能 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-ai/skill/form/index?id=${props.id}`,
  })
}

/** 删除技能 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  // 被角色引用时，提示受影响的角色
  const roleNames = formData.value?.roleNames
  const roleTip = roleNames?.length ? `被角色【${roleNames.join('、')}】引用，` : ''
  try {
    await dialog.confirm({
      title: '提示',
      msg: `技能【${formData.value?.name || '-'}】${roleTip}删除技能将同时删除其全部文件，确定要删除吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSkill(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:skill:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:skill:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:skill:reload', getDetail)
})
</script>
