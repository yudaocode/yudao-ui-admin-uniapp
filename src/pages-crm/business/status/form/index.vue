<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="状态组名" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入状态组名"
            />
          </wd-form-item>
          <yd-tree-select
            v-model="formData.deptIds"
            :data="deptTree"
            multiple
            label="应用部门"
            label-width="200rpx"
            placeholder="请选择（默认全公司）"
          />
        </wd-cell-group>
      </wd-form>

      <!-- 阶段设置 -->
      <view class="mt-24rpx bg-white">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-30rpx text-[#333] font-semibold">阶段设置</text>
          <wd-button size="small" type="primary" @click="handleAddStatus">
            添加
          </wd-button>
        </view>
        <view
          v-for="(status, index) in formData.statuses"
          :key="index"
          class="mx-24rpx mb-20rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">阶段 {{ index + 1 }}</text>
            <wd-button
              size="small"
              type="danger"
              variant="plain"
              :disabled="formData.statuses.length <= 1"
              @click="handleDeleteStatus(index)"
            >
              删除
            </wd-button>
          </view>
          <wd-input
            v-model="status.name"
            class="mb-16rpx"
            clearable
            placeholder="请输入阶段名称"
          />
          <wd-input-number
            v-model="status.percent"
            :min="0"
            :max="100"
            :precision="2"
            input-type="number"
            allow-null
            placeholder="请输入赢单率（0-100）"
          />
        </view>
        <view class="border-t border-[#f5f5f5] px-24rpx py-20rpx">
          <view class="mb-12rpx text-28rpx text-[#666]">
            结束阶段
          </view>
          <view class="flex flex-wrap gap-12rpx">
            <wd-tag
              v-for="status in DEFAULT_STATUSES"
              :key="status.name"
              type="primary"
              variant="plain"
            >
              {{ status.name }} {{ status.percent }}%
            </wd-tag>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { BusinessStatusType } from '@/api/crm/business/status'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createBusinessStatus,
  DEFAULT_STATUSES,
  getBusinessStatus,
  updateBusinessStatus,
} from '@/api/crm/business/status'
import { getSimpleDeptList } from '@/api/system/dept'
import { delay, navigateBackPlus } from '@/utils'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑商机状态组' : '新增商机状态组')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<BusinessStatusType>({
  name: '',
  deptIds: [],
  statuses: [{ name: '', percent: undefined }],
}) // 表单数据
const deptTree = ref<any[]>([]) // 部门树数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '状态组名不能为空' }],
})

/** 加载部门树 */
async function loadDeptTree() {
  deptTree.value = handleTree(await getSimpleDeptList())
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/business/status/index')
}

/** 添加阶段 */
function handleAddStatus() {
  formData.value.statuses = [
    ...(formData.value.statuses || []),
    { name: '', percent: undefined },
  ]
}

/** 删除阶段 */
function handleDeleteStatus(index: number) {
  if ((formData.value.statuses || []).length <= 1) {
    return
  }
  formData.value.statuses?.splice(index, 1)
}

/** 校验阶段 */
function validateStatuses() {
  const statuses = formData.value.statuses || []
  if (statuses.length === 0) {
    toast.show('请至少添加一个阶段')
    return false
  }
  const invalid = statuses.some((item) => {
    return !item.name || Number.isNaN(Number(item.percent))
  })
  if (invalid) {
    toast.show('请完整填写阶段名称和赢单率')
    return false
  }
  return true
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getBusinessStatus(props.id)
  formData.value = {
    ...data,
    statuses: data.statuses?.length ? data.statuses : [{ name: '', percent: undefined }],
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !validateStatuses()) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateBusinessStatus(formData.value)
      toast.success('修改成功')
    } else {
      await createBusinessStatus(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:businessStatus:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadDeptTree()
  getDetail()
})
</script>
