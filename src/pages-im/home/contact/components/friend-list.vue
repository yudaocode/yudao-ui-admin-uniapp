<template>
  <view class="h-full flex flex-col bg-white">
    <!-- 搜索 -->
    <view class="friend-search-wrap">
      <wd-search
        v-model="keyword"
        variant="filled"
        custom-class="friend-search"
        placeholder="搜索好友"
        hide-cancel
      />
      <view class="search-add-button" @click="handleAdd">
        <wd-icon name="plus" size="40rpx" color="#333" />
      </view>
    </view>

    <view class="relative min-h-0 flex-1">
      <scroll-view class="h-full" scroll-y :scroll-into-view="scrollTarget" scroll-with-animation>
        <!-- 新的朋友入口（非搜索态） -->
        <view v-if="!keyword" class="flex items-center gap-20rpx px-24rpx py-20rpx active:bg-[#f5f5f5]" @click="goRequests">
          <view class="h-84rpx w-84rpx flex items-center justify-center rounded-12rpx bg-[#fa8c16]">
            <wd-icon name="user-add" size="44rpx" color="#fff" />
          </view>
          <view class="flex-1 border-b border-b-[#f2f3f5] py-10rpx text-30rpx text-[#222]">
            新的朋友
          </view>
        </view>

        <!-- 群聊入口（非搜索态） -->
        <view v-if="!keyword" class="flex items-center gap-20rpx px-24rpx py-20rpx active:bg-[#f5f5f5]" @click="goGroupList">
          <view class="h-84rpx w-84rpx flex items-center justify-center rounded-12rpx bg-[#07c160]">
            <wd-icon name="user-group" size="44rpx" color="#fff" />
          </view>
          <view class="flex-1 border-b border-b-[#f2f3f5] py-10rpx text-30rpx text-[#222]">
            群聊
          </view>
        </view>

        <!-- 分组好友列表 -->
        <template v-for="group in displayGroups" :key="group.letter || 'all'">
          <view v-if="group.letter" :id="`fl-${group.letter}`" class="bg-[#f7f8fa] px-24rpx py-8rpx text-24rpx text-[#999]">
            {{ group.letter }}
          </view>
          <FriendItem
            v-for="item in group.list"
            :key="item.id"
            :friend="item"
            @open="openProfile"
          />
        </template>

        <wd-empty
          v-if="!loading && totalCount === 0"
          icon="content"
          :tip="keyword.trim() ? '没有匹配的好友' : '暂无好友'"
        />
        <view class="h-40rpx" />
      </scroll-view>

      <!-- 右侧字母索引条（非搜索态） -->
      <view v-if="!keyword && indexLetters.length > 0" class="index-bar">
        <text
          v-for="letter in indexLetters"
          :key="letter"
          class="index-bar-item"
          @click="scrollTo(letter)"
        >
          {{ letter }}
        </text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FriendLite } from '../../types'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useFriendBuckets } from '../../composables/useFriendBuckets'
import { useFriendStore } from '../../store/friendStore'
import FriendItem from './friend-item.vue'

const emit = defineEmits<{
  add: []
}>()

const keyword = ref('') // 搜索关键词
const scrollTarget = ref('') // 滚动锚点
const friendStore = useFriendStore()
const { getActiveFriendLiteList: friendItems, loading } = storeToRefs(friendStore)

const { filtered: filteredFriends, buckets } = useFriendBuckets(friendItems, keyword)
const displayGroups = computed(() => keyword.value
  ? [{ letter: '', list: filteredFriends.value }]
  : buckets.value) // 搜索态不展示分桶标题

/** 索引条字母 */
const indexLetters = computed(() => displayGroups.value.map(group => group.letter).filter(Boolean))

/** 好友总数 */
const totalCount = computed(() => filteredFriends.value.length)

/** 打开新增操作 */
function handleAdd() {
  emit('add')
}

/** 新的朋友 */
function goRequests() {
  uni.navigateTo({ url: '/pages-im/home/contact/request/index?tab=friend' })
}

/** 群聊列表 */
function goGroupList() {
  uni.navigateTo({ url: '/pages-im/home/contact/group/list/index' })
}

/** 打开好友资料页 */
function openProfile(item: FriendLite) {
  uni.navigateTo({
    url: `/pages-im/home/contact/friend/detail/index?friendUserId=${item.id}`,
  })
}

/** 滚动到字母分组 */
function scrollTo(letter: string) {
  scrollTarget.value = ''
  nextTick(() => {
    scrollTarget.value = `fl-${letter}`
  })
}

/** 加载联系人 */
onMounted(() => void friendStore.fetchFriendList())
</script>

<style lang="scss" scoped>
.friend-search-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #ededed;
}

:deep(.friend-search) {
  min-width: 0;
  flex: 1;
  --wot-search-padding: 0;
  --wot-search-bg: transparent;
  --wot-search-input-bg: #fff;
  --wot-search-cover-bg: transparent;
  --wot-search-input-height: 64rpx;
  --wot-search-input-radius: 10rpx;
  --wot-search-input-font-size: 28rpx;
  --wot-search-placeholder-font-size: 28rpx;
}

.search-add-button {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx;
  background: #fff;

  &:active {
    background: #e2e2e2;
  }
}

.index-bar {
  position: absolute;
  top: 50%;
  right: 4rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-50%);
}

.index-bar-item {
  padding: 2rpx 8rpx;
  color: #1677ff;
  font-size: 20rpx;
  line-height: 1.4;
}
</style>
