<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="字典管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="字典类型" />
        <wd-tab title="字典数据" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <TypeList v-show="tabType === 'type'" @select="handleTypeSelect" />
    <DataList v-show="tabType === 'data'" :dict-type="selectedDictType" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import DataList from './components/data-list.vue'
import TypeList from './components/type-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['type', 'data']
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])
const selectedDictType = ref<string>() // 选中的字典类型

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 选择字典类型 */
function handleTypeSelect(dictType: string) {
  selectedDictType.value = dictType
  tabIndex.value = 1 // 切换到字典数据 tab
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>

<style lang="scss" scoped>
</style>
