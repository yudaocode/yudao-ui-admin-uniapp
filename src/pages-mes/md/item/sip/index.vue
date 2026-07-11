<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品 SIP" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 顶部操作 -->
    <view class="flex justify-end bg-white px-24rpx py-16rpx">
      <wd-button size="small" variant="plain" @click="reload">
        刷新
      </wd-button>
    </view>

    <!-- SIP 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无 SIP 数据"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
        <view v-for="sip in list" :key="sip.id" class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-img v-if="sip.url" :src="sip.url" width="100%" height="320rpx" mode="aspectFill" enable-preview />
          <view class="p-24rpx">
            <view class="mb-12rpx truncate text-30rpx text-[#333] font-semibold">
              {{ sip.title }}
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>展示顺序：{{ sip.sort }}</view>
              <view>所属工序：{{ getProcessLabel(sip) }}</view>
              <view v-if="sip.description">
                内容说明：{{ sip.description }}
              </view>
              <view v-if="sip.remark">
                备注：{{ sip.remark }}
              </view>
              <view>创建时间：{{ formatDateTime(sip.createTime) || '-' }}</view>
            </view>
            <view v-if="isEdit" class="mt-16rpx flex justify-end gap-16rpx">
              <wd-button v-if="canUpdate" size="small" variant="plain" @click="openForm('update', sip)">
                编辑
              </wd-button>
              <wd-button
                v-if="canDelete"
                size="small"
                type="danger"
                variant="plain"
                :loading="deletingId === sip.id"
                :disabled="deletingId !== undefined"
                @click="handleDelete(sip)"
              >
                删除
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <view v-if="isEdit && canCreate" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block @click="openForm('create')">
          添加 SIP
        </wd-button>
      </view>
    </view>

    <!-- 表单弹层 -->
    <wd-popup v-model="formVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 85vh;">
      <scroll-view scroll-y class="bg-white px-24rpx pb-40rpx pt-32rpx" style="max-height: 85vh;">
        <view class="mb-32rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formType === 'create' ? '新增 SIP' : '编辑 SIP' }}
        </view>
        <!-- 表单区域 -->
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="标题" title-width="180rpx" prop="title">
              <wd-input v-model="formData.title" placeholder="请输入标题" clearable />
            </wd-form-item>
            <wd-form-item title="展示顺序" title-width="180rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
            </wd-form-item>
            <ProcessFormPicker
              v-model="formData.processId"
              label="所属工序"
              label-width="180rpx"
              placeholder="请选择工序"
              clearable
            />
            <wd-form-item title="内容说明" title-width="180rpx" prop="description">
              <wd-textarea v-model="formData.description" placeholder="请输入详细描述" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="图片" title-width="180rpx" prop="url">
              <yd-upload-img v-model="formData.url" directory="mes/md/product-sip" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="180rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <!-- 底部操作 -->
        <view class="mt-40rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="formVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="submitForm">
            确定
          </wd-button>
        </view>
      </scroll-view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { MdProductSip } from '@/api/mes/md/item/productSip'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductSip, deleteProductSip, getProductSipPage, updateProductSip } from '@/api/mes/md/item/productSip'
import { useAccess } from '@/hooks/useAccess'
import ProcessFormPicker from '@/pages-mes/pro/process/components/process-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ itemId?: number | string, mode?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { hasAccessByCodes } = useAccess()
const isEdit = computed(() => props.mode === 'edit') // 是否编辑模式
const canCreate = computed(() => isEdit.value && hasAccessByCodes(['mes:md-item:create'])) // 是否可以新增
const canUpdate = computed(() => isEdit.value && hasAccessByCodes(['mes:md-item:update'])) // 是否可以编辑
const canDelete = computed(() => isEdit.value && hasAccessByCodes(['mes:md-item:delete'])) // 是否可以删除
const list = ref<MdProductSip[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<MdProductSip>>() // 分页组件引用
const deletingId = ref<number>() // 正在删除的 SIP 编号

const formVisible = ref(false) // 表单弹层状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<MdProductSip>({ // 表单数据
  itemId: 0,
  sort: 0,
  title: '',
  processId: undefined,
  description: '',
  url: '',
  remark: '',
})
const formSchema = createFormSchema({ // 表单校验规则
  title: [{ required: true, message: '标题不能为空' }],
  sort: [{ required: true, message: '展示顺序不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获取工序展示文案 */
function getProcessLabel(sip: MdProductSip): string {
  const name = sip.processName || ''
  const code = sip.processCode || ''
  if (name && code) {
    return `${name} (${code})`
  }
  return name || code || '-'
}

/** 查询 SIP 列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.itemId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getProductSipPage({
      itemId: Number(props.itemId),
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开新增/编辑弹层 */
function openForm(type: 'create' | 'update', sip?: MdProductSip) {
  formType.value = type
  formData.value = type === 'update' && sip
    ? {
        id: sip.id,
        itemId: sip.itemId,
        sort: sip.sort,
        title: sip.title,
        processId: sip.processId ?? undefined,
        description: sip.description || '',
        url: sip.url || '',
        remark: sip.remark || '',
      }
    : {
        itemId: Number(props.itemId) || 0,
        sort: 0,
        title: '',
        processId: undefined,
        description: '',
        url: '',
        remark: '',
      }
  formVisible.value = true
}

/** 提交表单 */
async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (formType.value === 'update' && formData.value.id === undefined) {
    toast.warning('缺少 SIP 编号')
    return
  }

  const isCreate = formType.value === 'create'
  const actionName = isCreate ? '新增' : '修改'
  try {
    await dialog.confirm({
      title: '提示',
      msg: isCreate ? '确认新增该 SIP 吗？' : '确认保存该 SIP 的修改吗？',
    })
  } catch {
    return
  }

  formLoading.value = true
  try {
    if (isCreate) {
      await createProductSip(formData.value)
    } else {
      await updateProductSip(formData.value)
    }
    formVisible.value = false
    toast.success(`${actionName}成功`)
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除 SIP */
async function handleDelete(sip: MdProductSip) {
  if (deletingId.value !== undefined) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除 SIP「${sip.title}」吗？`,
    })
  } catch {
    return
  }
  deletingId.value = sip.id
  try {
    await deleteProductSip(sip.id)
    toast.success('删除成功')
    reload()
  } finally {
    deletingId.value = undefined
  }
}

/** 初始化 */
onMounted(() => {
  if (!props.itemId) {
    toast.warning('缺少物料编号')
    delay(handleBack)
    return
  }
})
</script>
