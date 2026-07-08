<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        检测结果记录
      </view>
      <view class="flex items-center gap-16rpx">
        <view v-if="total > 0" class="text-24rpx text-[#999]">
          共 {{ total }} 条
        </view>
        <wd-button v-if="!readonly && hasAccessByCodes(['mes:qc-iqc:create'])" size="small" type="primary" variant="plain" @click="handleAddResult">
          新增
        </wd-button>
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="5"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多检测结果记录了"
      empty-view-text="暂无检测结果记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
        >
          <view class="mb-12rpx">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.code || '-' }}
            </view>
            <view class="mt-6rpx truncate text-24rpx text-[#999]">
              物资SN：{{ item.sn || '-' }}
            </view>
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
          </view>
          <view class="text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="mt-16rpx flex gap-12rpx">
            <wd-button class="flex-1" size="small" variant="plain" @click="openDetail(item)">
              查看检测值
            </wd-button>
            <wd-button v-if="!readonly && hasAccessByCodes(['mes:qc-iqc:update'])" class="flex-1" size="small" variant="plain" @click="handleEditResult(item)">
              编辑
            </wd-button>
            <wd-button v-if="!readonly && hasAccessByCodes(['mes:qc-iqc:delete'])" class="flex-1" size="small" type="danger" variant="plain" @click="handleDeleteResult(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 检测值明细 -->
    <wd-popup
      v-model="detailVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-32rpx text-[#333] font-semibold">
              {{ currentResult?.code || '检测值明细' }}
            </view>
            <view class="mt-4rpx truncate text-24rpx text-[#999]">
              物资SN：{{ currentResult?.sn || '-' }}
            </view>
          </view>
          <wd-button size="small" variant="plain" @click="detailVisible = false">
            关闭
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view v-if="detailLoading" class="p-24rpx text-28rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="detailItems.length === 0" class="p-24rpx text-28rpx text-[#999]">
            暂无检测值
          </view>
          <view v-else class="p-24rpx">
            <view
              v-for="item in detailItems"
              :key="item.indicatorId || item.id"
              class="mb-20rpx rounded-12rpx bg-white p-20rpx last:mb-0"
            >
              <view class="mb-10rpx flex items-center justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
                  {{ item.indicatorName || '-' }}
                </view>
                <dict-tag v-if="item.valueType != null" :type="DICT_TYPE.MES_QC_RESULT_TYPE" :value="item.valueType" />
              </view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                <text class="text-[#999]">检测值：</text>{{ formatResultValue(item) }}
              </view>
              <view v-if="item.valueSpecification" class="mb-8rpx text-24rpx text-[#999]">
                值属性：{{ item.valueSpecification }}
              </view>
              <view class="text-24rpx text-[#999]">
                备注：{{ item.remark || '-' }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 检测结果表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 88vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formType === 'update' ? '编辑检测结果' : '新增检测结果' }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmitResult">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="样品编号" title-width="220rpx" prop="code">
                <wd-input v-model="formData.code" placeholder="请输入或点击生成" :maxlength="64" clearable>
                  <template #suffix>
                    <wd-button size="small" type="primary" variant="plain" :loading="codeGenerating" @click="handleGenerateCode">
                      生成
                    </wd-button>
                  </template>
                </wd-input>
              </wd-form-item>
              <wd-form-item title="物资SN" title-width="220rpx" prop="sn">
                <wd-input v-model="formData.sn" placeholder="请输入物资SN" :maxlength="100" clearable />
              </wd-form-item>
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>

            <view class="px-24rpx py-20rpx text-28rpx text-[#333] font-semibold">
              检测值
            </view>
            <view v-if="formLoading" class="px-24rpx text-28rpx text-[#999]">
              加载中...
            </view>
            <view v-else-if="formData.items.length === 0" class="px-24rpx text-28rpx text-[#999]">
              暂无检测值
            </view>
            <view v-else class="px-24rpx">
              <view
                v-for="(item, index) in formData.items"
                :key="item.indicatorId || item.id || index"
                class="mb-20rpx rounded-12rpx bg-white p-20rpx last:mb-0"
              >
                <view class="mb-16rpx flex items-center justify-between gap-16rpx">
                  <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
                    {{ item.indicatorName || `检测项${index + 1}` }}
                  </view>
                  <dict-tag v-if="item.valueType != null" :type="DICT_TYPE.MES_QC_RESULT_TYPE" :value="item.valueType" />
                </view>
                <wd-cell-group border>
                  <wd-form-item title="检测值" title-width="180rpx">
                    <wd-input-number
                      v-if="isNumberValueType(item.valueType)"
                      v-model="item.valueNumber"
                      allow-null
                      :min="-999999999"
                      :max="999999999"
                      :precision="item.valueType === MesQcResultValueTypeEnum.FLOAT ? 4 : 0"
                    />
                    <wd-textarea
                      v-else-if="item.valueType === MesQcResultValueTypeEnum.TEXT"
                      v-model="item.value"
                      placeholder="请输入检测值"
                      :maxlength="500"
                      show-word-limit
                      clearable
                    />
                    <wd-radio-group
                      v-else-if="item.valueType === MesQcResultValueTypeEnum.DICT && getStrDictOptions(item.valueSpecification || '').length > 0"
                      v-model="item.value"
                      type="button"
                    >
                      <wd-radio v-for="dict in getStrDictOptions(item.valueSpecification || '')" :key="dict.value" :name="dict.value">
                        {{ dict.label }}
                      </wd-radio>
                    </wd-radio-group>
                    <wd-input
                      v-else-if="item.valueType === MesQcResultValueTypeEnum.FILE"
                      v-model="item.value"
                      placeholder="请输入文件地址"
                      clearable
                    />
                    <wd-input v-else v-model="item.value" placeholder="请输入检测值" clearable />
                  </wd-form-item>
                  <wd-form-item title="备注" title-width="180rpx">
                    <wd-input v-model="item.remark" placeholder="请输入备注" :maxlength="200" clearable />
                  </wd-form-item>
                </wd-cell-group>
              </view>
            </view>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { QcIndicatorResult, QcIndicatorResultDetail } from '@/api/mes/qc/indicatorresult'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createResult, deleteResult, getDetail, getResultPage, updateResult } from '@/api/mes/qc/indicatorresult'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel, getStrDictOptions } from '@/hooks/useDict'
import { DICT_TYPE, MesAutoCodeRuleCode, MesQcResultValueTypeEnum, MesQcTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

type ResultFormType = 'create' | 'update'
type QcIndicatorResultFormItem = QcIndicatorResultDetail & { valueNumber?: number | string }
type QcIndicatorResultFormData = Partial<QcIndicatorResult> & { items: QcIndicatorResultFormItem[] }

const props = withDefaults(defineProps<{
  qcId?: number
  qcType: number
  readonly?: boolean
  showTitle?: boolean
}>(), {
  readonly: false,
  showTitle: true,
})

const dialog = useDialog()
const toast = useToast()
const { hasAccessByCodes } = useAccess()
const total = ref(0) // 结果总数
const list = ref<QcIndicatorResult[]>([]) // 检测结果记录
const pagingRef = ref<ZPagingRef<QcIndicatorResult>>() // 分页组件引用
const detailVisible = ref(false) // 明细弹层状态
const detailLoading = ref(false) // 明细加载状态
const currentResult = ref<QcIndicatorResult>() // 当前结果
const detailItems = ref<QcIndicatorResultDetail[]>([]) // 检测值明细
const formVisible = ref(false) // 表单弹层状态
const formLoading = ref(false) // 表单加载状态
const codeGenerating = ref(false) // 编码生成状态
const formType = ref<ResultFormType>('create') // 表单类型
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<QcIndicatorResultFormData>({
  items: [],
}) // 表单数据
const formSchema = createFormSchema({
  code: [
    { required: true, message: '样品编号不能为空' },
    { max: 64, message: '样品编号长度不能超过 64 个字符' },
  ],
})

/** 查询检测结果 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.qcId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getResultPage({
      pageNo,
      pageSize,
      qcId: props.qcId,
      qcType: props.qcType,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新检测结果 */
function reloadList() {
  total.value = 0
  list.value = []
  pagingRef.value?.reload()
}

/** 获取刷新事件 */
function getReloadEvent() {
  if (props.qcType === MesQcTypeEnum.IQC) {
    return 'mes:qc:iqc:reload'
  }
  if (props.qcType === MesQcTypeEnum.IPQC) {
    return 'mes:qc:ipqc:reload'
  }
  if (props.qcType === MesQcTypeEnum.OQC) {
    return 'mes:qc:oqc:reload'
  }
  return 'mes:qc:rqc:reload'
}

/** 打开检测值明细 */
async function openDetail(item: QcIndicatorResult) {
  if (!props.qcId) {
    return
  }
  currentResult.value = item
  detailVisible.value = true
  detailLoading.value = true
  try {
    const data = await getDetail(props.qcId, props.qcType, item.id)
    detailItems.value = data.items || []
  } finally {
    detailLoading.value = false
  }
}

/** 打开新增检测结果 */
async function handleAddResult() {
  await openResultForm('create')
}

/** 打开编辑检测结果 */
async function handleEditResult(item: QcIndicatorResult) {
  await openResultForm('update', item.id)
}

/** 打开检测结果表单 */
async function openResultForm(type: ResultFormType, id?: number) {
  const qcId = props.qcId
  if (!qcId) {
    toast.warning('请先保存质检单')
    return
  }
  formType.value = type
  formVisible.value = true
  formData.value = { qcId, qcType: props.qcType, items: [] }
  formLoading.value = true
  try {
    const data = await getDetail(qcId, props.qcType, id)
    formData.value = {
      ...data,
      qcId,
      qcType: props.qcType,
      items: (data.items || []).map(item => ({
        ...item,
        valueNumber: isNumberValueType(item.valueType) ? toFiniteNumber(item.value) : undefined,
      })),
    }
  } finally {
    formLoading.value = false
  }
}

/** 生成样品编号 */
async function handleGenerateCode() {
  codeGenerating.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_INDICATOR_RESULT_CODE)
  } finally {
    codeGenerating.value = false
  }
}

/** 是否数值类型 */
function isNumberValueType(valueType?: number) {
  return valueType === MesQcResultValueTypeEnum.FLOAT || valueType === MesQcResultValueTypeEnum.INTEGER
}

/** 构造检测值提交数据 */
function buildSubmitItem(item: QcIndicatorResultFormItem): QcIndicatorResultDetail {
  const { valueNumber, ...data } = item
  const numberValue = toFiniteNumber(valueNumber)
  return {
    ...data,
    value: isNumberValueType(item.valueType)
      ? numberValue === undefined ? undefined : String(numberValue)
      : item.value,
  }
}

/** 提交检测结果 */
async function handleSubmitResult() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const qcId = props.qcId
  if (!qcId) {
    toast.warning('请先保存质检单')
    return
  }
  const data: QcIndicatorResult = {
    ...formData.value,
    qcId,
    qcType: props.qcType,
    items: formData.value.items.map(buildSubmitItem),
  }
  if (formType.value === 'update' && !data.id) {
    toast.warning('检测结果编号不能为空')
    return
  }

  formLoading.value = true
  try {
    if (formType.value === 'update') {
      await updateResult(data)
      toast.success('修改成功')
    } else {
      await createResult(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    reloadList()
  } finally {
    formLoading.value = false
  }
}

/** 删除检测结果 */
async function handleDeleteResult(item: QcIndicatorResult) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除检测结果「${item.code || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteResult(item.id)
  toast.success('删除成功')
  reloadList()
}

/** 格式化检测值 */
function formatResultValue(item: QcIndicatorResultDetail) {
  if (item.value === undefined || item.value === null || item.value === '') {
    return '-'
  }
  if (item.valueType === MesQcResultValueTypeEnum.DICT && item.valueSpecification) {
    return getDictLabel(item.valueSpecification, item.value) || item.value
  }
  return item.value
}

/** 初始化 */
onMounted(() => {
  uni.$on(getReloadEvent(), reloadList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off(getReloadEvent(), reloadList)
})

/** 监听质检单变化 */
watch(
  () => props.qcId,
  async () => {
    total.value = 0
    list.value = []
    await nextTick()
    pagingRef.value?.reload()
  },
  { immediate: true },
)
</script>
