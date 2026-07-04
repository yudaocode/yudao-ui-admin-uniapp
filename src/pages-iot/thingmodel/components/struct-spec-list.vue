<template>
  <view class="bg-white px-32rpx py-20rpx">
    <view class="mb-12rpx text-26rpx text-[#999]">
      JSON 对象字段
    </view>
    <view v-if="list.length === 0" class="mb-16rpx text-26rpx text-[#999]">
      暂无字段
    </view>
    <view
      v-for="(item, index) in list"
      :key="item.identifier || index"
      class="mb-16rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-20rpx py-16rpx"
    >
      <view class="min-w-0 flex-1">
        <view class="truncate text-28rpx text-[#333]">
          {{ item.name || item.identifier || '-' }}
        </view>
        <view class="mt-4rpx text-24rpx text-[#999]">
          {{ item.identifier || '-' }} / {{ item.childDataType || '-' }}
        </view>
      </view>
      <view class="ml-16rpx flex shrink-0 gap-20rpx">
        <text class="text-26rpx text-[#2f54eb]" @click="openForm(item, index)">编辑</text>
        <text class="text-26rpx text-[#fa4350]" @click="removeField(index)">删除</text>
      </view>
    </view>
    <wd-button size="small" type="primary" variant="plain" @click="openForm()">
      + 新增字段
    </wd-button>

    <!-- 字段表单弹窗 -->
    <wd-popup v-model="visible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] overflow-y-auto p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ editIndex >= 0 ? '编辑字段' : '新增字段' }}
        </view>
        <wd-form ref="formRef" :model="form" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="字段名称" title-width="200rpx" prop="name">
              <wd-input v-model="form.name" placeholder="请输入字段名称" />
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
            <SimpleDataSpecsForm :target="form" @update:target="assignFormTarget" />
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
import { getDataTypeOptions, IoTDataSpecsDataTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { buildStructDataSpec, seedDataSpecs, validateThingModelDataSpecs } from '@/utils/iot/thing-model'
import SimpleDataSpecsForm from './simple-data-specs-form.vue'

const props = defineProps<{ modelValue?: any[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: any[]): void }>()

const toast = useToast()
const dataTypeOptions = getDataTypeOptions().filter(item => ![IoTDataSpecsDataTypeEnum.STRUCT, IoTDataSpecsDataTypeEnum.ARRAY].includes(item.value as any)) // 结构体字段不再嵌套复杂类型
const list = ref<any[]>(props.modelValue || []) // 结构体字段列表
const visible = ref(false) // 字段弹窗显示状态
const editIndex = ref(-1) // 编辑索引
const formRef = ref<FormInstance>() // 表单组件引用
const form = reactive<Record<string, any>>({
  identifier: '',
  name: '',
  dataType: IoTDataSpecsDataTypeEnum.INT,
  dataSpecs: { dataType: IoTDataSpecsDataTypeEnum.INT },
  dataSpecsList: [],
}) // 字段表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '字段名称不能为空' }],
  identifier: [
    { required: true, message: '标识符不能为空' },
    { pattern: /^[a-z]\w{0,31}$/i, message: '标识符必须以字母开头，不超过 32 个字符' },
  ],
})

/** 同步外部字段列表 */
watch(() => props.modelValue, (value) => {
  list.value = value || []
})

/** 数据类型切换 */
function onDataTypeChange() {
  seedDataSpecs(form, form.dataType)
}

/** 更新字段数据定义 */
function assignFormTarget(target: Record<string, any>) {
  Object.assign(form, target)
}

/** 打开字段表单 */
function openForm(item?: any, index = -1) {
  editIndex.value = index
  if (item) {
    form.identifier = item.identifier
    form.name = item.name
    form.dataType = item.childDataType
    form.dataSpecs = item.dataSpecs ? { ...item.dataSpecs } : { dataType: item.childDataType }
    form.dataSpecsList = item.dataSpecsList ? item.dataSpecsList.map((child: Record<string, any>) => ({ ...child })) : []
  } else {
    form.identifier = ''
    form.name = ''
    seedDataSpecs(form, IoTDataSpecsDataTypeEnum.INT)
  }
  visible.value = true
}

/** 删除字段 */
function removeField(index: number) {
  list.value.splice(index, 1)
  emit('update:modelValue', list.value)
}

/** 确认字段 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  const error = validateThingModelDataSpecs(form, '字段数据定义')
  if (error) {
    toast.error(error)
    return
  }
  const item = buildStructDataSpec(form)
  if (editIndex.value >= 0) {
    list.value[editIndex.value] = item
  } else {
    list.value.push(item)
  }
  emit('update:modelValue', list.value)
  visible.value = false
}
</script>
