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
          <wd-form-item title="品牌编号" title-width="180rpx" prop="code">
            <view class="flex items-center gap-12rpx">
              <wd-input v-model="formData.code" class="flex-1" :maxlength="20" clearable placeholder="请输入品牌编号" />
              <wd-button size="small" @click="formData.code = generateWmsCode('B')">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="品牌名称" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" :maxlength="30" clearable placeholder="请输入品牌名称" />
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
import type { ItemBrand } from '@/api/wms/md/item/brand'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createItemBrand, getItemBrand, updateItemBrand } from '@/api/wms/md/item/brand'
import { generateWmsCode } from '@/pages-wms/utils/order'
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
const getTitle = computed(() => props.id ? '编辑商品品牌' : '新增商品品牌')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ItemBrand>({
  id: undefined,
  code: undefined,
  name: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '品牌编号不能为空' }],
  name: [{ required: true, message: '品牌名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/item/brand/index')
}

/** 加载商品品牌详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getItemBrand(Number(props.id))
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
      await updateItemBrand(formData.value)
      toast.success('修改成功')
    } else {
      await createItemBrand(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('wms:item-brand:reload')
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
