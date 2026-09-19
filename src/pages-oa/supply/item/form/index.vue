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
          <DeptFormPicker v-model="formData.deptId" label="所属部门" label-width="220rpx" prop="deptId" placeholder="请选择所属部门" />
          <wd-form-item title="物品名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :maxlength="128"
              placeholder="请输入物品名称"
            />
          </wd-form-item>
          <wd-form-item title="物品编码" title-width="220rpx" prop="no">
            <wd-input
              v-model="formData.no"
              clearable
              :maxlength="64"
              placeholder="请输入物品编码"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.category"
            label="类别"
            label-width="220rpx"
            prop="category"
            :dict-type="DICT_TYPE.OA_SUPPLY_CATEGORY"
            placeholder="请选择类别"
          />
          <yd-form-picker
            v-model="formData.manageType"
            label="管理类型"
            label-width="220rpx"
            prop="manageType"
            :dict-type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE"
            placeholder="请选择管理类型"
          />
          <wd-form-item title="规格型号" title-width="220rpx" prop="model">
            <wd-input
              v-model="formData.model"
              clearable
              :maxlength="128"
              placeholder="请输入规格型号"
            />
          </wd-form-item>
          <wd-form-item title="计量单位" title-width="220rpx" prop="unit">
            <wd-input
              v-model="formData.unit"
              clearable
              :maxlength="32"
              placeholder="请输入计量单位"
            />
          </wd-form-item>
          <wd-form-item title="参考单价（元）" title-width="220rpx" prop="referencePrice">
            <wd-input-number
              v-model="formData.referencePrice"
              allow-null
              :min="0"
              :precision="2"
              placeholder="请输入参考单价"
            />
          </wd-form-item>
          <wd-form-item title="库存数量" title-width="220rpx" prop="stockQuantity">
            <wd-input-number
              v-model="formData.stockQuantity"
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="最低库存预警" title-width="220rpx" prop="minStockQuantity">
            <wd-input-number
              v-model="formData.minStockQuantity"
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="物品图片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" directory="oa/supply-item" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio :value="0">
                正常
              </wd-radio>
              <wd-radio :value="1">
                停用
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="排序" title-width="220rpx" prop="sort">
            <wd-input-number
              v-model="formData.sort"
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
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
import type { SupplyItem } from '@/api/oa/supply/item'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createSupplyItem, getSupplyItem, updateSupplyItem } from '@/api/oa/supply/item'
import { DeptFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑办公用品' : '新增办公用品')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<SupplyItem>>({
  id: undefined,
  deptId: undefined,
  name: '',
  no: '',
  category: undefined,
  manageType: undefined,
  model: '',
  unit: '',
  referencePrice: undefined,
  stockQuantity: 0,
  minStockQuantity: 0,
  picUrl: '',
  status: 0,
  sort: 0,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  deptId: [{ required: true, message: '所属部门不能为空' }],
  name: [{ required: true, message: '物品名称不能为空' }, { max: 128 }],
  no: [{ max: 64 }],
  category: [{ required: true, message: '类别不能为空' }],
  manageType: [{ required: true, message: '管理类型不能为空' }],
  stockQuantity: [{ required: true, message: '库存数量不能为空' }],
  minStockQuantity: [{ required: true, message: '最低库存预警不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/supply/item/index')
}

/** 加载用品详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSupplyItem(Number(props.id))
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
      await updateSupplyItem(formData.value)
      toast.success('修改成功')
    } else {
      await createSupplyItem(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('oa:supply-item:reload')
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
