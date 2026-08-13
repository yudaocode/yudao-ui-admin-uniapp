<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="账套详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <view class="mb-16rpx flex items-center gap-12rpx px-8rpx">
        <text class="text-34rpx text-[#333] font-semibold">{{ formData.companyName }}</text>
        <wd-tag v-if="formData.defaultStatus" type="primary" plain>
          默认
        </wd-tag>
        <wd-tag :type="formData.initialized ? 'success' : 'info'" plain>
          {{ formData.initialized ? '已启用' : '待初始化' }}
        </wd-tag>
      </view>
      <wd-cell-group title="基本信息" border>
        <wd-cell title="公司编码" :value="formData.companyCode || '-'" />
        <wd-cell title="所在行业" :value="formData.industry || '-'" />
        <wd-cell title="所在地" :value="formData.location || '-'" />
        <wd-cell title="法人代表" :value="formData.legalRepresentative || '-'" />
        <wd-cell title="法人身份证号" :value="formData.legalRepresentativeIdNumber || '-'" />
        <wd-cell title="营业执照号" :value="formData.businessLicenseNumber || '-'" />
        <wd-cell title="组织机构代码" :value="formData.organizationCode || '-'" />
        <wd-cell v-if="formData.initialized" title="启用期间" :value="formatFmsStartTime(formData.startTime) || '-'" />
        <wd-cell title="公司简介" :value="formData.companyProfile || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
      <wd-cell-group title="联系方式" border>
        <wd-cell title="联系人" :value="formData.contactName || '-'" />
        <wd-cell title="办公电话" :value="formData.officeTelephone || '-'" />
        <wd-cell title="手机号码" :value="formData.mobile || '-'" />
        <wd-cell title="传真号码" :value="formData.faxNumber || '-'" />
        <wd-cell title="QQ 号码" :value="formData.qqNumber || '-'" />
        <wd-cell title="邮箱" :value="formData.email || '-'" />
        <wd-cell title="其他" :value="formData.otherContact || '-'" />
        <wd-cell title="详细地址" :value="formData.address || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canEdit || canAuthorize || canInitialize" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canInitialize" class="flex-1" type="warning" @click="handleInitialize">
          开始记账
        </wd-button>
        <wd-button v-if="canAuthorize" class="flex-1" type="info" @click="handleAuthorize">
          授权
        </wd-button>
        <wd-button v-if="canEdit" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AccountSet } from '@/api/fms/config/account-set'
import { onUnload } from '@dcloudio/uni-app'
import { getAccountSet } from '@/api/fms/config/account-set'
import { AccountUserLevel } from '@/api/fms/config/account-user'
import { useAccess } from '@/hooks/useAccess'
import { formatFmsStartTime } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const formData = ref<AccountSet>({} as AccountSet) // 详情数据

/** 主管才可编辑账套 */
const canEdit = computed(() =>
  formData.value.level === AccountUserLevel.OWNER
  && hasAccessByCodes(['fms:config:account-set:update']),
)
/** 主管才可授权成员 */
const canAuthorize = computed(() =>
  formData.value.level === AccountUserLevel.OWNER
  && hasAccessByCodes(['fms:config:account-set:authorize']),
)
/** 未初始化且非查看者才可开始记账 */
const canInitialize = computed(() =>
  !!formData.value.id
  && !formData.value.initialized
  && formData.value.level !== AccountUserLevel.READ
  && hasAccessByCodes(['fms:config:account-set:initialize']),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/account-set/index')
}

/** 加载账套详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAccountSet(Number(props.id))
}

/** 编辑账套 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/account-set/form/index?id=${props.id}` })
}

/** 账套成员授权 */
function handleAuthorize() {
  uni.navigateTo({ url: `/pages-fms/config/account-set/member/index?id=${props.id}` })
}

/** 开始记账（初始化账套） */
function handleInitialize() {
  uni.navigateTo({ url: `/pages-fms/config/account-set/initialize/index?id=${props.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('fms:config:account-set:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:account-set:reload', getDetail)
})
</script>
