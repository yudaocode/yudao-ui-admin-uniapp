<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="代码生成详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <!-- 基本信息 -->
      <wd-cell-group border title="基本信息">
        <wd-cell title="表名称" :value="table?.tableName ?? '-'" />
        <wd-cell title="表描述" :value="table?.tableComment ?? '-'" />
        <wd-cell title="实体类名" :value="table?.className ?? '-'" />
        <wd-cell title="类描述" :value="table?.classComment ?? '-'" />
        <wd-cell title="模块名" :value="table?.moduleName ?? '-'" />
        <wd-cell title="业务名" :value="table?.businessName ?? '-'" />
        <wd-cell title="作者" :value="table?.author ?? '-'" />
        <wd-cell title="模板类型">
          <dict-tag :type="DICT_TYPE.INFRA_CODEGEN_TEMPLATE_TYPE" :value="table?.templateType" />
        </wd-cell>
        <wd-cell title="生成场景">
          <dict-tag :type="DICT_TYPE.INFRA_CODEGEN_SCENE" :value="table?.scene" />
        </wd-cell>
        <wd-cell title="前端类型">
          <dict-tag :type="DICT_TYPE.INFRA_CODEGEN_FRONT_TYPE" :value="table?.frontType" />
        </wd-cell>
        <wd-cell title="备注" :value="table?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(table?.createTime)" />
      </wd-cell-group>

      <!-- 字段定义 -->
      <view class="mt-20rpx flex items-center justify-between px-24rpx py-16rpx">
        <text class="text-28rpx text-[#999]">字段定义（{{ columns.length }}）</text>
        <text
          v-if="hasAccessByCodes(['infra:codegen:update'])"
          class="text-26rpx text-[#1677ff]"
          @click="handleColumns"
        >
          编辑字段
        </text>
      </view>
      <view class="px-24rpx pb-24rpx">
        <view
          v-for="col in columns"
          :key="col.id"
          class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ col.javaField }}
                <text class="ml-8rpx text-24rpx text-[#999] font-normal">{{ col.columnName }}</text>
              </view>
              <wd-tag v-if="col.primaryKey" custom-class="ml-16rpx shrink-0" type="warning" plain>
                主键
              </wd-tag>
            </view>
            <view v-if="col.columnComment" class="mb-12rpx text-26rpx text-[#666]">
              {{ col.columnComment }}
            </view>
            <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">Java 类型：</text>
              <text class="min-w-0 flex-1 truncate">{{ col.javaType }}</text>
              <text class="mx-8rpx shrink-0 text-[#999]">DB：</text>
              <text class="shrink-0">{{ col.dataType }}</text>
            </view>
            <view v-if="col.dictType" class="mb-8rpx flex items-center text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">字典：</text>
              <text class="min-w-0 flex-1 truncate">{{ col.dictType }}</text>
            </view>
            <view class="mt-12rpx flex flex-wrap gap-12rpx">
              <wd-tag v-if="col.createOperation" custom-class="!mr-0" type="primary" plain>
                新增
              </wd-tag>
              <wd-tag v-if="col.updateOperation" custom-class="!mr-0" type="primary" plain>
                修改
              </wd-tag>
              <wd-tag v-if="col.listOperationResult" custom-class="!mr-0" type="primary" plain>
                列表
              </wd-tag>
              <wd-tag v-if="col.listOperation" custom-class="!mr-0" type="primary" plain>
                查询
              </wd-tag>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['infra:codegen:preview'])"
          class="flex-1" variant="plain" @click="handlePreview"
        >
          预览
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:codegen:update'])"
          class="flex-1" type="success" variant="plain" @click="handleSync"
        >
          同步
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:codegen:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:codegen:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { CodegenColumn, CodegenTable } from '@/api/infra/codegen'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { deleteCodegenTable, getCodegenDetail, syncCodegenFromDB } from '@/api/infra/codegen'
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
const table = ref<CodegenTable>() // 表定义
const columns = ref<CodegenColumn[]>([]) // 字段定义
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/codegen/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getCodegenDetail(props.id)
    table.value = data.table
    columns.value = data.columns || []
  } finally {
    toast.close()
  }
}

/** 编辑表信息 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-infra/codegen/form/index?id=${props.id}` })
}

/** 编辑字段配置 */
function handleColumns() {
  uni.navigateTo({ url: `/pages-infra/codegen/columns/index?id=${props.id}` })
}

/** 预览代码 */
function handlePreview() {
  uni.navigateTo({ url: `/pages-infra/codegen/preview/index?id=${props.id}` })
}

/** 同步表结构 */
async function handleSync() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要根据数据库表同步字段定义吗？' })
  } catch {
    return
  }
  try {
    await syncCodegenFromDB(props.id)
    await getDetail()
    toast.success('同步成功')
    uni.$emit('infra:codegen:reload')
  } catch {
    toast.close()
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该代码生成配置吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCodegenTable(props.id)
    toast.success('删除成功')
    uni.$emit('infra:codegen:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 进入页面加载 */
onShow(() => {
  getDetail()
})
</script>
