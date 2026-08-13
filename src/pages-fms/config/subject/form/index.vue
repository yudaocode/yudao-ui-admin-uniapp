<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 使用情况提示 -->
    <view v-if="!id && parentSubjectUsed" class="m-24rpx mb-0 rounded-12rpx bg-[#fffbe6] p-24rpx text-26rpx text-[#d48806]">
      {{
        subjectUsage.childCount > 0
          ? '上级科目已有业务数据和下级科目，当前数据状态不允许继续新增下级'
          : `上级科目已有 ${subjectUsage.voucherEntryCount} 条凭证分录、${subjectUsage.initialBalanceCount} 条初始余额和 ${subjectUsage.auxiliaryCombinationCount} 个辅助核算组合，创建后将全部迁移到新科目`
      }}
    </view>
    <view v-else-if="id && (subjectUsage.used || subjectUsage.childCount > 0)" class="m-24rpx mb-0 rounded-12rpx bg-[#fffbe6] p-24rpx text-26rpx text-[#d48806]">
      {{
        subjectUsage.used
          ? '该科目已有业务数据，余额方向和辅助核算不能修改'
          : '该科目已有下级，科目类别、编码和辅助核算不能修改'
      }}
    </view>

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="科目编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              :disabled="codeDisabled"
              clearable
              placeholder="请输入科目编码"
              :maxlength="64"
            />
            <view class="mt-8rpx text-24rpx text-[#999]">
              科目级次：{{ subjectCodeRule || '未配置' }}
            </view>
          </wd-form-item>
          <wd-form-item title="科目名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入科目名称"
              :maxlength="255"
            />
          </wd-form-item>
          <yd-tree-select
            v-model="formData.parentId"
            label="上级科目"
            label-width="180rpx"
            prop="parentId"
            placeholder="请选择上级科目"
            :data="parentOptions"
            :disabled="!!id"
            check-strictly
            @change="handleParentChange"
          />
          <wd-form-item title="科目类别" title-width="180rpx" prop="category" center>
            <wd-radio-group v-model="formData.category" type="button">
              <wd-radio
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
                :disabled="categoryDisabled"
              >
                {{ option.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="余额方向" title-width="180rpx" prop="balanceDirection" center>
            <wd-radio-group v-model="formData.balanceDirection" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.FMS_DEBIT_CREDIT_DIRECTION)"
                :key="dict.value"
                :value="dict.value"
                :disabled="subjectUsage.used"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="辅助核算" title-width="180rpx" prop="auxiliaryTypeIds" center>
            <wd-checkbox-group v-model="formData.auxiliaryTypeIds" type="button">
              <wd-checkbox
                v-for="item in auxiliaryTypeList"
                :key="item.id"
                :name="item.id"
                :disabled="auxiliaryDisabled"
              >
                {{ item.name }}
              </wd-checkbox>
            </wd-checkbox-group>
            <view v-if="auxiliaryTypeList.length === 0" class="text-26rpx text-[#999]">
              暂无辅助核算类别
            </view>
          </wd-form-item>
          <wd-form-item title="外币核算" title-width="180rpx" prop="currencyIds" center>
            <wd-checkbox-group v-model="formData.currencyIds" type="button">
              <wd-checkbox
                v-for="item in currencyList"
                :key="item.id"
                :name="item.id"
                :disabled="parentSubjectUsed"
              >
                {{ item.code }} {{ item.name }}
              </wd-checkbox>
            </wd-checkbox-group>
            <view v-if="currencyList.length === 0" class="text-26rpx text-[#999]">
              暂无非本位币币别
            </view>
          </wd-form-item>
          <wd-form-item title="数量核算" title-width="180rpx" prop="quantityAccounting" center>
            <wd-switch
              v-model="formData.quantityAccounting"
              :disabled="quantityAccountingDisabled"
            />
          </wd-form-item>
          <wd-form-item v-if="formData.quantityAccounting" title="数量单位" title-width="180rpx" prop="quantityUnit">
            <wd-input
              v-model="formData.quantityUnit"
              :disabled="parentSubjectUsed"
              clearable
              placeholder="请输入数量单位"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="现金项" title-width="180rpx" prop="cash" center>
            <wd-switch
              v-model="formData.cash"
              :disabled="Boolean(parentSubject?.cash)"
            />
            <view class="ml-16rpx text-24rpx text-[#999]">
              现金及现金等价物
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        :disabled="parentDataMigrationBlocked"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import type { Currency } from '@/api/fms/config/currency'
import type { Subject, SubjectUsage } from '@/api/fms/config/subject'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getAuxiliaryTypeSimpleList } from '@/api/fms/config/auxiliary/type'
import { getCurrencySimpleList } from '@/api/fms/config/currency'
import { getFinanceParameter } from '@/api/fms/config/finance-parameter'
import {
  createSubject,
  getSubject,
  getSubjectList,
  getSubjectUsage,
  updateSubject,
} from '@/api/fms/config/subject'
import { getIntDictOptions } from '@/hooks/useDict'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  FMS_SUBJECT_PARENT_ID_ROOT,
  FmsDebitCreditDirection,
  FmsSubjectType,
} from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  parentId?: number | any
  type?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const getTitle = computed(() => props.id ? '编辑科目' : (Number(props.parentId) ? '新建下级科目' : '新增科目'))
const formLoading = ref(false) // 表单提交状态
const formData = ref<Subject>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  code: '',
  name: '',
  parentId: Number(props.parentId) || FMS_SUBJECT_PARENT_ID_ROOT,
  type: Number(props.type) || FmsSubjectType.ASSET,
  category: undefined as unknown as number,
  balanceDirection: FmsDebitCreditDirection.DEBIT,
  auxiliaryTypeIds: [],
  currencyIds: [],
  quantityAccounting: false,
  quantityUnit: undefined,
  cash: false,
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '科目编码不能为空' }],
  name: [{ required: true, message: '科目名称不能为空' }],
  parentId: [{ required: true, message: '上级科目不能为空' }],
  category: [{ required: true, message: '科目类别不能为空' }],
  balanceDirection: [{ required: true, message: '余额方向不能为空' }],
  quantityUnit: [{
    validator: (value) => {
      if (!formData.value.quantityAccounting || value) {
        return true
      }
      return '数量单位不能为空'
    },
  }],
})
const formRef = ref<FormInstance>() // 表单组件引用

const subjectList = ref<Subject[]>([]) // 当前账套同类科目，用于上级选择和重名提示
const subjectCodeRule = ref('') // 科目编码规则
const auxiliaryTypeList = ref<AuxiliaryType[]>([]) // 辅助核算类别列表
const currencyList = ref<Currency[]>([]) // 可选币别列表（不含本位币）
const subjectUsage = ref<SubjectUsage>(createEmptyUsage()) // 科目使用情况
const originalAuxiliaryTypeIds = ref<number[]>([]) // 修改前的辅助核算类别编号数组

/** 上级科目选项（含根节点） */
const parentOptions = computed(() => [
  {
    id: FMS_SUBJECT_PARENT_ID_ROOT,
    name: '无上级科目',
    children: buildParentOptions(handleTree(subjectList.value)),
  },
])
/** 当前科目类型的类别选项（字典值为 科目类型-类别） */
const categoryOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.FMS_SUBJECT_CATEGORY)
    .filter(dict => String(dict.value).startsWith(`${formData.value.type}-`))
    .map(dict => ({ label: dict.label, value: Number(String(dict.value).split('-')[1]) }))
})
/** 上级科目 */
const parentSubject = computed(() =>
  formData.value.parentId && formData.value.parentId !== FMS_SUBJECT_PARENT_ID_ROOT
    ? subjectList.value.find(item => item.id === formData.value.parentId)
    : undefined,
)
/** 新建下级时，上级科目是否已有业务数据 */
const parentSubjectUsed = computed(() => !props.id && Boolean(parentSubject.value) && subjectUsage.value.used)
/** 上级科目存在业务数据和下级科目时不允许再次迁移 */
const parentDataMigrationBlocked = computed(() => parentSubjectUsed.value && subjectUsage.value.childCount > 0)
/** 存在下级科目时不允许修改编码 */
const codeDisabled = computed(() => Boolean(props.id) && subjectUsage.value.childCount > 0)
/** 继承上级或有下级时不允许修改科目类别 */
const categoryDisabled = computed(() => Boolean(parentSubject.value) || subjectUsage.value.childCount > 0)
/** 已使用或有下级时不允许修改辅助核算；移动端不支持历史辅助核算迁移，已使用科目同样禁止变更 */
const auxiliaryDisabled = computed(() => parentSubjectUsed.value || subjectUsage.value.childCount > 0 || subjectUsage.value.used)
/** 数量核算禁用条件 */
const quantityAccountingDisabled = computed(() => parentSubjectUsed.value || subjectUsage.value.quantityDataCount > 0)

/** 创建空的科目使用情况 */
function createEmptyUsage(): SubjectUsage {
  return {
    childCount: 0,
    voucherEntryCount: 0,
    initialBalanceCount: 0,
    auxiliaryCombinationCount: 0,
    quantityDataCount: 0,
    used: false,
  }
}

/** 构造上级科目树形选项 */
function buildParentOptions(subjects: Subject[]): { id: number, name: string, children: any[] }[] {
  return subjects.map(item => ({
    id: item.id!,
    name: `${item.code} ${item.name}`,
    children: buildParentOptions(item.children || []),
  }))
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/subject/index')
}

/** 加载表单选项 */
async function loadOptions() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const [financeParameter, subjects, auxiliaryTypes, currencies] = await Promise.all([
    getFinanceParameter(accountSetId),
    getSubjectList(accountSetId, formData.value.type),
    getAuxiliaryTypeSimpleList(accountSetId),
    getCurrencySimpleList(accountSetId),
  ])
  subjectCodeRule.value = financeParameter?.subjectCodeRule || ''
  subjectList.value = subjects
  auxiliaryTypeList.value = auxiliaryTypes
  currencyList.value = currencies.filter(item => !item.standard)
}

/** 继承上级科目的核算配置 */
function inheritParentConfig(parent?: Subject) {
  if (!parent) {
    return
  }
  formData.value.category = parent.category
  formData.value.balanceDirection = parent.balanceDirection
  formData.value.auxiliaryTypeIds = [...(parent.auxiliaryTypeIds || [])]
  formData.value.currencyIds = [...(parent.currencyIds || [])]
  formData.value.quantityAccounting = parent.quantityAccounting
  formData.value.quantityUnit = parent.quantityUnit
  formData.value.cash = parent.cash
}

/** 加载上级科目的使用情况 */
async function loadParentUsage() {
  const accountSetId = fmsStore.accountSet?.id
  const parent = parentSubject.value
  if (!accountSetId || !parent?.id) {
    subjectUsage.value = createEmptyUsage()
    return
  }
  subjectUsage.value = await getSubjectUsage(accountSetId, parent.id)
}

/** 切换上级科目 */
async function handleParentChange(value: number | string | (number | string)[] | undefined) {
  if (props.id) {
    return
  }
  const parentId = typeof value === 'number' ? value : FMS_SUBJECT_PARENT_ID_ROOT
  inheritParentConfig(subjectList.value.find(item => item.id === parentId))
  await loadParentUsage()
}

/** 加载科目详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const [subject, usage] = await Promise.all([
    getSubject(accountSetId, Number(props.id)),
    getSubjectUsage(accountSetId, Number(props.id)),
  ])
  formData.value = subject
  subjectUsage.value = usage
  originalAuxiliaryTypeIds.value = [...(subject.auxiliaryTypeIds || [])]
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (!formData.value.quantityAccounting) {
      formData.value.quantityUnit = undefined
    }
    if (props.id) {
      await updateSubject(formData.value)
      toast.success('修改成功')
    } else {
      // 同级科目重名提示
      const duplicate = subjectList.value.find(
        item => item.parentId === formData.value.parentId && item.name === formData.value.name.trim(),
      )
      if (duplicate) {
        try {
          await dialog.confirm({
            title: '科目名称重复',
            msg: `同级已有名称为“${duplicate.name}”的科目（${duplicate.code}），是否仍要继续？`,
          })
        } catch {
          return
        }
      }
      // 上级科目已有业务数据时，确认迁移历史数据
      if (parentSubjectUsed.value) {
        try {
          await dialog.confirm({
            title: '迁移上级科目历史数据',
            msg: `继续后会把上级科目的 ${subjectUsage.value.voucherEntryCount} 条凭证分录、${subjectUsage.value.initialBalanceCount} 条初始余额和 ${subjectUsage.value.auxiliaryCombinationCount} 个辅助核算组合迁移到新科目，且无法撤销。是否继续？`,
          })
        } catch {
          return
        }
        formData.value.migrateParentData = true
      }
      await createSubject(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:subject:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  formData.value.accountSetId = fmsStore.accountSet?.id || 0
  if (props.id) {
    // 先加载详情确定科目类型，再按类型加载上级选项
    await getDetail()
    await loadOptions()
  } else {
    await loadOptions()
    // 新建下级时，继承上级科目的核算配置并加载使用情况
    inheritParentConfig(parentSubject.value)
    await loadParentUsage()
  }
})
</script>
