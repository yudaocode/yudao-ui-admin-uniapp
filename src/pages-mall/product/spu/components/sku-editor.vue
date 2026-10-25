<template>
  <view>
    <!-- 多规格：规格定义 -->
    <template v-if="specType">
      <view
        v-for="(spec, sIndex) in specs"
        :key="sIndex"
        class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
      >
        <view class="mb-12rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-medium">{{ spec.propertyName }}</text>
          <text class="text-26rpx text-[#fa4350]" @click="handleRemoveSpec(sIndex)">删除</text>
        </view>
        <!-- 已选属性值 + 选择入口（弹层多选 + 新增属性值） -->
        <view class="flex flex-wrap items-center gap-12rpx">
          <view
            v-for="val in selectedValues(spec)"
            :key="val.id"
            class="rounded-6rpx bg-[#1677ff] px-20rpx py-8rpx text-26rpx text-white"
          >
            {{ val.name }}
          </view>
          <wd-button size="small" variant="plain" @click="openValuePicker(spec)">
            {{ spec.selectedValueIds.length ? '修改属性值' : '选择属性值' }}
          </wd-button>
        </view>
      </view>
      <view class="mb-20rpx flex gap-16rpx">
        <wd-button size="small" variant="plain" @click="handleOpenSpecPicker">
          添加规格
        </wd-button>
        <wd-button size="small" type="primary" :disabled="!canGenerate" @click="handleGenerate">
          生成规格
        </wd-button>
      </view>
    </template>

    <!-- SKU 列表（单规格 1 条；多规格按组合生成） -->
    <view
      v-for="(sku, index) in rows"
      :key="index"
      class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
    >
      <view v-if="specType" class="mb-12rpx text-26rpx text-[#333] font-medium">
        {{ skuLabel(sku) }}
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">销售价(元)</text>
        <wd-input-number v-model="sku.price" :min="0" :step="0.01" :precision="2" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">市场价(元)</text>
        <wd-input-number v-model="sku.marketPrice" :min="0" :step="0.01" :precision="2" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">成本价(元)</text>
        <wd-input-number v-model="sku.costPrice" :min="0" :step="0.01" :precision="2" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">库存</text>
        <wd-input-number v-model="sku.stock" :min="0" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">条码</text>
        <wd-input v-model="sku.barCode" clearable placeholder="请输入条码" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">重量(kg)</text>
        <wd-input-number v-model="sku.weight" :min="0" :step="0.01" :precision="2" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">体积(m³)</text>
        <wd-input-number v-model="sku.volume" :min="0" :step="0.01" :precision="2" @change="emitChange" />
      </view>
      <view class="flex items-start gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">图片</text>
        <yd-upload-img v-model="sku.picUrl" @update:model-value="emitChange" />
      </view>
      <!-- 单独分佣时展示一二级佣金 -->
      <template v-if="subCommissionType">
        <view class="flex items-center gap-12rpx py-6rpx">
          <text class="w-160rpx shrink-0 text-26rpx text-[#666]">一级佣金(元)</text>
          <wd-input-number v-model="sku.firstBrokeragePrice" :min="0" :step="0.01" :precision="2" @change="emitChange" />
        </view>
        <view class="flex items-center gap-12rpx py-6rpx">
          <text class="w-160rpx shrink-0 text-26rpx text-[#666]">二级佣金(元)</text>
          <wd-input-number v-model="sku.secondBrokeragePrice" :min="0" :step="0.01" :precision="2" @change="emitChange" />
        </view>
      </template>
    </view>
    <view v-if="!rows.length" class="rounded-8rpx bg-[#f7f8fa] py-32rpx text-center text-26rpx text-[#999]">
      {{ specType ? '请添加规格并生成 SKU' : '加载中...' }}
    </view>

    <!-- 规格选择弹窗 -->
    <wd-popup
      v-model="specPickerVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="specPickerVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          选择规格
        </view>
        <!-- 手动新建规格 -->
        <view class="mb-16rpx flex items-center gap-12rpx">
          <wd-input v-model="newPropertyName" class="min-w-0 flex-1" placeholder="输入新规格名称（如 颜色）" clearable />
          <wd-button class="shrink-0" size="small" type="primary" :disabled="!newPropertyName.trim()" @click="handleCreateProperty">
            新建
          </wd-button>
        </view>
        <scroll-view class="max-h-50vh" scroll-y>
          <view
            v-for="property in availableProperties"
            :key="property.id"
            class="border-b border-[#f5f5f5] py-20rpx text-28rpx text-[#333]"
            @click="handleAddSpec(property)"
          >
            {{ property.name }}
          </view>
          <view v-if="!availableProperties.length" class="py-32rpx text-center text-26rpx text-[#999]">
            暂无可选规格
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 属性值选择弹窗（含新增属性值） -->
    <wd-popup
      v-model="valuePickerVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0; height: 70vh;"
      @close="valuePickerVisible = false"
    >
      <view v-if="editingSpec" class="h-70vh flex flex-col p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          选择「{{ editingSpec.propertyName }}」属性值
        </view>
        <!-- 新增属性值 -->
        <view class="mb-16rpx flex items-center gap-12rpx">
          <wd-input v-model="editingSpec.newValueName" class="min-w-0 flex-1" placeholder="输入新属性值名称" clearable />
          <wd-button class="shrink-0" size="small" type="primary" :disabled="!editingSpec.newValueName?.trim()" @click="handleCreateValue(editingSpec)">
            新增
          </wd-button>
        </view>
        <!-- 属性值多选 -->
        <scroll-view class="min-h-0 flex-1" scroll-y>
          <view
            v-for="val in editingSpec.allValues"
            :key="val.id"
            class="flex items-center justify-between border-b border-[#f5f5f5] py-20rpx"
            @click="toggleValue(editingSpec, val.id)"
          >
            <text class="text-28rpx" :class="editingSpec.selectedValueIds.includes(val.id) ? 'text-[#1677ff]' : 'text-[#333]'">
              {{ val.name }}
            </text>
            <wd-icon v-if="editingSpec.selectedValueIds.includes(val.id)" name="check" size="36rpx" color="#1677ff" />
          </view>
          <view v-if="!editingSpec.allValues.length" class="py-48rpx text-center text-26rpx text-[#999]">
            暂无属性值，请在上方新增
          </view>
        </scroll-view>
        <wd-button class="mt-16rpx" type="primary" block @click="valuePickerVisible = false">
          确定（已选 {{ editingSpec.selectedValueIds.length }}）
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ProductProperty } from '@/api/mall/product/property'
import type { ProductSku } from '@/api/mall/product/spu'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createProductProperty,
  createProductPropertyValue,
  getSimpleProductPropertyList,
  getSimpleProductPropertyValueList,
} from '@/api/mall/product/property'

/** 规格定义（生成 SKU 用） */
interface SpecItem {
  propertyId: number
  propertyName: string
  allValues: { id: number, name: string }[]
  selectedValueIds: number[]
  newValueName?: string // 手动新增属性值输入
}

const props = defineProps<{
  modelValue: ProductSku[] // SKU 列表（金额单位元）
  specType?: boolean // 是否多规格
  subCommissionType?: boolean // 是否单独分佣
}>()

const emit = defineEmits<{
  'update:modelValue': [skus: ProductSku[]]
}>()

const rows = computed(() => props.modelValue || []) // SKU 列表（直接编辑 modelValue 内元素）
const specs = ref<SpecItem[]>([]) // 规格定义
const propertyList = ref<ProductProperty[]>([]) // 全部商品属性
const specPickerVisible = ref(false) // 规格选择弹窗
const newPropertyName = ref('') // 手动新建规格名称
const valuePickerVisible = ref(false) // 属性值选择弹窗显示状态
const editingSpec = ref<SpecItem>() // 当前编辑属性值的规格
const availableProperties = computed(() => propertyList.value.filter(p => !specs.value.some(s => s.propertyId === p.id))) // 未选规格
const canGenerate = computed(() => specs.value.length > 0 && specs.value.every(s => s.selectedValueIds.length > 0)) // 可生成

/** 创建一条默认 SKU（元） */
function createSku(properties: ProductSku['properties'] = []): ProductSku {
  return { price: 0, marketPrice: 0, costPrice: 0, stock: 0, barCode: '', weight: 0, volume: 0, picUrl: '', firstBrokeragePrice: 0, secondBrokeragePrice: 0, properties }
}

/** SKU 规格组合文案 */
function skuLabel(sku: ProductSku) {
  return (sku.properties || []).map(p => p.valueName).filter(Boolean).join(' / ') || '默认'
}

/** 规格已选属性值（标签展示） */
function selectedValues(spec: SpecItem) {
  return spec.allValues.filter(v => spec.selectedValueIds.includes(v.id))
}

/** 打开属性值选择弹窗 */
function openValuePicker(spec: SpecItem) {
  editingSpec.value = spec
  valuePickerVisible.value = true
}

/** 切换属性值选中 */
function toggleValue(spec: SpecItem, valueId: number) {
  const idx = spec.selectedValueIds.indexOf(valueId)
  if (idx >= 0) {
    spec.selectedValueIds.splice(idx, 1)
  } else {
    spec.selectedValueIds.push(valueId)
  }
}

/** 通知父级 SKU 变化（结构变化时重新派发数组） */
function emitChange() {
  emit('update:modelValue', [...rows.value])
}

/** 打开规格选择 */
async function handleOpenSpecPicker() {
  if (!propertyList.value.length) {
    propertyList.value = await getSimpleProductPropertyList()
  }
  specPickerVisible.value = true
}

/** 添加规格并加载其属性值 */
async function handleAddSpec(property: ProductProperty) {
  specPickerVisible.value = false
  const values = await getSimpleProductPropertyValueList(property.id!)
  specs.value.push({
    propertyId: property.id!,
    propertyName: property.name,
    allValues: values.filter(v => v.id != null).map(v => ({ id: v.id as number, name: v.name })),
    selectedValueIds: [],
    newValueName: '',
  })
}

/** 手动新建规格（创建商品属性后加入规格列表） */
async function handleCreateProperty() {
  const name = newPropertyName.value.trim()
  if (!name) {
    return
  }
  const id = await createProductProperty({ name })
  newPropertyName.value = ''
  specPickerVisible.value = false
  specs.value.push({ propertyId: id, propertyName: name, allValues: [], selectedValueIds: [], newValueName: '' })
  propertyList.value.push({ id, name }) // 同步到属性列表，避免重复新建
}

/** 手动新建属性值（创建后加入该规格并默认选中） */
async function handleCreateValue(spec: SpecItem) {
  const name = (spec.newValueName || '').trim()
  if (!name) {
    return
  }
  const id = await createProductPropertyValue({ propertyId: spec.propertyId, name })
  spec.allValues.push({ id, name })
  spec.selectedValueIds.push(id)
  spec.newValueName = ''
}

/** 删除规格 */
function handleRemoveSpec(index: number) {
  specs.value.splice(index, 1)
}

/** 生成规格组合 SKU（保留已有组合的价格库存） */
function handleGenerate() {
  // 每个规格取「选中值」做笛卡尔积
  let combos: ProductSku['properties'][] = [[]]
  for (const spec of specs.value) {
    const next: ProductSku['properties'][] = []
    for (const combo of combos) {
      for (const valueId of spec.selectedValueIds) {
        const value = spec.allValues.find(v => v.id === valueId)
        next.push([...(combo || []), { propertyId: spec.propertyId, propertyName: spec.propertyName, valueId, valueName: value?.name }])
      }
    }
    combos = next
  }
  // 以组合 key 保留旧 SKU 价格
  const oldMap = new Map(rows.value.map(sku => [comboKey(sku.properties), sku]))
  const next = combos.map((properties) => {
    const old = oldMap.get(comboKey(properties))
    return old ? { ...old, properties } : createSku(properties)
  })
  emit('update:modelValue', next)
}

/** 组合唯一 key（按 valueId 排序） */
function comboKey(properties: ProductSku['properties'] = []) {
  return (properties || []).map(p => p.valueId).sort((a, b) => Number(a) - Number(b)).join('-')
}

/** 从已有 SKU 反推规格定义（编辑回显） */
async function rebuildSpecsFromSkus() {
  const map = new Map<number, { name: string, values: Map<number, string> }>()
  for (const sku of rows.value) {
    for (const prop of sku.properties || []) {
      if (prop.propertyId == null || prop.valueId == null) {
        continue
      }
      if (!map.has(prop.propertyId)) {
        map.set(prop.propertyId, { name: prop.propertyName || '', values: new Map() })
      }
      map.get(prop.propertyId)!.values.set(prop.valueId, prop.valueName || '')
    }
  }
  specs.value = Array.from(map.entries()).map(([propertyId, item]) => ({
    propertyId,
    propertyName: item.name,
    allValues: Array.from(item.values.entries()).map(([id, name]) => ({ id, name })),
    selectedValueIds: Array.from(item.values.keys()),
    newValueName: '',
  }))
}

/** 同步单/多规格结构 */
function syncStructure() {
  if (props.specType) {
    // 多规格：有规格信息则反推规格定义，否则清空等待生成
    if (rows.value.some(sku => sku.properties?.length)) {
      rebuildSpecsFromSkus()
    } else if (rows.value.length) {
      emit('update:modelValue', [])
    }
  } else {
    // 单规格：始终保持一条无规格 SKU
    if (rows.value.length !== 1 || rows.value[0]?.properties?.length) {
      emit('update:modelValue', [rows.value[0] ? { ...rows.value[0], properties: [] } : createSku()])
    }
  }
}

/** 多规格切换：重置规格定义 */
watch(() => props.specType, syncStructure)

/** 初始化 */
onMounted(() => {
  syncStructure()
})
</script>
