<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="数据规则详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="规则编号" :value="String(formData?.id || '-')" />
        <wd-cell title="规则名称" :value="formData?.name || '-'" />
        <wd-cell title="规则状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="数据源" :value="`${String(formData?.sourceConfigs?.length || 0)} 个`" />
        <wd-cell title="数据目的" :value="`${String(formData?.sinkIds?.length || 0)} 个`" />
        <wd-cell title="规则描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['iot:data-rule:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:data-rule:delete'])"
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
import type { DataRule } from '@/api/iot/rule/data/rule'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteDataRule, getDataRule } from '@/api/iot/rule/data/rule'
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
const formData = ref<DataRule>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/rule/data/rule/index')
}

/** 加载数据规则详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getDataRule(Number(props.id))
}

/** 编辑数据规则 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/rule/data/rule/form/index?id=${props.id}` })
}

/** 删除数据规则 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该数据规则吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDataRule(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:data-rule:reload')
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
