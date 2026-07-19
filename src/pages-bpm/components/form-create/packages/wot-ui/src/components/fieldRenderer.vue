<template>
  <view class="fc-field-renderer">
    <view v-if="isHiddenFieldType(rule)" style="display: none" />

    <view v-else-if="isLayoutTitleType(rule)" class="fc-field-renderer__layout-title">
      {{ rule.title }}
    </view>

    <view v-else-if="isLayoutGapType(rule)" class="fc-field-renderer__layout-gap" :style="{ height: getLayoutGapHeight(rule) }" />

    <FcAlert v-else-if="isAlertType(rule)" :rule="rule" style="" />

    <FcTitle v-else-if="isTitleType(rule)" :rule="rule" style="" />

    <FcHtml v-else-if="isHtmlType(rule)" :rule="rule" style="" />

    <FcDivider v-else-if="isDividerType(rule)" :rule="rule" style="" />

    <FcTag v-else-if="isTagType(rule)" :rule="rule" style="" />

    <FcImage v-else-if="isImageType(rule)" :rule="rule" style="" />

    <FcIframe v-else-if="isIframeType(rule)" :rule="rule" :title-width="titleWidth" style="" />

    <FcRichText
      v-else-if="isRichTextType(rule)"
      :model-value="modelValue"
      :rule="rule"
      :title-width="titleWidth"
      :disabled="disabled"
      style=""
      @update:model-value="emitUpdate"
    />

    <FcSignature
      v-else-if="isSignatureType(rule)"
      :model-value="modelValue"
      :rule="rule"
      :title-width="titleWidth"
      :disabled="disabled"
      style=""
      @clear="emitRuleEvent('clear')"
      @confirm="emitRuleEvent('confirm', $event)"
      @update:model-value="emitUpdate"
    />

    <FcButton
      v-else-if="isButtonType(rule)"
      :rule="rule"
      :disabled="disabled"
      style=""
      @click="emitRuleEvent('click')"
    />

    <wd-form-item v-else-if="isInputType(rule)" :title="rule.title" :title-width="titleWidth" :prop="rule.field">
      <wd-input
        :model-value="modelValue"
        :type="getInputType(rule)"
        :placeholder="getPlaceholder(rule)"
        :disabled="disabled"
        clearable
        v-bind="getRuleProps(rule)"
        @blur="emitRuleEvent('blur', $event)"
        @clear="emitRuleEvent('clear')"
        @focus="emitRuleEvent('focus', $event)"
        @update:model-value="emitUpdate"
      />
    </wd-form-item>

    <wd-form-item v-else-if="isTextareaType(rule)" :title="rule.title" :title-width="titleWidth" :prop="rule.field" layout="vertical">
      <wd-textarea
        :model-value="modelValue"
        :placeholder="getPlaceholder(rule)"
        :disabled="disabled"
        clearable
        v-bind="getRuleProps(rule)"
        @blur="emitRuleEvent('blur', $event)"
        @clear="emitRuleEvent('clear')"
        @focus="emitRuleEvent('focus', $event)"
        @update:model-value="emitUpdate"
      />
    </wd-form-item>

    <wd-form-item v-else-if="isInputNumberType(rule)" :title="rule.title" :title-width="titleWidth" :prop="rule.field" center>
      <wd-input-number
        v-bind="getRuleProps(rule)"
        :model-value="inputNumberValue"
        :min="rule.props?.min"
        :max="rule.props?.max"
        :step="rule.props?.step || 1"
        :allow-null="rule.props?.allowNull ?? true"
        :update-on-init="rule.props?.updateOnInit ?? false"
        :disabled="disabled"
        @blur="emitRuleEvent('blur', $event)"
        @focus="emitRuleEvent('focus', $event)"
        @update:model-value="emitUpdate"
      />
    </wd-form-item>

    <FcUserSelect v-else-if="isUserSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcDeptSelect v-else-if="isDeptSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcDictSelect v-else-if="isDictSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcApiSelect v-else-if="isApiSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcAreaSelect v-else-if="isAreaSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcCascader v-else-if="isCascaderType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcCalendar v-else-if="isCalendarType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcTreeSelect v-else-if="isTreeSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcTransfer v-else-if="isTransferType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcSelect v-else-if="isSelectType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcColorPicker v-else-if="isColorPickerType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @update:model-value="emitUpdate" />

    <FcRadio v-else-if="rule.type === 'radio'" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @update:model-value="emitUpdate" />

    <FcCheckbox v-else-if="rule.type === 'checkbox'" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @update:model-value="emitUpdate" />

    <wd-form-item v-else-if="rule.type === 'switch'" :title="rule.title" :title-width="titleWidth" :prop="rule.field" center>
      <wd-switch
        :model-value="modelValue"
        :disabled="disabled"
        v-bind="getRuleProps(rule)"
        @update:model-value="emitUpdate"
      />
    </wd-form-item>

    <FcDatePicker v-else-if="isDatePickerType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <FcTimePicker v-else-if="isTimePickerType(rule)" :model-value="modelValue" :rule="rule" :title-width="titleWidth" :disabled="disabled" style="" @cancel="emitRuleEvent('cancel')" @close="emitRuleEvent('close')" @confirm="emitRuleEvent('confirm', $event)" @open="emitRuleEvent('open')" @update:model-value="emitUpdate" />

    <wd-form-item v-else-if="rule.type === 'rate'" :title="rule.title" :title-width="titleWidth" :prop="rule.field" center>
      <wd-rate
        :model-value="modelValue"
        :disabled="disabled"
        v-bind="getRuleProps(rule)"
        @update:model-value="emitUpdate"
      />
    </wd-form-item>

    <wd-form-item v-else-if="isSliderType(rule)" :title="rule.title" :title-width="titleWidth" :prop="rule.field" layout="vertical">
      <wd-slider
        :model-value="modelValue"
        :disabled="disabled"
        v-bind="getRuleProps(rule)"
        :range="isSliderRangeType(rule)"
        @change="emitUpdate"
      />
    </wd-form-item>

    <FcUploader
      v-else-if="isUploadType(rule)"
      :model-value="modelValue"
      :rule="rule"
      :title-width="titleWidth"
      :disabled="disabled"
      style=""
      @fail="emitRuleEvent('fail', $event)"
      @remove="emitRuleEvent('remove', $event)"
      @success="emitRuleEvent('success', $event)"
      @update:model-value="emitUpdate"
    />

    <wd-form-item v-else-if="rule.type === 'span'" :title="rule.title" :title-width="titleWidth" :prop="rule.field">
      <view class="fc-field-renderer__text">
        {{ formatDisplayValue(modelValue) }}
      </view>
    </wd-form-item>

    <wd-form-item v-else :title="rule.title || rule.type" :title-width="titleWidth" :prop="rule.field" layout="vertical">
      <view class="fc-field-renderer__unsupported">
        暂不支持「{{ rule.title || rule.type }}」{{ unsupportedSuffix }}
      </view>
    </wd-form-item>
  </view>
</template>

<script lang="ts" setup>
import type { NormalizedFormCreateRule } from '../../../../types/typing'
import { computed } from 'vue'
import {
  getInputType,
  getPlaceholder,
  getRuleProps,
  isAlertType,
  isApiSelectType,
  isAreaSelectType,
  isButtonType,
  isCalendarType,
  isCascaderType,
  isColorPickerType,
  isDatePickerType,
  isDeptSelectType,
  isDictSelectType,
  isDividerType,
  isHiddenFieldType,
  isHtmlType,
  isIframeType,
  isImageType,
  isInputNumberType,
  isInputType,
  isLayoutGapType,
  isLayoutTitleType,
  isRichTextType,
  isSelectType,
  isSignatureType,
  isSliderRangeType,
  isSliderType,
  isTagType,
  isTextareaType,
  isTimePickerType,
  isTitleType,
  isTransferType,
  isTreeSelectType,
  isUploadType,
  isUserSelectType,
} from '../core/utils'
import FcButton from './button.vue'
import FcCalendar from './calendar.vue'
import FcCascader from './cascader.vue'
import FcCheckbox from './checkbox.vue'
import FcColorPicker from './colorPicker.vue'
import FcApiSelect from './custom/apiSelect.vue'
import FcAreaSelect from './custom/areaSelect.vue'
import FcDeptSelect from './custom/deptSelect.vue'
import FcDictSelect from './custom/dictSelect.vue'
import FcUserSelect from './custom/userSelect.vue'
import FcDatePicker from './datePicker.vue'
import FcAlert from './display/alert.vue'
import FcDivider from './display/divider.vue'
import FcHtml from './display/html.vue'
import FcImage from './display/image.vue'
import FcTag from './display/tag.vue'
import FcTitle from './display/title.vue'
import FcIframe from './iframe.vue'
import FcRadio from './radio.vue'
import FcRichText from './richText.vue'
import FcSelect from './select.vue'
import FcSignature from './signature.vue'
import FcTimePicker from './timePicker.vue'
import FcTransfer from './transfer.vue'
import FcTreeSelect from './treeSelect.vue'
import FcUploader from './uploader.vue'

const props = withDefaults(defineProps<{
  disabled?: boolean
  modelValue?: any
  rule: NormalizedFormCreateRule
  titleWidth?: string | number
  unsupportedSuffix?: string
}>(), {
  disabled: false,
  unsupportedSuffix: '组件',
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'rule-event': [eventName: string, ...args: any[]]
}>()

const inputNumberValue = computed(() => {
  return props.modelValue === undefined || props.modelValue === null ? '' : props.modelValue
})

function emitUpdate(value: any) {
  emit('update:modelValue', value)
}

function emitRuleEvent(eventName: string, ...args: any[]) {
  emit('rule-event', eventName, ...args)
}

function formatDisplayValue(value: any) {
  if (Array.isArray(value)) {
    return value.join('，')
  }
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

function getLayoutGapHeight(rule: NormalizedFormCreateRule) {
  const height = rule.props?.height
  if (typeof height === 'number') {
    return `${height}px`
  }
  if (typeof height === 'string' && height.trim()) {
    return height
  }
  return '24rpx'
}
</script>

<style lang="scss" scoped>
.fc-field-renderer {
  width: 100%;
}

.fc-field-renderer__layout-title {
  color: #1f2329;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
  padding: 24rpx 24rpx 8rpx;
}

.fc-field-renderer__layout-gap {
  background: transparent;
}

.fc-field-renderer__text {
  color: #333;
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-all;
}

.fc-field-renderer__unsupported {
  color: #999;
  font-size: 26rpx;
  padding: 24rpx;
  text-align: center;
}
</style>
