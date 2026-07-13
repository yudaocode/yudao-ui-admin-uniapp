<template>
  <view class="h-full flex flex-col bg-white">
    <!-- 搜索 -->
    <view class="friend-search-wrap">
      <wd-search v-model="keyword" custom-class="friend-search" placeholder="搜索好友" hide-cancel />
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
          <view
            v-for="item in group.friends"
            :key="item.friendUserId"
            class="flex items-center gap-20rpx px-24rpx active:bg-[#f5f5f5]"
            @click="openProfile(item)"
          >
            <view class="py-16rpx">
              <ImAvatar :src="item.avatar" :name="getFriendName(item)" size="84rpx" :round="false" />
            </view>
            <view class="min-w-0 flex-1 border-b border-b-[#f2f3f5] py-16rpx">
              <view class="flex items-center gap-10rpx">
                <text class="line-clamp-1 text-30rpx text-[#222] font-medium">{{ getFriendName(item) }}</text>
                <wd-tag v-if="item.pinned" type="primary" plain custom-class="scale-90">
                  置顶
                </wd-tag>
                <wd-tag v-if="item.blocked" type="danger" plain custom-class="scale-90">
                  已拉黑
                </wd-tag>
              </view>
              <view class="line-clamp-1 mt-4rpx text-24rpx text-[#999]">
                昵称：{{ item.nickname || '-' }}
              </view>
            </view>
          </view>
        </template>

        <wd-empty v-if="!loading && totalCount === 0" icon="content" tip="暂无好友" />
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
import type { ImFriendRespVO } from '@/api/im/friend'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMyFriendList } from '@/api/im/friend'
import { getFriendDisplayName as getFriendName } from '@/pages-im/utils/user'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  active?: boolean
}>()
const emit = defineEmits<{
  add: []
}>()

const keyword = ref('') // 搜索关键词
const loading = ref(false) // 加载状态
const friendList = ref<ImFriendRespVO[]>([]) // 好友列表
const scrollTarget = ref('') // 滚动锚点

/** 好友首字母（取拼音首字母，非字母归入 #） */
function getFriendLetter(item: ImFriendRespVO): string {
  const pinyin = (item.displayNamePinyin || item.nicknamePinyin || '').trim()
  const first = pinyin.charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

/** 过滤后的好友 */
const filteredFriends = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  return friendList.value
    .filter(item => item.status !== 1)
    .filter((item) => {
      if (!word) {
        return true
      }
      return [item.displayName, item.nickname, item.friendUserId].some(value => String(value || '').toLowerCase().includes(word))
    })
})

/** 分组（搜索态为单组无表头，正常态按字母分组） */
const displayGroups = computed(() => {
  if (keyword.value) {
    return [{ letter: '', friends: filteredFriends.value }]
  }
  const groups: Record<string, ImFriendRespVO[]> = {}
  filteredFriends.value.forEach((item) => {
    const letter = getFriendLetter(item)
    if (!groups[letter]) {
      groups[letter] = []
    }
    groups[letter].push(item)
  })
  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '#') {
        return 1
      }
      if (b === '#') {
        return -1
      }
      return a.localeCompare(b)
    })
    .map(letter => ({
      letter,
      friends: groups[letter].sort((x, y) => getFriendName(x).localeCompare(getFriendName(y))),
    }))
})

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
  uni.navigateTo({ url: '/pages-im/home/request/index?tab=friend' })
}

/** 群聊列表 */
function goGroupList() {
  uni.navigateTo({ url: '/pages-im/home/group/list/index' })
}

/** 打开好友资料页 */
function openProfile(item: ImFriendRespVO) {
  uni.navigateTo({
    url: `/pages-im/home/friend/detail/index?friendUserId=${item.friendUserId}`,
  })
}

/** 滚动到字母分组 */
function scrollTo(letter: string) {
  scrollTarget.value = ''
  nextTick(() => {
    scrollTarget.value = `fl-${letter}`
  })
}

/** 加载好友 */
async function load() {
  loading.value = true
  try {
    friendList.value = await getMyFriendList()
  } finally {
    loading.value = false
  }
}

/** 激活时加载 */
watch(() => props.active, (val) => {
  if (val) {
    load()
  }
}, { immediate: true })

/** 订阅好友关系变化 */
onMounted(() => uni.$on('im:friends:reload', load))

/** 释放好友关系订阅 */
onUnmounted(() => uni.$off('im:friends:reload', load))
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
  --wot-search-cover-bg: #fff;
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
