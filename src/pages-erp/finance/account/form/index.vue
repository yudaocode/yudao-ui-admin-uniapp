<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="账户名称" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入账户名称" clearable />
          </wd-form-item>
          <wd-form-item title="账户编码" title-width="180rpx" prop="no">
            <wd-input v-model="formData.no" placeholder="请输入账户编码" clearable />
          </wd-form-item>
          <wd-form-item title="账户状态" title-width="180rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="排序" title-width="180rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Account } from '@/api/erp/finance/account'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createAccount, getAccount, updateAccount } from '@/api/erp/finance/account'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑结算账户' : '新增结算账户')
const formData = ref<Account>({
  id: undefined,
  name: '',
  no: '',
  remark: '',
  status: CommonStatusEnum.ENABLE,
  sort: 0,
}) // 表单数据
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formSchema = createFormSchema({
  name: [{ required: true, message: '账户名称不能为空' }],
  no: [{ required: true, message: '账户编码不能为空' }],
  status: [{ required: true, message: '账户状态不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/account/index')
}

/** 加载结算账户详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAccount(props.id)
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
      await updateAccount(formData.value)
      toast.success('修改成功')
    } else {
      await createAccount(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:account:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
