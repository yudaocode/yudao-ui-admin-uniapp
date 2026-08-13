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
          <wd-form-item title="凭证字" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入凭证字"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="打印标题" title-width="180rpx" prop="printTitle">
            <wd-input
              v-model="formData.printTitle"
              clearable
              placeholder="请输入打印标题"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="是否默认" title-width="180rpx" prop="defaultStatus">
            <wd-radio-group v-model="formData.defaultStatus" type="button">
              <wd-radio :value="true">
                是
              </wd-radio>
              <wd-radio :value="false">
                否
              </wd-radio>
            </wd-radio-group>
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
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createVoucherWord,
  getVoucherWordList,
  updateVoucherWord,
} from '@/api/fms/config/voucher-word'
import { useFmsStore } from '@/pages-fms/store/fms'
import { delay, navigateBackPlus } from '@/utils'
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
const fmsStore = useFmsStore()
const getTitle = computed(() => props.id ? '编辑凭证字' : '新增凭证字')
const formLoading = ref(false) // 表单提交状态
const formData = ref<VoucherWord>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  name: '',
  printTitle: '记账凭证',
  defaultStatus: false,
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '凭证字不能为空' }],
  defaultStatus: [{ required: true, message: '请选择是否默认' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/voucher-word/index')
}

/** 加载凭证字详情（凭证字无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getVoucherWordList(accountSetId)
  const voucherWord = list.find(item => item.id === Number(props.id))
  if (voucherWord) {
    formData.value = voucherWord
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
      await updateVoucherWord(formData.value)
      toast.success('修改成功')
    } else {
      await createVoucherWord(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:voucher-word:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  formData.value.accountSetId = fmsStore.accountSet?.id || 0
  await getDetail()
})
</script>
