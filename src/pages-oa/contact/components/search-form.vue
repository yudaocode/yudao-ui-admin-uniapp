<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          关键词
        </view>
        <wd-input
          v-model="formData.keyword"
          placeholder="姓名 / 手机号 / 公司"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <yd-search-picker
          v-model="formData.alphabet"
          label="拼音首字母"
          :columns="alphabetOptions"
          all-option
          all-label="全部"
          placeholder="请选择拼音首字母"
        />
      </view>
      <view v-if="showHandleStatus" class="yd-search-form-item">
        <view class="yd-search-form-label">
          处理状态
        </view>
        <wd-radio-group v-model="formData.handleStatus" type="button">
          <wd-radio value="all">
            全部
          </wd-radio>
          <wd-radio :value="false">
            待处理
          </wd-radio>
          <wd-radio :value="true">
            已处理
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const props = defineProps<{
  showHandleStatus?: boolean // 是否展示处理状态筛选（共享与我）
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  keyword: undefined as string | undefined,
  alphabet: undefined as string | undefined,
  handleStatus: 'all' as boolean | 'all', // all 哨兵值承接「全部」，搜索时转为 undefined
}) // 搜索表单数据
const alphabetOptions = Array.from({ length: 26 }, (_, i) => { // 拼音首字母选项 A-Z，后端仅接受单个大写字母
  const letter = String.fromCharCode(65 + i)
  return { label: letter, value: letter }
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.keyword) {
    conditions.push(`关键词:${formData.keyword}`)
  }
  if (formData.alphabet) {
    conditions.push(`首字母:${formData.alphabet}`)
  }
  if (props.showHandleStatus && formData.handleStatus !== 'all') {
    conditions.push(`处理:${formData.handleStatus ? '已处理' : '待处理'}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索联系人'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    keyword: formData.keyword?.trim() || undefined,
    alphabet: formData.alphabet || undefined,
    handleStatus: props.showHandleStatus && formData.handleStatus !== 'all' ? formData.handleStatus : undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.keyword = undefined
  formData.alphabet = undefined
  formData.handleStatus = 'all'
  visible.value = false
  emit('reset')
}
</script>
