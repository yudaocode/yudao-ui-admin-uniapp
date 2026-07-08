<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="质检方案详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="基本信息" />
        <wd-tab title="检测指标项" />
        <wd-tab title="产品关联" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="方案编号" :value="formData?.code || '-'" />
        <wd-cell title="方案名称" :value="formData?.name || '-'" />
        <wd-cell title="检测种类">
          <template v-if="formData?.types?.length">
            <dict-tag
              v-for="type in formData.types"
              :key="type"
              class="mb-8rpx mr-8rpx"
              :type="DICT_TYPE.MES_QC_TYPE"
              :value="type"
            />
          </template>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
      </wd-cell-group>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 检测指标项 -->
    <scroll-view v-if="tabType === 'indicators' && formData?.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <TemplateIndicatorList :template-id="formData.id" :show-title="false" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 产品关联 -->
    <scroll-view v-if="tabType === 'items' && formData?.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <TemplateItemList :template-id="formData.id" :show-title="false" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="tabType === 'basic' && (hasAccessByCodes(['mes:qc-template:update']) || hasAccessByCodes(['mes:qc-template:delete']))" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:qc-template:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:qc-template:delete'])"
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
import type { QcTemplate } from '@/api/mes/qc/template'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteTemplate, getTemplate } from '@/api/mes/qc/template'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import TemplateIndicatorList from '../components/template-indicator-list.vue'
import TemplateItemList from '../components/template-item-list.vue'

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
const formData = ref<QcTemplate>() // 详情数据
const deleting = ref(false) // 删除状态
const tabTypes = ['basic', 'indicators', 'items'] // tab 配置
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabTypes[tabIndex.value]) // 当前 tab 类型

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/template/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTemplate(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/qc/template/form/index?id=${props.id}` })
}

/** 删除质检方案 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该质检方案吗？删除后将无法恢复。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:qc:template:reload')
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
