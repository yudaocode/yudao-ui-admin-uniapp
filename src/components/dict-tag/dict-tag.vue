<script setup lang="ts">
import type { TagType } from 'wot-design-uni/components/wd-tag/types'
import { computed } from 'vue'

import { getDictObj } from '@/hooks/useDict'

interface DictTagProps {
  type: string // 字典类型
  value: any // 字典值
  plain?: boolean // 是否镂空，默认为 true
}

const props = withDefaults(defineProps<DictTagProps>(), {
  plain: true,
})

/**
 * 后端颜色类型 => wd-tag 的 type 映射
 *
 * 后端可配置：default、primary、success、info、warning、danger
 * wd-tag 支持：default、primary、success、warning、danger
 * 匹配不上时默认用 default
 */
const COLOR_TYPE_MAP: Record<string, TagType> = {
  default: 'default',
  primary: 'primary',
  success: 'success',
  info: 'default', // wd-tag 无 info，映射为 default
  warning: 'warning',
  danger: 'danger',
}

/** 获取字典标签 */
const dictTag = computed(() => {
  // 校验参数有效性
  if (!props.type || props.value === undefined || props.value === null) {
    return null
  }
  // 获取字典对象
  const dict = getDictObj(props.type, String(props.value))
  if (!dict) {
    return null
  }

  return {
    label: dict.label || '',
    tagType: COLOR_TYPE_MAP[dict.colorType || ''] || 'default',
    cssClass: dict.cssClass,
  }
})
</script>

<template>
  <wd-tag
    v-if="dictTag"
    :type="dictTag.tagType"
    :plain="plain"
    :custom-class="dictTag.cssClass"
  >
    {{ dictTag.label }}
  </wd-tag>
</template>
