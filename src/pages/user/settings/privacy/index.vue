<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="隐私协议"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <!-- 协议内容 -->
    <view class="p-32rpx">
      <view class="mb-40rpx text-center">
        <text class="text-36rpx font-bold text-gray-800">隐私保护政策</text>
      </view>

      <view class="text-28rpx leading-relaxed text-gray-600">
        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">引言</text>
          <text class="block">
            芋道移动端（以下简称"我们"）非常重视用户的隐私和个人信息保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。请您在使用我们的服务前，仔细阅读并理解本隐私政策。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">一、我们收集的信息</text>
          <text class="block">
            1.1 账号信息：当您注册账号时，我们会收集您的手机号码、邮箱地址等信息。
          </text>
          <text class="mt-16rpx block">
            1.2 个人资料：您可以选择填写昵称、头像、性别、生日等个人资料信息。
          </text>
          <text class="mt-16rpx block">
            1.3 设备信息：我们可能会收集您的设备型号、操作系统版本、设备标识符等信息。
          </text>
          <text class="mt-16rpx block">
            1.4 日志信息：我们会收集您使用服务时的操作日志，包括访问时间、功能使用记录等。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">二、信息的使用</text>
          <text class="block">
            2.1 为您提供服务：我们使用收集的信息来提供、维护和改进我们的服务。
          </text>
          <text class="mt-16rpx block">
            2.2 安全保障：我们使用信息来验证身份、预防欺诈和保护账号安全。
          </text>
          <text class="mt-16rpx block">
            2.3 服务优化：我们可能使用信息来分析服务使用情况，以优化用户体验。
          </text>
          <text class="mt-16rpx block">
            2.4 通知推送：我们可能向您发送服务通知、安全提醒等信息。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">三、信息的存储</text>
          <text class="block">
            3.1 我们会采取合理的安全措施来保护您的个人信息，防止未经授权的访问、使用或泄露。
          </text>
          <text class="mt-16rpx block">
            3.2 您的个人信息将存储在中华人民共和国境内的服务器上。
          </text>
          <text class="mt-16rpx block">
            3.3 我们仅在实现服务目的所必需的期限内保留您的个人信息。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">四、信息的共享</text>
          <text class="block">
            4.1 未经您的同意，我们不会向第三方共享您的个人信息，但以下情况除外：
          </text>
          <text class="mt-16rpx block">
            - 为遵守法律法规或政府机关的要求；
          </text>
          <text class="mt-16rpx block">
            - 为保护我们或用户的合法权益；
          </text>
          <text class="mt-16rpx block">
            - 在涉及合并、收购或资产转让时，我们可能会转移您的信息。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">五、您的权利</text>
          <text class="block">
            5.1 访问权：您有权访问我们持有的关于您的个人信息。
          </text>
          <text class="mt-16rpx block">
            5.2 更正权：如果您发现我们持有的个人信息不准确，您有权要求更正。
          </text>
          <text class="mt-16rpx block">
            5.3 删除权：在特定情况下，您有权要求我们删除您的个人信息。
          </text>
          <text class="mt-16rpx block">
            5.4 撤回同意：您可以随时撤回之前给予的同意。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">六、未成年人保护</text>
          <text class="block">
            6.1 我们非常重视对未成年人个人信息的保护。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策。
          </text>
          <text class="mt-16rpx block">
            6.2 我们不会主动收集未成年人的个人信息。如果发现我们在未经监护人同意的情况下收集了未成年人的信息，我们将尽快删除相关信息。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">七、政策更新</text>
          <text class="block">
            7.1 我们可能会不时更新本隐私政策。更新后的政策将在应用内公布。
          </text>
          <text class="mt-16rpx block">
            7.2 对于重大变更，我们会通过显著方式通知您。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block font-bold text-gray-800">八、联系我们</text>
          <text class="block">
            如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：
          </text>
          <text class="mt-16rpx block">
            邮箱：7685413@qq.com
          </text>
          <text class="mt-16rpx block">
            电话：400-999-9999
          </text>
        </view>

        <view class="mt-48rpx text-center text-24rpx text-gray-400">
          <text>最后更新日期：2025 年 1 月 1 日</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}
</script>