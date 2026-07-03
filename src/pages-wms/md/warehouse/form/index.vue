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
          <wd-form-item title="仓库名称" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" :maxlength="50" clearable placeholder="请输入仓库名称" />
          </wd-form-item>
          <wd-form-item title="仓库编号" title-width="180rpx" prop="code">
            <view class="flex items-center gap-12rpx">
              <wd-input v-model="formData.code" class="flex-1" :maxlength="20" clearable placeholder="请输入仓库编号" />
              <wd-button size="small" @click="formData.code = generateWmsCode('W')">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="排序" title-width="180rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="255"
              show-word-limit
              clearable
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
import type { Warehouse } from '@/api/wms/md/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWarehouse, getWarehouse, updateWarehouse } from '@/api/wms/md/warehouse'
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
const getTitle = computed(() => props.id ? '编辑仓库' : '新增仓库')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Warehouse>({
  id: undefined,
  code: undefined,
  name: undefined,
  sort: 0,
  remark: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '仓库编号不能为空' }],
  name: [{ required: true, message: '仓库名称不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/warehouse/index')
}

/** 加载仓库详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getWarehouse(Number(props.id))
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
      await updateWarehouse(formData.value)
      toast.success('修改成功')
    } else {
      await createWarehouse(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('wms:warehouse:reload')
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
