<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        物料信息
      </view>
      <wd-button v-if="!readonly" size="small" type="primary" @click="openCreateForm">
        添加物料
      </wd-button>
    </view>
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多物料信息了"
      empty-view-text="暂无物料信息"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx">
        <view
          v-for="item in list"
          :key="item.id || item.itemId"
          class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.itemCode || `物料 #${item.itemId}` }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.itemName || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(item.iqcCheckFlag)" />
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">到货数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.arrivalQuantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">合格数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.qualifiedQuantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">检验单号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.iqcCode || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
          </view>
          <view v-if="!readonly" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="warning" variant="plain" @click="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>

  <!-- 物料行表单弹窗 -->
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
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              title="物料"
              title-width="200rpx"
              prop="itemId"
              is-link
              :value="selectedItemText"
              placeholder="请选择物料"
              @click="openItemPicker"
            />
            <wd-form-item title="到货数量" title-width="200rpx" prop="arrivalQuantity" center>
              <wd-input-number v-model="formData.arrivalQuantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-cell title="是否检验" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.iqcCheckFlag" />
              </view>
            </wd-cell>
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { WmArrivalNoticeLine } from '@/api/mes/wm/arrivalnotice/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createArrivalNoticeLine,
  deleteArrivalNoticeLine,
  getArrivalNoticeLinePage,
  updateArrivalNoticeLine,
} from '@/api/mes/wm/arrivalnotice/line'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ItemPicker from '../../../md/item/components/item-picker.vue'

const props = defineProps<{
  noticeId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmArrivalNoticeLine[]>([]) // 物料行列表
const pagingRef = ref<ZPagingRef<WmArrivalNoticeLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmArrivalNoticeLine>(getDefaultFormData()) // 表单数据
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const formTitle = computed(() => formData.value.id ? '编辑物料' : '添加物料')
const selectedItemText = computed(() => {
  if (!formData.value.itemId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
})
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  arrivalQuantity: [
    { required: true, message: '到货数量不能为空' },
    { validator: value => Number(value) > 0 || '到货数量必须大于 0' },
  ],
  iqcCheckFlag: [{ required: true, message: '是否检验不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): WmArrivalNoticeLine {
  return {
    noticeId: props.noticeId,
    iqcCheckFlag: false,
  }
}

/** 查询物料行列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.noticeId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getArrivalNoticeLinePage({
      pageNo,
      pageSize,
      noticeId: props.noticeId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmArrivalNoticeLine) {
  formData.value = {
    ...item,
    iqcCheckFlag: item.iqcCheckFlag ?? false,
  }
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemPicker() {
  itemPickerRef.value?.open()
}

/** 选择物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  formData.value = {
    ...formData.value,
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    specification: item.specification,
    unitMeasureName: item.unitMeasureName,
  }
}

/** 提交物料行 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.noticeId) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateArrivalNoticeLine(formData.value)
      toast.success('修改成功')
    } else {
      await createArrivalNoticeLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除物料行 */
async function handleDelete(item: WmArrivalNoticeLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteArrivalNoticeLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:arrivalnotice:reload', reload)
})

/** 监听到货通知编号变化 */
watch(() => props.noticeId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:arrivalnotice:reload', reload)
})
</script>
