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
          <ItemCategoryPicker
            v-model="formData.parentId"
            label="上级分类"
            prop="parentId"
            show-root
          />
          <wd-form-item title="分类编号" title-width="180rpx" prop="code">
            <view class="flex items-center gap-12rpx">
              <wd-input v-model="formData.code" class="flex-1" :maxlength="20" clearable placeholder="请输入分类编号" />
              <wd-button size="small" @click="formData.code = generateWmsCode('C')">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="分类名称" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入分类名称" />
          </wd-form-item>
          <wd-form-item title="显示排序" title-width="180rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
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
import type { ItemCategory } from '@/api/wms/md/item/category'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createItemCategory, getItemCategory, updateItemCategory } from '@/api/wms/md/item/category'
import { getIntDictOptions } from '@/hooks/useDict'
import ItemCategoryPicker from '@/pages-wms/md/item/category/components/item-category-picker.vue'
import { generateWmsCode } from '@/pages-wms/utils/order'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  parentId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑商品分类' : '新增商品分类')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ItemCategory>({
  id: undefined,
  parentId: props.parentId ? Number(props.parentId) : 0,
  code: '',
  name: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '上级分类不能为空' }],
  code: [{ required: true, message: '分类编号不能为空' }],
  name: [{ required: true, message: '分类名称不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/item/category/index')
}

/** 加载商品分类详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getItemCategory(Number(props.id))
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
      await updateItemCategory(formData.value)
      toast.success('修改成功')
    } else {
      await createItemCategory(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('wms:item-category:reload')
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
