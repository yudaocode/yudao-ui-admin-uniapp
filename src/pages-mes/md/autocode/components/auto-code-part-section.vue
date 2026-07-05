<template>
  <view class="mt-20rpx bg-[#f5f5f5] pb-24rpx">
    <view class="flex items-center justify-between px-24rpx py-16rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        规则组成（{{ list.length }}）
      </view>
      <wd-button size="small" type="primary" variant="plain" @click.stop="openCreateForm">
        新增分段
      </wd-button>
    </view>
    <view v-if="loading" class="mx-24rpx rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999] shadow-sm">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="mx-24rpx rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999] shadow-sm">
      暂无规则组成
    </view>
    <view v-else class="px-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="flex items-start gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="flex flex-wrap items-center gap-12rpx">
              <text class="text-30rpx text-[#333] font-semibold">
                分段 {{ item.sort ?? '-' }}
              </text>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE" :value="item.type" />
              <text v-else class="text-26rpx text-[#999]">-</text>
              <text class="text-28rpx text-[#1677ff] font-semibold">
                长度 {{ item.length ?? '-' }}
              </text>
            </view>
            <view class="mt-12rpx flex flex-wrap gap-x-24rpx gap-y-8rpx text-26rpx text-[#666]">
              <view v-if="item.type === MesAutoCodePartTypeEnum.DATE" class="min-w-240rpx">
                <text class="text-[#999]">日期格式：</text>{{ item.dateFormat || '-' }}
              </view>
              <view v-if="item.type === MesAutoCodePartTypeEnum.FIXED_CHAR" class="min-w-240rpx">
                <text class="text-[#999]">固定字符：</text>{{ item.fixCharacter || '-' }}
              </view>
              <template v-if="item.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER">
                <view class="min-w-240rpx">
                  <text class="text-[#999]">流水号起始：</text>{{ item.serialStartNo ?? '-' }}
                </view>
                <view class="min-w-240rpx">
                  <text class="text-[#999]">流水号步长：</text>{{ item.serialStep ?? '-' }}
                </view>
                <view class="min-w-240rpx flex items-center">
                  <text class="text-[#999]">是否循环：</text>
                  <dict-tag
                    v-if="item.cycleFlag !== undefined"
                    :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
                    :value="item.cycleFlag"
                  />
                  <text v-else>-</text>
                </view>
                <view v-if="item.cycleFlag" class="min-w-240rpx flex items-center">
                  <text class="text-[#999]">循环方式：</text>
                  <dict-tag
                    v-if="item.cycleMethod != null"
                    :type="DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD"
                    :value="item.cycleMethod"
                  />
                  <text v-else>-</text>
                </view>
              </template>
              <view class="min-w-240rpx">
                <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
              </view>
            </view>
          </view>
        </view>
        <view class="mt-18rpx flex justify-end gap-16rpx">
          <wd-button size="small" type="primary" variant="plain" @click.stop="openUpdateForm(item)">
            编辑
          </wd-button>
          <wd-button size="small" type="danger" variant="plain" @click.stop="handleDeletePart(item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>
  </view>

  <!-- 分段表单 -->
  <wd-popup
    v-model="formVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 84vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmitForm">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="分段排序" title-width="220rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="1" :precision="0" />
            </wd-form-item>
            <wd-form-item title="分段长度" title-width="220rpx" prop="length" center>
              <wd-input-number
                :model-value="formData.length ?? ''"
                allow-null
                :min="1"
                :max="50"
                :precision="0"
                @update:model-value="value => formData.length = toFiniteNumber(value)"
              />
            </wd-form-item>
            <yd-form-picker v-model="formData.type" label="分段类型" label-width="220rpx" prop="type" :dict-type="DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE" placeholder="请选择分段类型" />
            <yd-form-picker
              v-if="formData.type === MesAutoCodePartTypeEnum.DATE"
              v-model="formData.dateFormat"
              label="日期格式"
              label-width="220rpx"
              prop="dateFormat"
              :columns="dateFormatOptions"
              placeholder="请选择日期格式"
            />
            <wd-form-item
              v-if="formData.type === MesAutoCodePartTypeEnum.FIXED_CHAR"
              title="固定字符"
              title-width="220rpx"
              prop="fixCharacter"
            >
              <wd-input v-model="formData.fixCharacter" clearable placeholder="请输入固定字符" />
            </wd-form-item>
            <template v-if="formData.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER">
              <wd-form-item title="流水号起始" title-width="220rpx" prop="serialStartNo" center>
                <wd-input-number
                  :model-value="formData.serialStartNo ?? ''"
                  allow-null
                  :min="1"
                  :precision="0"
                  @update:model-value="value => formData.serialStartNo = toFiniteNumber(value)"
                />
              </wd-form-item>
              <wd-form-item title="流水号步长" title-width="220rpx" prop="serialStep" center>
                <wd-input-number
                  :model-value="formData.serialStep ?? ''"
                  allow-null
                  :min="1"
                  :precision="0"
                  @update:model-value="value => formData.serialStep = toFiniteNumber(value)"
                />
              </wd-form-item>
              <yd-form-picker v-model="formData.cycleFlag" label="是否循环" label-width="220rpx" prop="cycleFlag" :columns="cycleFlagOptions" placeholder="请选择是否循环" />
              <yd-form-picker
                v-if="formData.cycleFlag"
                v-model="formData.cycleMethod"
                label="循环方式"
                label-width="220rpx"
                prop="cycleMethod"
                :dict-type="DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD"
                placeholder="请选择循环方式"
              />
            </template>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { AutoCodePart } from '@/api/mes/md/autocode/part'
import {
  createAutoCodePart,
  deleteAutoCodePart,
  getAutoCodePart,
  getAutoCodePartListByRuleId,
  updateAutoCodePart,
} from '@/api/mes/md/autocode/part'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getBoolDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { MesAutoCodePartTypeEnum } from '@/utils/constants/biz-mes-enum'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

interface PartFormData extends AutoCodePart {
  id?: number
}

const props = defineProps<{
  ruleId: number
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<AutoCodePart[]>([]) // 分段数据
const loading = ref(false) // 加载状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<PartFormData>(getDefaultFormData()) // 表单数据
const dateFormatOptions = ['yyyy', 'yyyyMM', 'yyyyMMdd', 'yyyyMMddHH', 'yyyyMMddHHmm'].map(value => ({ label: value, value })) // 日期格式选项
const cycleFlagOptions = getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING) // 是否循环选项
const formTitle = computed(() => formType.value === 'create' ? '新增分段' : '编辑分段')
const formSchema = createFormSchema({
  sort: [
    { required: true, message: '分段排序不能为空' },
    { validator: value => Number(value) >= 1 || '分段排序不能小于 1' },
  ],
  type: [{ required: true, message: '分段类型不能为空' }],
  length: [
    { required: true, message: '分段长度不能为空' },
    { validator: value => (Number(value) >= 1 && Number(value) <= 50) || '分段长度必须在 1 到 50 之间' },
  ],
  dateFormat: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.DATE, message: '日期格式不能为空' },
  ],
  fixCharacter: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.FIXED_CHAR, message: '固定字符不能为空' },
  ],
  serialStartNo: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER, message: '流水号起始值不能为空' },
  ],
  serialStep: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER, message: '流水号步长不能为空' },
  ],
  cycleMethod: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER && formData.value.cycleFlag === true, message: '循环方式不能为空' },
  ],
})

/** 默认表单数据 */
function getDefaultFormData(): PartFormData {
  return {
    id: undefined,
    ruleId: props.ruleId,
    sort: 1,
    type: undefined,
    length: undefined,
    dateFormat: undefined,
    fixCharacter: '',
    serialStartNo: undefined,
    serialStep: undefined,
    cycleFlag: false,
    cycleMethod: undefined,
    remark: '',
  }
}

/** 查询分段列表 */
async function queryList() {
  loading.value = true
  try {
    list.value = await getAutoCodePartListByRuleId(props.ruleId)
  } finally {
    loading.value = false
  }
}

/** 打开新增 */
function openCreateForm() {
  formType.value = 'create'
  const maxSort = list.value.length > 0 ? Math.max(...list.value.map(item => item.sort || 0)) : 0
  formData.value = {
    ...getDefaultFormData(),
    sort: maxSort + 1,
  }
  formVisible.value = true
}

/** 打开编辑 */
async function openUpdateForm(item: AutoCodePart) {
  if (!item.id) {
    return
  }
  formType.value = 'update'
  formVisible.value = true
  formLoading.value = true
  try {
    formData.value = await getAutoCodePart(item.id)
  } finally {
    formLoading.value = false
  }
}

/** 删除分段 */
async function handleDeletePart(item: AutoCodePart) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除分段 ${item.sort ?? item.id} 吗？`,
    })
  } catch {
    return
  }
  await deleteAutoCodePart(item.id)
  toast.success('删除成功')
  await queryList()
}

/** 提交表单 */
async function handleSubmitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data = normalizeSubmitData()
    if (formType.value === 'update' && formData.value.id) {
      await updateAutoCodePart({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createAutoCodePart(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    await queryList()
  } finally {
    formLoading.value = false
  }
}

/** 规范提交数据 */
function normalizeSubmitData(): AutoCodePart {
  const data: AutoCodePart = {
    ruleId: props.ruleId,
    sort: formData.value.sort,
    type: formData.value.type,
    length: formData.value.length,
    remark: formData.value.remark,
  }
  if (formData.value.type === MesAutoCodePartTypeEnum.DATE) {
    data.dateFormat = formData.value.dateFormat
  }
  if (formData.value.type === MesAutoCodePartTypeEnum.FIXED_CHAR) {
    data.fixCharacter = formData.value.fixCharacter
  }
  if (formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER) {
    data.serialStartNo = formData.value.serialStartNo
    data.serialStep = formData.value.serialStep
    data.cycleFlag = formData.value.cycleFlag
    data.cycleMethod = formData.value.cycleFlag ? formData.value.cycleMethod : undefined
  }
  return data
}

/** 初始化 */
onMounted(() => {
  queryList()
})
</script>
