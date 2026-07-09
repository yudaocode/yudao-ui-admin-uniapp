<template>
  <view class="mt-24rpx">
    <!-- 标题操作 -->
    <view v-if="showTitle || editable" class="mb-16rpx flex items-center justify-between">
      <view class="text-30rpx text-[#333] font-semibold">
        <template v-if="showTitle">
          子箱
        </template>
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openPackagePicker">
        添加子箱
      </wd-button>
    </view>

    <!-- 子箱列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多子箱了"
      empty-view-text="暂无子箱"
      @query="queryList"
    >
      <view>
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx">
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ formatDateTime(item.packageDate) || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="item.status" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">客户：</text>{{ getClientText(item) }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">尺寸：</text>{{ getSizeText(item) }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">重量：</text>{{ getWeightText(item) }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">检查员：</text>{{ item.inspectorName || '-' }}
            </view>
          </view>
          <view v-if="editable" class="flex justify-end gap-16rpx px-24rpx pb-24rpx">
            <wd-button size="small" type="danger" variant="plain" @click="handleRemoveChild(item)">
              移除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 子箱选择弹窗 -->
    <PackagePicker
      ref="packagePickerRef"
      title="选择子箱"
      empty-tip="暂无可作为子箱的已完成装箱单"
      :exclude-id="packageId"
      childable-only
      @confirm="handlePackageConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmPackage } from '@/api/mes/wm/packages'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { addChildPackage, getPackagePage, removeChildPackage } from '@/api/mes/wm/packages'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PackagePicker from './package-picker.vue'

const props = withDefaults(defineProps<{
  packageId?: number
  editable?: boolean
  showTitle?: boolean
}>(), {
  packageId: undefined,
  editable: false,
  showTitle: true,
})

const dialog = useDialog()
const toast = useToast()
const list = ref<WmPackage[]>([]) // 子箱列表
const pagingRef = ref<ZPagingRef<WmPackage>>() // 分页组件引用
const packagePickerRef = ref<InstanceType<typeof PackagePicker>>() // 装箱单选择器

/** 客户展示 */
function getClientText(item: WmPackage) {
  const code = item.clientCode || ''
  const name = item.clientName || ''
  return [code, name].filter(Boolean).join(' / ') || '-'
}

/** 尺寸展示 */
function getSizeText(item: WmPackage) {
  const values = [item.length, item.width, item.height].map(value => value ?? '-').join(' x ')
  return `${values} ${item.sizeUnitName || ''}`.trim()
}

/** 重量展示 */
function getWeightText(item: WmPackage) {
  const net = item.netWeight ?? '-'
  const gross = item.grossWeight ?? '-'
  return `净重 ${net} / 毛重 ${gross} ${item.weightUnitName || ''}`.trim()
}

/** 查询子箱列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.packageId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getPackagePage({
      pageNo,
      pageSize,
      parentId: props.packageId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开子箱选择器 */
function openPackagePicker() {
  if (!props.packageId) {
    return
  }
  packagePickerRef.value?.open()
}

/** 添加子箱 */
async function handlePackageConfirm(item: WmPackage) {
  if (!props.packageId) {
    return
  }
  await addChildPackage(props.packageId, item.id)
  toast.success('添加成功')
  reload()
}

/** 移除子箱 */
async function handleRemoveChild(item: WmPackage) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认将装箱单「${item.code}」从子箱列表中移除？`,
    })
  } catch {
    return
  }
  await removeChildPackage(item.id)
  toast.success('移除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:packages:reload', reload)
})

/** 监听包装编号变化 */
watch(() => props.packageId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:packages:reload', reload)
})
</script>
