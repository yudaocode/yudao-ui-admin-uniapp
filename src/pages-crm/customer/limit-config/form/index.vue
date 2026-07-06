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
          <UserPicker
            v-model="formData.userIds"
            type="checkbox"
            label="适用人群"
            prop="userIds"
            label-width="220rpx"
            placeholder="请选择适用人群"
          />
          <yd-tree-select
            v-model="formData.deptIds"
            :data="deptTree"
            multiple
            show-checkbox
            filterable
            show-toolbar
            label="适用部门"
            prop="deptIds"
            label-width="220rpx"
            placeholder="请选择适用部门"
          />
          <wd-form-item :title="maxCountLabel" title-width="220rpx" prop="maxCount">
            <wd-input
              v-model.number="formData.maxCount"
              type="number"
              clearable
              placeholder="请输入数量上限"
            />
          </wd-form-item>
          <wd-form-item
            v-if="formData.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT"
            title="成交客户占用"
            title-width="220rpx"
            prop="dealCountEnabled"
            center
          >
            <wd-switch v-model="formData.dealCountEnabled" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
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
import type {FormInstance} from '@wot-ui/ui/components/wd-form/types'
import type {CustomerLimitConfig} from '@/api/crm/customer/limitConfig'
import {
  createCustomerLimitConfig,
  getCustomerLimitConfig,
  LimitConfType,
  updateCustomerLimitConfig
} from '@/api/crm/customer/limitConfig'
import type {Dept} from '@/api/system/dept'
import {getSimpleDeptList} from '@/api/system/dept'
import {useToast} from '@wot-ui/ui/components/wd-toast'
import {computed, onMounted, ref} from 'vue'
import UserPicker from '@/components/system-select/user-picker.vue'
import {delay, navigateBackPlus} from '@/utils'
import {handleTree} from '@/utils/tree'
import {createFormSchema} from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  type?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑配置' : '新增配置')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const deptTree = ref<Dept[]>([]) // 部门树
const formData = ref<CustomerLimitConfig>({
  // 新增时按 type 入参区分限额类型；编辑时由详情覆盖
  type: Number(props.type) || LimitConfType.CUSTOMER_QUANTITY_LIMIT,
  userIds: [],
  deptIds: [],
  maxCount: undefined,
  dealCountEnabled: false,
}) // 表单数据
const maxCountLabel = computed(() => {
  return formData.value.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT ? '拥有客户数上限' : '锁定客户数上限'
})
const formSchema = createFormSchema({
  maxCount: [{ required: true, message: '数量上限不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载部门树 */
async function loadDeptTree() {
  deptTree.value = handleTree(await getSimpleDeptList())
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getCustomerLimitConfig(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateCustomerLimitConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createCustomerLimitConfig(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:customer-limit-config:reload')
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
