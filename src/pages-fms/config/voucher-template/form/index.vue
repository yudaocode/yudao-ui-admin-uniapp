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
          <yd-form-picker
            v-model="formData.categoryId"
            label="模板分类"
            label-width="180rpx"
            prop="categoryId"
            :columns="categoryOptions"
            placeholder="请选择模板分类"
          />
          <wd-form-item title="模板名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入模板名称"
              :maxlength="255"
            />
          </wd-form-item>
        </wd-cell-group>

        <!-- 模板分录 -->
        <view class="p-24rpx">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            模板分录
          </view>
          <TemplateEntryForm
            ref="entryFormRef"
            v-model="formData.entries"
            :account-set-id="fmsStore.accountSet?.id"
            :subjects="subjects"
          />
        </view>
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
import type { Subject } from '@/api/fms/config/subject'
import type { VoucherTemplate, VoucherTemplateEntry } from '@/api/fms/config/voucher-template'
import type { VoucherTemplateCategory } from '@/api/fms/config/voucher-template-category'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getSubjectList } from '@/api/fms/config/subject'
import {
  createVoucherTemplate,
  getVoucherTemplateList,
  updateVoucherTemplate,
} from '@/api/fms/config/voucher-template'
import { getVoucherTemplateCategorySimpleList } from '@/api/fms/config/voucher-template-category'
import { useFmsStore } from '@/pages-fms/store/fms'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import TemplateEntryForm from '../components/template-entry-form.vue'

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
const getTitle = computed(() => props.id ? '编辑凭证模板' : '新增凭证模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref({ // 表单数据
  id: undefined as number | undefined,
  accountSetId: 0,
  categoryId: undefined as number | undefined,
  name: '',
  entries: [] as VoucherTemplateEntry[],
})
const formSchema = createFormSchema({
  categoryId: [{ required: true, message: '请选择模板分类' }],
  name: [{ required: true, message: '模板名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const entryFormRef = ref<InstanceType<typeof TemplateEntryForm>>() // 分录编辑组件引用
const categories = ref<VoucherTemplateCategory[]>([]) // 模板分类列表
const subjects = ref<Subject[]>([]) // 平铺科目列表，用于分录科目选择与校验
const categoryOptions = computed(() => categories.value.map(item => ({ label: item.name, value: item.id! }))) // 模板分类选项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/voucher-template/index')
}

/** 加载模板详情（凭证模板无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getVoucherTemplateList(accountSetId)
  const template = list.find(item => item.id === Number(props.id))
  if (template) {
    template.entries.forEach((entry) => {
      entry.auxiliaries = entry.auxiliaries || []
    })
    formData.value = {
      id: template.id,
      accountSetId: template.accountSetId,
      categoryId: template.categoryId,
      name: template.name,
      entries: template.entries,
    }
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!entryFormRef.value?.validate()) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !formData.value.categoryId) {
    return
  }

  formLoading.value = true
  try {
    const data: VoucherTemplate = {
      id: formData.value.id,
      accountSetId,
      name: formData.value.name,
      categoryId: formData.value.categoryId,
      entries: formData.value.entries.map(entry => ({
        digest: entry.digest.trim(),
        subjectId: entry.subjectId!,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        auxiliaries: entry.auxiliaries
          .filter(item => item.itemId)
          .map(item => ({ type: item.type, typeId: item.typeId, itemId: item.itemId!, name: item.name })),
      })),
    }
    if (props.id) {
      await updateVoucherTemplate(data)
      toast.success('修改成功')
    } else {
      await createVoucherTemplate(data)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:voucher-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  const accountSetId = fmsStore.accountSet?.id
  formData.value.accountSetId = accountSetId || 0
  if (accountSetId) {
    ;[categories.value, subjects.value] = await Promise.all([
      getVoucherTemplateCategorySimpleList(accountSetId),
      getSubjectList(accountSetId),
    ])
  }
  await getDetail()
  // 新增时预置两条空白分录，后端要求模板至少两条分录
  if (!props.id && formData.value.entries.length === 0) {
    formData.value.entries = [
      { digest: '', subjectId: 0, auxiliaries: [] },
      { digest: '', subjectId: 0, auxiliaries: [] },
    ]
  }
})
</script>
