<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 编码规则详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border>
        <wd-cell title="规则编码" :value="formData?.code || '-'" />
        <wd-cell title="规则名称" :value="formData?.name || '-'" />
        <wd-cell title="规则描述" :value="formData?.description || '-'" />
        <wd-cell title="最大长度" :value="formData?.maxLength != null ? String(formData.maxLength) : '-'" />
        <wd-cell title="是否补齐">
          <dict-tag
            v-if="formData?.padded !== undefined"
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="formData.padded"
          />
          <text v-else>-</text>
        </wd-cell>
        <template v-if="formData?.padded">
          <wd-cell title="补齐字符" :value="formData.paddedChar || '-'" />
          <wd-cell title="补齐方式">
            <dict-tag
              v-if="formData.paddedMethod != null"
              :type="DICT_TYPE.MES_MD_AUTO_CODE_PADDED_METHOD"
              :value="formData.paddedMethod"
            />
            <text v-else>-</text>
          </wd-cell>
        </template>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 编码规则组成部分 -->
      <AutoCodePartSection v-if="formData?.id" :rule-id="formData.id" />
    </view>

    <!-- 底部操作按钮 -->
    <view
      v-if="hasAccessByCodes(['mes:auto-code-rule:update']) || hasAccessByCodes(['mes:auto-code-rule:delete'])"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:auto-code-rule:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:auto-code-rule:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AutoCodeRule } from '@/api/mes/md/autocode/rule'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteAutoCodeRule, getAutoCodeRule } from '@/api/mes/md/autocode/rule'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import AutoCodePartSection from '../components/auto-code-part-section.vue'

const props = defineProps<{
  id?: number | string
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
const formData = ref<AutoCodeRule>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/autocode/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getAutoCodeRule(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/md/autocode/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除编码规则「${formData.value?.code || props.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAutoCodeRule(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:autocode:reload')
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
