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
          <wd-form-item title="姓名" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :maxlength="50"
              placeholder="请输入姓名"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.categoryId"
            label="分类名称"
            label-width="180rpx"
            prop="categoryId"
            :columns="categoryOptions"
            placeholder="请选择分类"
            clearable
          />
          <wd-form-item title="性别" title-width="180rpx" prop="sex" center>
            <wd-radio-group v-model="formData.sex" type="button">
              <wd-radio :value="1">
                男
              </wd-radio>
              <wd-radio :value="2">
                女
              </wd-radio>
              <wd-radio :value="0">
                未知
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="手机号码" title-width="180rpx" prop="mobile">
            <wd-input
              v-model="formData.mobile"
              clearable
              :maxlength="20"
              placeholder="请输入手机号码"
            />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="180rpx" prop="email">
            <wd-input
              v-model="formData.email"
              clearable
              :maxlength="100"
              placeholder="请输入邮箱"
            />
          </wd-form-item>
          <wd-form-item title="公司电话" title-width="180rpx" prop="companyPhone">
            <wd-input
              v-model="formData.companyPhone"
              clearable
              :maxlength="30"
              placeholder="请输入公司电话"
            />
          </wd-form-item>
          <wd-form-item title="公司名称" title-width="180rpx" prop="companyName">
            <wd-input
              v-model="formData.companyName"
              clearable
              :maxlength="100"
              placeholder="请输入公司名称"
            />
          </wd-form-item>
          <wd-form-item title="联系地址" title-width="180rpx" prop="address">
            <wd-input
              v-model="formData.address"
              clearable
              :maxlength="255"
              placeholder="请输入联系地址"
            />
          </wd-form-item>
          <wd-form-item title="头像" title-width="180rpx" prop="avatar">
            <yd-upload-img v-model="formData.avatar" directory="oa/contact" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Contact } from '@/api/oa/contact'
import type { ContactCategory } from '@/api/oa/contact/category'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createContact, getContact, updateContact } from '@/api/oa/contact'
import { getSimpleContactCategoryList } from '@/api/oa/contact/category'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑联系人' : '新增联系人')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Contact>>({
  id: undefined,
  name: '',
  categoryId: undefined,
  sex: 0,
  mobile: '',
  email: '',
  companyPhone: '',
  companyName: '',
  address: '',
  avatar: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '姓名不能为空' }],
  mobile: [{ required: true, message: '手机号码不能为空' }],
  email: [
    { required: true, message: '邮箱不能为空' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用
const categoryList = ref<ContactCategory[]>([]) // 分类选项
const categoryOptions = computed(() => // 分类选择器选项
  categoryList.value.map(item => ({ label: item.name, value: item.id })))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/contact/index')
}

/** 加载联系人详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getContact(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = formData.value as Contact
    if (props.id) {
      await updateContact(data)
      toast.success('修改成功')
    } else {
      await createContact(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:contact:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  categoryList.value = await getSimpleContactCategoryList()
  getDetail()
})
</script>
