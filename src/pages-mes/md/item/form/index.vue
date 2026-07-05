<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="物料编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入物料编码或点击自动生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="物料名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入物料名称" clearable />
          </wd-form-item>
          <wd-form-item title="规格型号" title-width="220rpx" prop="specification">
            <wd-input v-model="formData.specification" placeholder="请输入规格型号" clearable />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.unitMeasureId"
            label="计量单位"
            label-width="220rpx"
            prop="unitMeasureId"
            :columns="unitMeasureOptions"
            label-key="name"
            value-key="id"
            placeholder="请选择计量单位"
          />
          <yd-tree-select
            v-model="formData.itemTypeId"
            :data="itemTypeTree"
            label="物料分类"
            prop="itemTypeId"
            label-width="220rpx"
            placeholder="请选择物料分类"
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
            }"
            @confirm="handleItemTypeConfirm"
            @change="handleItemTypeChange"
          />
          <wd-cell title="物料/产品标识">
            <dict-tag v-if="formData.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="formData.itemOrProduct" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="状态">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          </wd-cell>
          <wd-cell title="高值物料">
            <view class="flex justify-end">
              <wd-switch v-model="formData.highValue" />
            </view>
          </wd-cell>
          <wd-cell title="批次管理">
            <view class="flex justify-end">
              <wd-switch v-model="formData.batchFlag" />
            </view>
          </wd-cell>
          <wd-cell title="安全库存">
            <view class="flex justify-end">
              <wd-switch v-model="formData.safeStockFlag" />
            </view>
          </wd-cell>
          <wd-form-item v-if="formData.safeStockFlag" title="最低库存量" title-width="220rpx" prop="minStock" center>
            <wd-input-number v-model="formData.minStock" allow-null :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item v-if="formData.safeStockFlag" title="最高库存量" title-width="220rpx" prop="maxStock" center>
            <wd-input-number v-model="formData.maxStock" allow-null :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- BOM 组成入口（编辑模式） -->
      <view v-if="props.id" class="px-24rpx pb-24rpx">
        <wd-cell-group border>
          <wd-cell title="BOM 组成" is-link @click="handleBom" />
          <wd-cell v-if="formData.batchFlag" title="批次属性" is-link @click="handleBatchConfig" />
          <wd-cell title="产品 SIP" is-link @click="handleSip" />
          <wd-cell title="产品 SOP" is-link @click="handleSop" />
        </wd-cell-group>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import type { MdItemType } from '@/api/mes/md/item/type'
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createItem, getItem, updateItem } from '@/api/mes/md/item'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { getUnitMeasureSimpleList } from '@/api/mes/md/unitmeasure'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑物料产品' : '新增物料产品')
type ItemFormData = Omit<MdItem, 'unitMeasureId' | 'itemTypeId'> & {
  unitMeasureId?: number
  itemTypeId?: number
}
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<ItemFormData>({
  id: undefined,
  code: '',
  name: '',
  specification: '',
  unitMeasureId: undefined,
  itemTypeId: undefined,
  itemOrProduct: '',
  status: CommonStatusEnum.DISABLE,
  highValue: false,
  batchFlag: true,
  safeStockFlag: false,
  minStock: 0,
  maxStock: 0,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '物料编码不能为空' }],
  name: [{ required: true, message: '物料名称不能为空' }],
  unitMeasureId: [{ required: true, message: '计量单位不能为空' }],
  itemTypeId: [{ required: true, message: '物料分类不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const unitMeasureOptions = ref<MdUnitMeasure[]>([]) // 计量单位选项
const itemTypeTree = ref<MdItemType[]>([]) // 分类树数据
const itemTypeFlat = ref<MdItemType[]>([]) // 分类扁平列表

/** 进入 BOM 组成 */
function handleBom() {
  if (!props.id)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/bom/index?itemId=${props.id}&mode=edit` })
}

/** 进入批次属性配置 */
function handleBatchConfig() {
  if (!props.id)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/batch-config/index?itemId=${props.id}&mode=edit` })
}

/** 进入产品 SIP */
function handleSip() {
  if (!props.id)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/sip/index?itemId=${props.id}&mode=edit` })
}

/** 进入产品 SOP */
function handleSop() {
  if (!props.id)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/sop/index?itemId=${props.id}&mode=edit` })
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/index')
}

/** 加载选项数据 */
async function loadOptions() {
  const [units, types] = await Promise.all([
    getUnitMeasureSimpleList(),
    getItemTypeList(),
  ])
  unitMeasureOptions.value = units || []
  itemTypeFlat.value = types || []
  itemTypeTree.value = handleTree(types || [])
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getItem(Number(props.id))
}

/** 分类选择确认：从 selectedNode 同步 itemOrProduct */
function handleItemTypeConfirm(payload: { selectedNode?: MdItemType }) {
  const node = payload?.selectedNode
  if (node?.itemOrProduct) {
    formData.value.itemOrProduct = node.itemOrProduct
  } else if (node) {
    const found = itemTypeFlat.value.find(t => t.id === node.id)
    formData.value.itemOrProduct = found?.itemOrProduct || ''
  }
}

/** 分类变更（清空时同步清空标识） */
function handleItemTypeChange(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    formData.value.itemOrProduct = ''
  }
}

/** 自动生成物料编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode('MD_ITEM_CODE')
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
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
    const data: MdItem = {
      ...formData.value,
      unitMeasureId: formData.value.unitMeasureId!,
      itemTypeId: formData.value.itemTypeId!,
      minStock: formData.value.safeStockFlag ? formData.value.minStock : undefined,
      maxStock: formData.value.safeStockFlag ? formData.value.maxStock : undefined,
    }
    if (props.id) {
      await updateItem(data)
      toast.success('修改成功')
      uni.$emit('mes:md:item:reload')
      delay(handleBack)
    } else {
      const id = await createItem(data)
      toast.success('新增成功')
      uni.$emit('mes:md:item:reload')
      delay(() => {
        uni.redirectTo({ url: `/pages-mes/md/item/form/index?id=${id}` })
      })
    }
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
