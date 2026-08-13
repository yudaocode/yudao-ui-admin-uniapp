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
          <wd-form-item title="类别名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入类别名称"
              :maxlength="255"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view v-if="!props.id" class="px-24rpx pt-16rpx text-24rpx text-[#999]">
        新增类别保存后为自定义辅助核算类别
      </view>
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
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createAuxiliaryType,
  getAuxiliaryTypeList,
  updateAuxiliaryType,
} from '@/api/fms/config/auxiliary/type'
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
const getTitle = computed(() => props.id ? '编辑类别' : '新增类别')
const formLoading = ref(false) // 表单提交状态
const formData = ref<AuxiliaryType>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  name: '',
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '类别名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/auxiliary/index')
}

/** 加载类别详情（辅助核算类别无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getAuxiliaryTypeList(accountSetId)
  const auxiliaryType = list.find(item => item.id === Number(props.id))
  if (auxiliaryType) {
    formData.value = auxiliaryType
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
      await updateAuxiliaryType(formData.value)
      toast.success('修改成功')
    } else {
      await createAuxiliaryType(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:auxiliary:reload')
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
