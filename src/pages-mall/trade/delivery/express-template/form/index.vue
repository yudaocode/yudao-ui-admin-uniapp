<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <view class="p-24rpx">
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="模板名称" title-width="200rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入模板名称" />
              </wd-form-item>
              <wd-form-item title="计费方式" title-width="200rpx" prop="chargeMode" center>
                <wd-radio-group v-model="formData.chargeMode" type="button">
                  <wd-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.EXPRESS_CHARGE_MODE)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item title="排序" title-width="200rpx" prop="sort" center>
                <wd-input-number v-model="formData.sort" :min="0" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 计费区域 -->
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              计费区域
            </view>
            <view class="p-24rpx">
              <RegionEditor v-model="charges" mode="charge" :area-tree="areaTree" :charge-mode="formData.chargeMode" />
            </view>
          </view>

          <!-- 包邮区域 -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              包邮区域（可选）
            </view>
            <view class="p-24rpx">
              <RegionEditor v-model="frees" mode="free" :area-tree="areaTree" :charge-mode="formData.chargeMode" />
            </view>
          </view>
        </view>
      </wd-form>
    </scroll-view>

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
import type { Area } from '@/api/system/area'
import type { DeliveryExpressTemplate } from '@/api/mall/trade/delivery/express-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createDeliveryExpressTemplate,
  getDeliveryExpressTemplate,
  updateDeliveryExpressTemplate,
} from '@/api/mall/trade/delivery/express-template'
import { getAreaTree } from '@/api/system/area'
import RegionEditor from '@/pages-mall/trade/delivery/express-template/components/region-editor.vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DeliveryExpressChargeModeEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑运费模板' : '新增运费模板')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const areaTree = ref<Area[]>([]) // 地区树
const charges = ref<Record<string, any>[]>([
  { areaIds: [1], startCount: 2, startPrice: 5, extraCount: 5, extraPrice: 10 },
]) // 计费区域规则（金额单位元）
const frees = ref<Record<string, any>[]>([]) // 包邮区域规则（金额单位元）
const formData = ref<DeliveryExpressTemplate>({
  id: undefined,
  name: '',
  chargeMode: DeliveryExpressChargeModeEnum.COUNT,
  sort: 0,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
  chargeMode: [{ required: true, message: '计费方式不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/express-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getDeliveryExpressTemplate(props.id)
  formData.value = {
    ...data,
    chargeMode: data.chargeMode ?? DeliveryExpressChargeModeEnum.COUNT,
  }
  // 区域金额 分→元 回显
  charges.value = (data.charges || []).map(item => ({
    ...item,
    startPrice: fenToYuan(item.startPrice),
    extraPrice: fenToYuan(item.extraPrice),
  }))
  frees.value = (data.frees || []).map(item => ({
    ...item,
    freePrice: fenToYuan(item.freePrice),
  }))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!charges.value.length) {
    toast.warning('请至少添加一条计费区域')
    return
  }
  formLoading.value = true
  try {
    const data: DeliveryExpressTemplate = {
      ...formData.value,
      // 区域金额 元→分 提交
      charges: charges.value.map(item => ({
        areaIds: item.areaIds || [],
        startCount: Number(item.startCount) || 0,
        startPrice: yuanToFen(item.startPrice),
        extraCount: Number(item.extraCount) || 0,
        extraPrice: yuanToFen(item.extraPrice),
      })),
      frees: frees.value.map(item => ({
        areaIds: item.areaIds || [],
        freeCount: Number(item.freeCount) || 0,
        freePrice: yuanToFen(item.freePrice),
      })),
    }
    if (props.id) {
      await updateDeliveryExpressTemplate(data)
      toast.success('修改成功')
    } else {
      await createDeliveryExpressTemplate(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:delivery-express-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
  await getDetail()
})
</script>
