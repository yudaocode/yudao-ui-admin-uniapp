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
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-input
            v-model="formData.name"
            label="模板名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入模板名称"
          />
          <wd-input
            v-model="formData.code"
            label="模板编码"
            label-width="200rpx"
            prop="code"
            clearable
            placeholder="请输入模板编码"
          />
          <wd-cell title="邮箱账号" title-width="200rpx" prop="accountId" center>
            <wd-picker
              v-model="formData.accountId"
              :columns="accountList"
              label-key="mail"
              value-key="id"
              placeholder="请选择邮箱账号"
            />
          </wd-cell>
          <wd-input
            v-model="formData.nickname"
            label="发送人名称"
            label-width="200rpx"
            clearable
            placeholder="请输入发送人名称"
          />
          <wd-input
            v-model="formData.title"
            label="模板标题"
            label-width="200rpx"
            prop="title"
            clearable
            placeholder="请输入模板标题"
          />
          <wd-textarea
            v-model="formData.content"
            label="模板内容"
            label-width="200rpx"
            prop="content"
            clearable
            placeholder="请输入模板内容"
            :rows="4"
          />
          <wd-cell title="开启状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            clearable
            placeholder="请输入备注"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { MailAccount } from '@/api/system/mail/account'
import type { MailTemplate } from '@/api/system/mail/template'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSimpleMailAccountList } from '@/api/system/mail/account'
import { createMailTemplate, getMailTemplate, updateMailTemplate } from '@/api/system/mail/template'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

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
const getTitle = computed(() => props.id ? '编辑邮件模板' : '新增邮件模板')
const formLoading = ref(false)
const formData = ref<MailTemplate>({
  id: undefined,
  name: '',
  code: '',
  accountId: undefined,
  nickname: '',
  title: '',
  content: '',
  status: 0,
  remark: '',
})
const formRules = {
  name: [{ required: true, message: '模板名称不能为空' }],
  code: [{ required: true, message: '模板编码不能为空' }],
  accountId: [{ required: true, message: '邮箱账号不能为空' }],
  title: [{ required: true, message: '模板标题不能为空' }],
  content: [{ required: true, message: '模板内容不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
}
const formRef = ref()

/** 邮箱账号列表 */
const accountList = ref<MailAccount[]>([])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 加载邮箱账号列表 */
async function loadAccountList() {
  accountList.value = await getSimpleMailAccountList()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMailTemplate(props.id)
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
      await updateMailTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createMailTemplate(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadAccountList()
  await getDetail()
})
</script>

<style lang="scss" scoped>
</style>
