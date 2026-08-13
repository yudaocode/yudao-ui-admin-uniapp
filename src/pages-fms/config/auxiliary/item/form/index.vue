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
          <wd-form-item title="项目编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入编码"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="项目名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入名称"
              :maxlength="255"
            />
          </wd-form-item>
          <template v-if="isInventory">
            <wd-form-item title="规格" title-width="180rpx" prop="specification">
              <wd-input
                v-model="formData.specification"
                clearable
                placeholder="请输入规格"
                :maxlength="255"
              />
            </wd-form-item>
            <wd-form-item title="单位" title-width="180rpx" prop="unit">
              <wd-input
                v-model="formData.unit"
                clearable
                placeholder="请输入单位"
                :maxlength="255"
              />
            </wd-form-item>
          </template>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="500"
            />
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
import type { AuxiliaryItem } from '@/api/fms/config/auxiliary/item'
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createAuxiliaryItem,
  getAuxiliaryItemPage,
  updateAuxiliaryItem,
} from '@/api/fms/config/auxiliary/item'
import { getAuxiliaryTypeList } from '@/api/fms/config/auxiliary/type'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsAuxiliaryType } from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  auxiliaryTypeId?: number | any
  code?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const fmsStore = useFmsStore()
const auxiliaryType = ref<AuxiliaryType>() // 当前辅助核算类别
const isInventory = computed(() => auxiliaryType.value?.type === FmsAuxiliaryType.INVENTORY) // 是否存货类别
const getTitle = computed(() => props.id ? '编辑项目' : `新增${auxiliaryType.value?.name || '项目'}`)
const formLoading = ref(false) // 表单提交状态
const formData = ref<AuxiliaryItem>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  auxiliaryTypeId: 0,
  code: '',
  name: '',
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '编码不能为空' }],
  name: [{ required: true, message: '名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-fms/config/auxiliary/item/index?auxiliaryTypeId=${props.auxiliaryTypeId}`)
}

/** 加载当前类别信息（辅助核算类别无 /get 接口，从账套级列表中查找） */
async function loadAuxiliaryType() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !props.auxiliaryTypeId) {
    return
  }
  const typeList = await getAuxiliaryTypeList(accountSetId)
  auxiliaryType.value = typeList.find(item => item.id === Number(props.auxiliaryTypeId))
}

/** 加载项目详情（项目无 /get 接口，通过类别分页 + 编码关键词定位，编码在类别内唯一） */
async function getDetail() {
  if (!props.id || !props.code) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !props.auxiliaryTypeId) {
    return
  }
  const data = await getAuxiliaryItemPage({
    accountSetId,
    auxiliaryTypeId: Number(props.auxiliaryTypeId),
    search: props.code,
    pageNo: 1,
    pageSize: 200,
  })
  const auxiliaryItem = data.list.find(item => item.id === Number(props.id))
  if (auxiliaryItem) {
    formData.value = auxiliaryItem
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
    // 非存货类别不提交规格、单位
    if (!isInventory.value) {
      formData.value.specification = undefined
      formData.value.unit = undefined
    }
    if (props.id) {
      await updateAuxiliaryItem(formData.value)
      toast.success('修改成功')
    } else {
      await createAuxiliaryItem(formData.value)
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
  formData.value.auxiliaryTypeId = Number(props.auxiliaryTypeId) || 0
  await loadAuxiliaryType()
  await getDetail()
})
</script>
