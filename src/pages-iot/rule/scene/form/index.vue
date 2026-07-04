<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view scroll-y class="min-h-0 w-full flex-1 pb-180rpx">
      <!-- 基础信息 -->
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="规则名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入规则名称" clearable />
          </wd-form-item>
          <wd-form-item title="规则状态" title-width="200rpx" center prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="规则描述" title-width="200rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入规则描述" :maxlength="200" show-word-limit />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 触发器（满足任一即触发） -->
      <view class="mt-20rpx px-24rpx">
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          触发器（满足任一即触发）
        </view>
        <TriggerItem
          v-for="(trigger, index) in formData.triggers"
          :key="index"
          :trigger="trigger"
          :product-options="productOptions"
          :index="index"
          @update:trigger="updateTrigger(index, $event)"
          @remove="removeTrigger(index)"
        />
        <wd-button size="small" type="primary" variant="plain" @click="addTrigger">
          + 添加触发器
        </wd-button>
      </view>

      <!-- 执行器 -->
      <view class="mt-24rpx px-24rpx">
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          执行器
        </view>
        <ActionItem
          v-for="(action, index) in formData.actions"
          :key="index"
          :action="action"
          :product-options="productOptions"
          :alert-config-options="alertConfigOptions"
          :index="index"
          @update:action="updateAction(index, $event)"
          @remove="removeAction(index)"
        />
        <wd-button size="small" type="primary" variant="plain" @click="addAction">
          + 添加执行器
        </wd-button>
      </view>
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
import type { AlertConfig } from '@/api/iot/alert/config'
import type { Product } from '@/api/iot/product/product'
import type { Action, IotSceneRule, Trigger } from '@/api/iot/rule/scene'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSimpleAlertConfigList } from '@/api/iot/alert/config'
import { getSimpleProductList } from '@/api/iot/product/product'
import { createRuleScene, getRuleScene, updateRuleScene } from '@/api/iot/rule/scene'
import { getIntDictOptions } from '@/hooks/useDict'
import { validateActionItem, validateTriggerItem } from '@/pages-iot/utils/sceneRule'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, IotRuleSceneActionTypeEnum, IotRuleSceneTriggerTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ActionItem from '../components/action-item.vue'
import TriggerItem from '../components/trigger-item.vue'

const props = defineProps<{ id?: number | string }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑场景联动' : '新增场景联动')
const formLoading = ref(false) // 表单提交状态
const productOptions = ref<Product[]>([]) // 产品选项
const alertConfigOptions = ref<AlertConfig[]>([]) // 告警配置选项
const formData = ref<IotSceneRule>({
  id: undefined,
  name: '',
  description: '',
  status: CommonStatusEnum.ENABLE,
  triggers: [createTrigger()],
  actions: [],
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '规则名称不能为空' }],
  status: [{ required: true, message: '规则状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 创建默认触发器 */
function createTrigger(): Trigger {
  return {
    type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
    productId: undefined,
    deviceId: undefined,
    identifier: undefined,
    operator: undefined,
    value: undefined,
    cronExpression: undefined,
    conditionGroups: [],
  }
}

/** 创建默认执行器 */
function createAction(): Action {
  return {
    type: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    productId: undefined,
    deviceId: undefined,
    identifier: undefined,
    params: '',
    alertConfigId: undefined,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/rule/scene/index')
}

/** 添加触发器 */
function addTrigger() {
  formData.value.triggers?.push(createTrigger())
}

/** 删除触发器 */
function removeTrigger(index: number) {
  formData.value.triggers?.splice(index, 1)
}

/** 更新触发器 */
function updateTrigger(index: number, trigger: Trigger) {
  if (formData.value.triggers) {
    formData.value.triggers[index] = trigger
  }
}

/** 添加执行器 */
function addAction() {
  formData.value.actions?.push(createAction())
}

/** 删除执行器 */
function removeAction(index: number) {
  formData.value.actions?.splice(index, 1)
}

/** 更新执行器 */
function updateAction(index: number, action: Action) {
  if (formData.value.actions) {
    formData.value.actions[index] = action
  }
}

/** 加载场景联动详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getRuleScene(Number(props.id))
  formData.value = {
    ...data,
    triggers: data.triggers?.length ? data.triggers : [createTrigger()],
    actions: data.actions || [],
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 触发器兜底校验（至少一个 + 逐项必填）
  const triggers = formData.value.triggers || []
  if (triggers.length === 0) {
    toast.warning('请至少配置一个触发器')
    return
  }
  for (let i = 0; i < triggers.length; i++) {
    const error = validateTriggerItem(triggers[i], i)
    if (error) {
      toast.warning(error)
      return
    }
  }
  // 执行器兜底校验
  const actions = formData.value.actions || []
  if (actions.length === 0) {
    toast.warning('请至少配置一个执行器')
    return
  }
  for (let i = 0; i < actions.length; i++) {
    const error = validateActionItem(actions[i], i)
    if (error) {
      toast.warning(error)
      return
    }
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateRuleScene(formData.value)
      toast.success('修改成功')
    } else {
      await createRuleScene(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('iot:scene-rule:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  [productOptions.value, alertConfigOptions.value] = await Promise.all([getSimpleProductList(), getSimpleAlertConfigList()])
  await getDetail()
})
</script>
