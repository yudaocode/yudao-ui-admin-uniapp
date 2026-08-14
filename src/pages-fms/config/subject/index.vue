<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="科目"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="handleAccountSetChange" />
      </view>

      <!-- 科目类型 -->
      <view class="mt-24rpx bg-white">
        <scroll-view scroll-x class="whitespace-nowrap">
          <wd-radio-group v-model="type" type="button" class="px-24rpx py-16rpx" @change="handleTypeChange">
            <wd-radio
              v-for="option in subjectTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </wd-radio>
          </wd-radio-group>
        </scroll-view>
      </view>

      <!-- 导入导出入口：Excel 操作需要在 PC 端管理后台完成 -->
      <view
        v-if="hasAccessByCodes(['fms:config:subject:import']) || hasAccessByCodes(['fms:config:subject:export'])"
        class="flex flex-wrap gap-16rpx p-24rpx pb-0"
      >
        <wd-button
          v-if="hasAccessByCodes(['fms:config:subject:import'])"
          type="warning"
          variant="plain"
          size="small"
          @click="handleImportPc"
        >
          导入
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['fms:config:subject:export'])"
          type="warning"
          variant="plain"
          size="small"
          @click="handleExportPc"
        >
          导出
        </wd-button>
      </view>

      <!-- 面包屑导航 -->
      <Breadcrumb ref="breadcrumbRef" v-model="currentParentId" />

      <!-- 科目列表 -->
      <view class="p-24rpx">
        <view
          v-for="item in currentList"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <!-- 主内容区域：点击进入详情 -->
          <view class="p-24rpx" @click="handleDetail(item)">
            <!-- 第一行：编码名称、状态标签 -->
            <view class="flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.code }} {{ item.name }}
              </view>
              <wd-tag :type="item.status === FmsSubjectStatus.ENABLED ? 'success' : 'danger'" plain>
                {{ item.status === FmsSubjectStatus.ENABLED ? '启用' : '停用' }}
              </wd-tag>
            </view>
            <!-- 第二行：类别、余额方向 -->
            <view class="mt-12rpx text-24rpx text-[#999]">
              类别：{{ getCategoryLabel(item) }} · 余额方向：{{ getDirectionLabel(item) }}
            </view>
            <!-- 第三行：辅助核算、子科目入口 -->
            <view class="mt-12rpx flex items-center justify-between">
              <view class="min-w-0 flex-1 truncate text-24rpx text-[#999]">
                辅助核算：{{ item.auxiliaryTypeNames?.length ? item.auxiliaryTypeNames.join('、') : '无' }}
              </view>
              <view
                v-if="item.children && item.children.length > 0"
                class="flex flex-shrink-0 items-center"
                @click.stop="handleEnterChildren(item)"
              >
                <text class="text-24rpx text-[#1890ff]">子科目 ({{ item.children.length }})</text>
                <wd-icon name="arrow-right" size="12px" color="#1890ff" />
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无科目数据" />
        </view>
      </view>

      <!-- 新增按钮 -->
      <wd-fab
        v-if="canCreate"
        position="right-bottom"
        type="primary"
        :expandable="false"
        @click="handleAdd"
      />
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide />
  </view>
</template>

<script lang="ts" setup>
import type { Subject } from '@/api/fms/config/subject'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { getSubjectList } from '@/api/fms/config/subject'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  FMS_SUBJECT_PARENT_ID_ROOT,
  FmsSubjectStatus,
  FmsSubjectType,
} from '@/pages-fms/utils/constants'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'

const subjectTypeOptions = getIntDictOptions(DICT_TYPE.FMS_SUBJECT_TYPE)

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const fmsStore = useFmsStore()
const loading = ref(false) // 列表加载状态
const list = ref<Subject[]>([]) // 完整科目列表（树形结构）
const type = ref<number>(FmsSubjectType.ASSET) // 当前科目类型

const currentParentId = ref(FMS_SUBJECT_PARENT_ID_ROOT) // 当前层级的父节点编号
const currentList = computed(() => {
  if (currentParentId.value === FMS_SUBJECT_PARENT_ID_ROOT) {
    return list.value.filter(item => item.parentId === FMS_SUBJECT_PARENT_ID_ROOT)
  }
  return findChildren(list.value, currentParentId.value)
}) // 当前层级的科目列表
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()

const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:subject:create'])) // 当前账套可写且有新增权限时才允许新增

/** 返回上一页或上一层级 */
function handleBack() {
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus()
  }
}

/** 获取科目类别名称（字典值为 科目类型-类别） */
function getCategoryLabel(item: Subject): string {
  return getDictLabel(DICT_TYPE.FMS_SUBJECT_CATEGORY, `${item.type}-${item.category}`) || '-'
}

/** 获取余额方向名称 */
function getDirectionLabel(item: Subject): string {
  return getDictLabel(DICT_TYPE.FMS_DEBIT_CREDIT_DIRECTION, item.balanceDirection) || '-'
}

/** 进入子科目层级 */
function handleEnterChildren(item: Subject) {
  breadcrumbRef.value?.enter({ id: item.id!, name: `${item.code} ${item.name}` })
}

/** 查询科目列表（账套 + 科目类型级全量列表，不分页） */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getSubjectList(accountSetId, type.value)
    list.value = handleTree(data)
  } finally {
    loading.value = false
  }
}

/** 重置面包屑并刷新列表 */
function resetAndReload() {
  currentParentId.value = FMS_SUBJECT_PARENT_ID_ROOT
  breadcrumbRef.value?.reset()
  getList()
}

/** 切换科目类型 */
function handleTypeChange() {
  resetAndReload()
}

/** 切换账套 */
function handleAccountSetChange() {
  resetAndReload()
}

/** 新增科目 */
function handleAdd() {
  uni.navigateTo({
    url: `/pages-fms/config/subject/form/index?parentId=${currentParentId.value}&type=${type.value}`,
  })
}

/** 导入科目：Excel 导入需要在 PC 端管理后台操作 */
function handleImportPc() {
  dialog.alert({
    title: '导入科目',
    msg: 'Excel 导入请在 PC 端管理后台操作',
  })
}

/** 导出科目：Excel 导出需要在 PC 端管理后台操作 */
function handleExportPc() {
  dialog.alert({
    title: '导出科目',
    msg: 'Excel 导出请在 PC 端管理后台操作',
  })
}

/** 查看详情 */
function handleDetail(item: Subject) {
  uni.navigateTo({ url: `/pages-fms/config/subject/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getList()
  uni.$on('fms:config:subject:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:subject:reload', getList)
})
</script>
