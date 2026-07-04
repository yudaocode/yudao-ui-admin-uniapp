<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 工作流"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索入口 -->
    <view @click="searchVisible = true">
      <wd-search :placeholder="searchPlaceholder" hide-cancel disabled />
    </view>

    <!-- 工作流列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无 AI 工作流"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ item.code || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="line-clamp-3 text-26rpx text-[#666]">
            {{ item.remark || '-' }}
          </view>
          <view class="mt-12rpx text-22rpx text-[#999]">
            {{ formatDateTime(item.createTime) }}
          </view>
          <view class="mt-20rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="primary" variant="plain" @click="openTest(item)">
              测试
            </wd-button>
            <wd-button size="small" type="warning" variant="plain" @click="openForm('update', item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['ai:workflow:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="openForm('create')"
    />

    <!-- 搜索弹窗 -->
    <wd-popup
      v-model="searchVisible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
    >
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            流程标识
          </view>
          <wd-input v-model="searchForm.code" placeholder="请输入流程标识" clearable />
        </view>
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            流程名称
          </view>
          <wd-input v-model="searchForm.name" placeholder="请输入流程名称" clearable />
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 表单弹窗 -->
    <wd-popup v-model="formVisible" position="bottom" custom-style="max-height: 86vh; overflow: auto;">
      <view v-if="formVisible" class="bg-white">
        <view class="border-b border-[#eee] p-28rpx text-32rpx font-semibold">
          {{ formMode === 'create' ? '新增工作流' : '编辑工作流' }}
        </view>
        <view class="p-24rpx">
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="流程标识" title-width="210rpx" prop="code">
                <wd-input v-model="formData.code" clearable placeholder="请输入流程标识" />
              </wd-form-item>
              <wd-form-item title="流程名称" title-width="210rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入流程名称" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="210rpx">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" clearable />
              </wd-form-item>
              <wd-form-item title="编排 JSON" title-width="210rpx">
                <wd-textarea
                  v-model="formData.graph"
                  placeholder="请输入工作流编排 JSON"
                  :maxlength="8000"
                  show-word-limit
                  clearable
                />
              </wd-form-item>
              <wd-form-item title="状态" title-width="210rpx" center>
                <wd-radio-group v-model="formData.status" type="button">
                  <wd-radio v-for="dict in statusOptions" :key="dict.value" :value="dict.value">
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </view>
        <view class="yd-detail-footer">
          <view class="yd-detail-footer-actions">
            <wd-button class="flex-1" variant="plain" @click="formVisible = false">
              取消
            </wd-button>
            <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleSubmit">
              保存
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 测试弹窗 -->
    <wd-popup v-model="testVisible" position="bottom" custom-style="max-height: 78vh; overflow: auto;">
      <view class="bg-white">
        <view class="border-b border-[#eee] p-28rpx text-32rpx font-semibold">
          测试工作流
        </view>
        <view class="p-24rpx">
          <wd-cell-group border>
            <wd-cell title="流程" :value="testForm.name || '-'" />
            <wd-cell title="标识" :value="testForm.code || '-'" />
            <wd-cell title="输入参数">
              <wd-textarea
                v-model="testForm.input"
                placeholder="请输入测试 JSON 参数"
                :maxlength="4000"
                show-word-limit
                clearable
              />
            </wd-cell>
            <wd-cell title="测试结果">
              <view class="min-h-160rpx whitespace-pre-wrap text-26rpx text-[#666]">
                {{ testResult || '暂无结果' }}
              </view>
            </wd-cell>
          </wd-cell-group>
          <view class="mt-24rpx">
            <wd-button block type="primary" :loading="testing" @click="handleTest">
              执行测试
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WorkflowVO } from '@/api/ai/workflow'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowPage,
  testWorkflow,
  updateWorkflow,
} from '@/api/ai/workflow'
import { useAccess } from '@/hooks/useAccess'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<WorkflowVO[]>([]) // 工作流列表
const pagingRef = ref<any>() // 分页组件引用
const formRef = ref<FormInstance>() // 表单组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const searchVisible = ref(false) // 搜索弹窗显示状态
const searchForm = reactive({
  code: '',
  name: '',
}) // 搜索表单数据
const formVisible = ref(false) // 表单弹窗显示状态
const formMode = ref<'create' | 'update'>('create')
const submitting = ref(false) // 表单提交状态
const formData = ref<WorkflowVO>(createDefaultForm()) // 表单数据
const testVisible = ref(false) // 测试弹窗显示状态
const testing = ref(false) // 测试状态
const testResult = ref('') // 测试结果
const testForm = reactive({
  id: undefined as number | undefined,
  code: '',
  name: '',
  input: '{}',
}) // 测试表单数据
const statusOptions = computed(() => getIntDictOptions(DICT_TYPE.COMMON_STATUS))
const searchPlaceholder = computed(() => {
  const conditions = [searchForm.code && `标识:${searchForm.code}`, searchForm.name && `名称:${searchForm.name}`].filter(Boolean)
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工作流'
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '流程标识不能为空' }],
  name: [{ required: true, message: '流程名称不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** 查询工作流列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkflowPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  queryParams.value = {
    code: searchForm.code || undefined,
    name: searchForm.name || undefined,
  }
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  searchForm.code = ''
  searchForm.name = ''
  queryParams.value = {}
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 打开表单 */
function openForm(mode: 'create' | 'update', item?: WorkflowVO) {
  formMode.value = mode
  formData.value = item ? { ...createDefaultForm(), ...item } : createDefaultForm()
  formVisible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await createWorkflow(formData.value)
      toast.success('新增成功')
    } else {
      await updateWorkflow(formData.value)
      toast.success('修改成功')
    }
    formVisible.value = false
    pagingRef.value?.reload()
  } finally {
    submitting.value = false
  }
}

/** 删除工作流 */
async function handleDelete(item: WorkflowVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该工作流吗？' })
  } catch {
    return
  }
  await deleteWorkflow(item.id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 打开测试 */
function openTest(item: WorkflowVO) {
  testForm.id = item.id
  testForm.code = item.code || ''
  testForm.name = item.name || ''
  testForm.input = '{}'
  testResult.value = ''
  testVisible.value = true
}

/** 执行测试 */
async function handleTest() {
  if (!testForm.id) {
    return
  }
  let input: Record<string, any> = {}
  try {
    input = JSON.parse(testForm.input || '{}')
  } catch {
    toast.warning('测试参数不是合法 JSON')
    return
  }
  testing.value = true
  try {
    const data = await testWorkflow({ id: testForm.id, ...input })
    testResult.value = formatJson(data)
  } finally {
    testing.value = false
  }
}

/** 创建默认表单 */
function createDefaultForm(): WorkflowVO {
  return {
    code: '',
    name: '',
    remark: '',
    graph: '',
    status: CommonStatusEnum.ENABLE,
  }
}
</script>
