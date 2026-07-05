<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="供应商编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="供应商名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入供应商名称" clearable />
          </wd-form-item>
          <wd-form-item title="供应商简称" title-width="220rpx" prop="nickname">
            <wd-input v-model="formData.nickname" placeholder="请输入供应商简称" clearable />
          </wd-form-item>
          <wd-form-item title="英文名称" title-width="220rpx" prop="englishName">
            <wd-input v-model="formData.englishName" placeholder="请输入英文名称" clearable />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.level"
            label="供应商等级"
            label-width="220rpx"
            prop="level"
            :dict-type="DICT_TYPE.MES_VENDOR_LEVEL"
            dict-kind="str"
            placeholder="请选择供应商等级"
          />
          <wd-form-item title="供应商简介" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入供应商简介" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="供应商 LOGO" title-width="220rpx" prop="logo">
            <yd-upload-img v-model="formData.logo" directory="mes/md/vendor" />
          </wd-form-item>
          <wd-form-item title="供应商地址" title-width="220rpx" prop="address">
            <wd-textarea v-model="formData.address" placeholder="请输入供应商地址" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="官网地址" title-width="220rpx" prop="website">
            <wd-input v-model="formData.website" placeholder="请输入官网地址" clearable />
          </wd-form-item>
          <wd-form-item title="邮箱地址" title-width="220rpx" prop="email">
            <wd-input v-model="formData.email" placeholder="请输入邮箱地址" clearable />
          </wd-form-item>
          <wd-form-item title="供应商电话" title-width="220rpx" prop="telephone">
            <wd-input v-model="formData.telephone" placeholder="请输入供应商电话" clearable />
          </wd-form-item>
          <wd-form-item title="供应商评分" title-width="220rpx" prop="score" center>
            <wd-input-number
              :model-value="formData.score ?? ''"
              allow-null
              :min="0"
              :max="100"
              :precision="0"
              @update:model-value="value => formData.score = toFiniteNumber(value)"
            />
          </wd-form-item>
          <wd-form-item title="联系人1" title-width="220rpx" prop="contact1Name">
            <wd-input v-model="formData.contact1Name" placeholder="请输入联系人1" clearable />
          </wd-form-item>
          <wd-form-item title="联系人1-电话" title-width="220rpx" prop="contact1Telephone">
            <wd-input v-model="formData.contact1Telephone" placeholder="请输入联系人1电话" clearable />
          </wd-form-item>
          <wd-form-item title="联系人1-邮箱" title-width="220rpx" prop="contact1Email">
            <wd-input v-model="formData.contact1Email" placeholder="请输入联系人1邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="联系人2" title-width="220rpx" prop="contact2Name">
            <wd-input v-model="formData.contact2Name" placeholder="请输入联系人2" clearable />
          </wd-form-item>
          <wd-form-item title="联系人2-电话" title-width="220rpx" prop="contact2Telephone">
            <wd-input v-model="formData.contact2Telephone" placeholder="请输入联系人2电话" clearable />
          </wd-form-item>
          <wd-form-item title="联系人2-邮箱" title-width="220rpx" prop="contact2Email">
            <wd-input v-model="formData.contact2Email" placeholder="请输入联系人2邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="信用代码" title-width="220rpx" prop="creditCode">
            <wd-input v-model="formData.creditCode" placeholder="请输入统一社会信用代码" clearable />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="220rpx"
            prop="status"
            :dict-type="DICT_TYPE.COMMON_STATUS"
            placeholder="请选择状态"
          />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendor } from '@/api/mes/md/vendor'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createVendor, getVendor, updateVendor } from '@/api/mes/md/vendor'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑供应商' : '新增供应商')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<MdVendor>({
  id: undefined,
  code: '',
  name: '',
  nickname: '',
  englishName: '',
  description: '',
  logo: '',
  level: '',
  score: undefined,
  address: '',
  website: '',
  email: '',
  telephone: '',
  contact1Name: '',
  contact1Telephone: '',
  contact1Email: '',
  contact2Name: '',
  contact2Telephone: '',
  contact2Email: '',
  creditCode: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '供应商编码不能为空' }],
  name: [{ required: true, message: '供应商名称不能为空' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
  contact1Email: [{ type: 'email', message: '请输入正确的联系人邮箱' }],
  contact2Email: [{ type: 'email', message: '请输入正确的联系人邮箱' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/vendor/index')
}

/** 加载供应商详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getVendor(Number(props.id))
}

/** 生成供应商编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode('MD_VENDOR_CODE')
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
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
      await updateVendor(formData.value)
      toast.success('修改成功')
    } else {
      await createVendor(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:vendor:reload')
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
