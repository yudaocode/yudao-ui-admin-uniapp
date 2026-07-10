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
          <wd-form-item title="联系人姓名" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入联系人姓名" clearable />
          </wd-form-item>
          <CustomerFormPicker v-model="formData.customerId" prop="customerId" />
          <UserFormPicker v-model="formData.ownerUserId" label="负责人" prop="ownerUserId" placeholder="请选择负责人" :disabled="!!props.id" />
          <wd-form-item title="手机" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" placeholder="请输入手机" clearable />
          </wd-form-item>
          <wd-form-item title="电话" title-width="200rpx" prop="telephone">
            <wd-input v-model="formData.telephone" placeholder="请输入电话" clearable />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" placeholder="请输入邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="微信" title-width="200rpx" prop="wechat">
            <wd-input v-model="formData.wechat" placeholder="请输入微信" clearable />
          </wd-form-item>
          <wd-form-item title="QQ" title-width="200rpx" prop="qq">
            <wd-input v-model="formData.qq" placeholder="请输入 QQ" clearable />
          </wd-form-item>
          <wd-form-item title="职位" title-width="200rpx" prop="post">
            <wd-input v-model="formData.post" placeholder="请输入职位" clearable />
          </wd-form-item>
          <wd-form-item title="关键决策人" title-width="200rpx" prop="master">
            <wd-switch v-model="formData.master" />
          </wd-form-item>
          <yd-form-picker v-model="formData.sex" label="性别" prop="sex" :dict-type="DICT_TYPE.SYSTEM_USER_SEX" placeholder="请选择性别" />
          <ContactFormPicker v-model="formData.parentId" label="直属上级" prop="parentId" placeholder="请选择直属上级" :option-filter="parentFilter" />
          <yd-tree-select v-model="formData.areaId" :data="areaTree" label="地区" prop="areaId" label-width="200rpx" placeholder="请选择地区" />
          <wd-form-item title="详细地址" title-width="200rpx" prop="detailAddress">
            <wd-input v-model="formData.detailAddress" placeholder="请输入详细地址" clearable />
          </wd-form-item>
          <wd-form-item title="下次联系时间" title-width="200rpx" prop="contactNextTime" is-link placeholder="请选择下次联系时间" :value="formatDateTime(formData.contactNextTime)" @click="pickerVisible.contactNextTime = true" />
          <wd-datetime-picker v-model="formData.contactNextTime" v-model:visible="pickerVisible.contactNextTime" title="请选择下次联系时间" type="datetime" />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

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
import type { Contact } from '@/api/crm/contact'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createContact, getContact, updateContact } from '@/api/crm/contact'
import { getAreaTree } from '@/api/system/area'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ContactFormPicker from '@/pages-crm/contact/components/contact-form-picker.vue'
import CustomerFormPicker from '@/pages-crm/customer/components/customer-form-picker.vue'

const props = defineProps<{ id?: number | any, customerId?: number | any, ownerUserId?: number | any, parentId?: number | any, businessId?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑联系人' : '新增联系人')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Contact>({
  id: undefined,
  name: '',
  customerId: undefined,
  ownerUserId: undefined,
  mobile: '',
  telephone: '',
  email: '',
  wechat: '',
  qq: '',
  post: '',
  master: false,
  sex: undefined,
  parentId: undefined,
  areaId: undefined,
  detailAddress: '',
  contactNextTime: undefined,
  remark: '',
  businessId: undefined,
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const areaTree = ref<any[]>([]) // 地区树数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '联系人姓名不能为空' }],
  customerId: [{ required: true, message: '客户名称不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机' }],
  email: [{ type: 'email', message: '请输入正确的邮箱' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/contact/index')
}

/** 加载联系人详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    const userId = userStore.userInfo?.userId
    if (userId && userId !== -1) {
      formData.value.ownerUserId = userId
    }
    // 路由参数预填（客户、负责人、直属上级）
    if (props.customerId) {
      formData.value.customerId = Number(props.customerId)
    }
    if (props.ownerUserId) {
      formData.value.ownerUserId = Number(props.ownerUserId)
    }
    if (props.parentId) {
      formData.value.parentId = Number(props.parentId)
    }
    if (props.businessId) {
      formData.value.businessId = Number(props.businessId)
    }
    return
  }
  formData.value = await getContact(Number(props.id))
}

/** 直属上级候选排除自身（编辑态不能把自己设为上级） */
function parentFilter(raw: Record<string, any>) {
  return Number(raw.id) !== Number(formData.value.id)
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
      await updateContact(formData.value)
      toast.success('修改成功')
    } else {
      await createContact(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:contact:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
  await getDetail()
})
</script>
