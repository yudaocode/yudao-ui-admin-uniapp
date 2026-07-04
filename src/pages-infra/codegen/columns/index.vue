<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="字段配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view
          v-for="(col, index) in columns"
          :key="col.id ?? index"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="openColumn(index)"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ col.javaField }}
              <text class="ml-8rpx text-24rpx text-[#999] font-normal">{{ col.columnName }}</text>
            </view>
            <wd-icon name="arrow-right" size="14px" color="#ccc" />
          </view>
          <view v-if="col.columnComment" class="mb-12rpx text-26rpx text-[#666]">
            {{ col.columnComment }}
          </view>
          <view class="flex flex-wrap gap-12rpx">
            <wd-tag v-if="col.createOperation" custom-class="!mr-0" type="primary" plain>
              插入
            </wd-tag>
            <wd-tag v-if="col.updateOperation" custom-class="!mr-0" type="primary" plain>
              编辑
            </wd-tag>
            <wd-tag v-if="col.listOperationResult" custom-class="!mr-0" type="primary" plain>
              列表
            </wd-tag>
            <wd-tag v-if="col.listOperation" custom-class="!mr-0" type="primary" plain>
              查询
            </wd-tag>
            <text v-if="!hasOperation(col)" class="text-24rpx text-[#bbb]">未启用任何操作</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部保存 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="saving" @click="handleSubmit">
        保存
      </wd-button>
    </view>

    <!-- 字段编辑弹层 -->
    <wd-popup v-model="popup.visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] flex flex-col">
        <view class="border-b border-[#f0f0f0] px-32rpx py-28rpx text-center text-32rpx text-[#333] font-semibold">
          {{ popup.form.javaField || '字段配置' }}
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1">
          <wd-cell-group border>
            <wd-cell title="字段描述" title-width="200rpx">
              <wd-input v-model="popup.form.columnComment" placeholder="请输入字段描述" />
            </wd-cell>
            <wd-cell title="Java 属性" title-width="200rpx">
              <wd-input v-model="popup.form.javaField" placeholder="请输入 Java 属性名" />
            </wd-cell>
            <wd-cell title="Java 类型" title-width="200rpx">
              <wd-input v-model="popup.form.javaType" placeholder="请输入 Java 类型" />
            </wd-cell>
            <yd-form-picker
              v-model="popup.form.htmlType"
              label="显示类型"
              :columns="HTML_TYPE_OPTIONS"
              label-key="label"
              value-key="value"
            />
            <wd-cell title="字典类型" title-width="200rpx">
              <wd-input v-model="popup.form.dictType" placeholder="选填，如 system_user_sex" />
            </wd-cell>
            <wd-cell title="插入" title-width="200rpx" center>
              <wd-switch v-model="popup.form.createOperation" size="20px" />
            </wd-cell>
            <wd-cell title="编辑" title-width="200rpx" center>
              <wd-switch v-model="popup.form.updateOperation" size="20px" />
            </wd-cell>
            <wd-cell title="列表" title-width="200rpx" center>
              <wd-switch v-model="popup.form.listOperationResult" size="20px" />
            </wd-cell>
            <wd-cell title="查询" title-width="200rpx" center>
              <wd-switch v-model="popup.form.listOperation" size="20px" />
            </wd-cell>
            <yd-form-picker
              v-if="popup.form.listOperation"
              v-model="popup.form.listOperationCondition"
              label="查询方式"
              :columns="CONDITION_OPTIONS"
              label-key="label"
              value-key="value"
            />
          </wd-cell-group>
        </scroll-view>
        <view class="flex gap-20rpx p-32rpx">
          <wd-button class="flex-1" variant="plain" @click="popup.visible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="saveColumn">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { CodegenColumn } from '@/api/infra/codegen'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, reactive, ref } from 'vue'
import { getCodegenDetail, updateCodegenTable } from '@/api/infra/codegen'
import { delay, navigateBackPlus } from '@/utils'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const HTML_TYPE_OPTIONS = [ // 显示类型
  { label: '文本框', value: 'input' },
  { label: '文本域', value: 'textarea' },
  { label: '下拉框', value: 'select' },
  { label: '单选框', value: 'radio' },
  { label: '复选框', value: 'checkbox' },
  { label: '日期控件', value: 'datetime' },
  { label: '图片上传', value: 'imageUpload' },
  { label: '文件上传', value: 'fileUpload' },
  { label: '富文本控件', value: 'editor' },
]
const CONDITION_OPTIONS = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'BETWEEN'].map(v => ({ label: v, value: v })) // 查询方式

const toast = useToast()
const tableForm = ref<Record<string, any>>({}) // 表定义（原样回传）
const columns = ref<CodegenColumn[]>([]) // 字段定义
const saving = ref(false) // 保存状态
const popup = reactive({ visible: false, index: -1, form: {} as CodegenColumn }) // 字段编辑弹层

/** 字段是否启用任意操作 */
function hasOperation(col: CodegenColumn) {
  return col.createOperation || col.updateOperation || col.listOperationResult || col.listOperation
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 打开字段编辑弹层 */
function openColumn(index: number) {
  popup.index = index
  popup.form = { ...columns.value[index] }
  popup.visible = true
}

/** 确定字段编辑（写回内存，整体保存时提交；后端这些字段 @NotNull） */
function saveColumn() {
  const f = popup.form
  if (!f.columnComment || !f.javaField || !f.javaType || !f.htmlType) {
    toast.warning('字段描述 / Java 属性 / Java 类型 / 显示类型不能为空')
    return
  }
  if (f.listOperation && !f.listOperationCondition) {
    toast.warning('请选择查询方式')
    return
  }
  if (popup.index >= 0) {
    columns.value[popup.index] = { ...popup.form }
  }
  popup.visible = false
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getCodegenDetail(props.id)
  tableForm.value = data.table as Record<string, any>
  columns.value = data.columns || []
}

/** 保存全部字段 */
async function handleSubmit() {
  saving.value = true
  try {
    await updateCodegenTable({ table: tableForm.value as any, columns: columns.value })
    toast.success('保存成功')
    uni.$emit('infra:codegen:reload')
    delay(handleBack)
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
