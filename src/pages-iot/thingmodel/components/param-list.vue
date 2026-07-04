<template>
  <view class="bg-white">
    <view class="px-32rpx py-16rpx text-26rpx text-[#999]">
      {{ title }}
    </view>
    <view v-for="(item, index) in list" :key="index" class="flex items-center justify-between border-t border-[#f2f3f5] px-32rpx py-20rpx">
      <text class="text-28rpx text-[#333]">{{ item.name || item.identifier }}<text class="ml-8rpx text-24rpx text-[#999]">({{ item.dataType }})</text></text>
      <view class="flex items-center gap-24rpx">
        <text class="text-26rpx text-[#2f54eb]" @click="openForm(item, index)">编辑</text>
        <text class="text-26rpx text-[#fa4350]" @click="removeParam(index)">删除</text>
      </view>
    </view>
    <view class="border-t border-[#f2f3f5] px-32rpx py-20rpx">
      <wd-button size="small" type="primary" variant="plain" @click="openForm()">
        + 新增参数
      </wd-button>
    </view>

    <!-- 参数表单弹窗 -->
    <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] overflow-y-auto p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ editIndex >= 0 ? '编辑参数' : '新增参数' }}
        </view>
        <wd-form ref="formRef" :model="form" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="参数名称" title-width="200rpx" prop="name">
              <wd-input v-model="form.name" placeholder="请输入参数名称" />
            </wd-form-item>
            <wd-form-item title="标识符" title-width="200rpx" prop="identifier">
              <wd-input v-model="form.identifier" placeholder="请输入标识符" />
            </wd-form-item>
            <yd-form-picker
              v-model="form.dataType"
              label="数据类型"
              :columns="dataTypeOptions"
              placeholder="请选择数据类型"
              label-width="200rpx"
              @confirm="onDataTypeChange"
            />
            <DataSpecsForm :target="form" @update:target="assignFormTarget" />
          </wd-cell-group>
        </wd-form>
        <view class="mt-24rpx flex gap-16rpx">
          <wd-button class="flex-1" @click="visible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleConfirm">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref, watch } from 'vue'
import DataSpecsForm from './data-specs-form.vue'
import { getDataTypeOptions, IoTDataSpecsDataTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { seedDataSpecs, validateThingModelDataSpecs } from '@/utils/iot/thing-model'

const props = defineProps<{ modelValue: any[], direction: string, title: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: any[]): void }>()

const toast = useToast()
const dataTypeOptions = getDataTypeOptions() // 数据类型选项
const list = ref<any[]>(props.modelValue || []) // 参数列表
const visible = ref(false) // 参数弹窗显示状态
const editIndex = ref(-1) // 编辑索引
const formRef = ref<FormInstance>() // 表单组件引用
const form = reactive<Record<string, any>>({ identifier: '', name: '', dataType: IoTDataSpecsDataTypeEnum.INT, dataSpecs: { dataType: IoTDataSpecsDataTypeEnum.INT }, dataSpecsList: [] }) // 参数表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '参数名称不能为空' }],
  identifier: [{ required: true, message: '标识符不能为空' }, { pattern: /^[a-z]\w{0,31}$/i, message: '标识符必须以字母开头，不超过 32 个字符' }],
})

/** 同步外部参数列表 */
watch(() => props.modelValue, (value) => {
  list.value = value || []
})

/** 数据类型切换 */
function onDataTypeChange() {
  seedDataSpecs(form, form.dataType)
}

/** 更新参数数据定义 */
function assignFormTarget(target: Record<string, any>) {
  Object.assign(form, target)
}

/** 打开参数表单 */
function openForm(item?: any, index = -1) {
  editIndex.value = index
  if (item) {
    form.identifier = item.identifier
    form.name = item.name
    form.dataType = item.dataType
    form.dataSpecs = item.dataSpecs ? cloneValue(item.dataSpecs) : { dataType: item.dataType }
    form.dataSpecsList = item.dataSpecsList ? cloneValue(item.dataSpecsList) : []
  } else {
    form.identifier = ''
    form.name = ''
    seedDataSpecs(form, IoTDataSpecsDataTypeEnum.INT)
  }
  visible.value = true
}

/** 删除参数 */
function removeParam(index: number) {
  list.value.splice(index, 1)
  emit('update:modelValue', list.value)
}

/** 克隆参数数据 */
function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/** 确认参数 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const error = validateThingModelDataSpecs(form, '参数数据定义')
  if (error) {
    toast.error(error)
    return
  }

  const item = {
    identifier: form.identifier,
    name: form.name,
    dataType: form.dataType,
    paraOrder: 0,
    direction: props.direction,
    dataSpecs: form.dataSpecs && Object.keys(form.dataSpecs).length > 1 ? cloneValue(form.dataSpecs) : undefined,
    dataSpecsList: form.dataSpecsList?.length ? cloneValue(form.dataSpecsList) : undefined,
  }
  if (editIndex.value >= 0) {
    list.value[editIndex.value] = item
  } else {
    list.value.push(item)
  }
  emit('update:modelValue', list.value)
  visible.value = false
}
</script>
