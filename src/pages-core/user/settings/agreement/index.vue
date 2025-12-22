<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用户协议"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <!-- 协议内容 -->
    <view class="p-32rpx">
      <view class="mb-40rpx text-center">
        <text class="text-36rpx text-gray-800 font-bold">用户服务协议</text>
      </view>

      <view class="text-28rpx text-gray-600 leading-relaxed">
        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">一、总则</text>
          <text class="block">
            1.1 欢迎使用芋道移动端应用（以下简称"本应用"）。在使用本应用前，请您仔细阅读本协议。
          </text>
          <text class="mt-16rpx block">
            1.2 您在使用本应用时，即表示您已充分阅读、理解并接受本协议的全部内容，并与本应用达成协议。
          </text>
          <text class="mt-16rpx block">
            1.3 本应用有权根据需要不时地修订本协议，修订后的协议一经公布即生效。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">二、服务内容</text>
          <text class="block">
            2.1 本应用为用户提供企业管理、数据分析、业务处理等相关服务。
          </text>
          <text class="mt-16rpx block">
            2.2 本应用保留随时变更、中断或终止部分或全部服务的权利。
          </text>
          <text class="mt-16rpx block">
            2.3 用户理解，本应用仅提供相关的网络服务，除此之外与相关网络服务有关的设备及所需的费用均应由用户自行承担。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">三、用户账号</text>
          <text class="block">
            3.1 用户在使用本应用服务前需要注册账号。用户应当对其账号和密码的安全负责。
          </text>
          <text class="mt-16rpx block">
            3.2 用户不得将账号转让、出借或以任何方式提供给他人使用。
          </text>
          <text class="mt-16rpx block">
            3.3 如发现账号被盗用或存在安全漏洞，用户应立即通知本应用。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">四、用户行为规范</text>
          <text class="block">
            4.1 用户在使用本应用服务时，必须遵守国家法律法规，不得利用本应用从事违法违规活动。
          </text>
          <text class="mt-16rpx block">
            4.2 用户不得干扰本应用的正常运行，不得侵入本应用及国家计算机信息系统。
          </text>
          <text class="mt-16rpx block">
            4.3 用户不得传播违法、有害、骚扰、侵害他人隐私等信息。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">五、知识产权</text>
          <text class="block">
            5.1 本应用的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等均受知识产权法律法规保护。
          </text>
          <text class="mt-16rpx block">
            5.2 未经本应用书面许可，任何人不得擅自使用、复制、修改、传播本应用的任何内容。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">六、免责声明</text>
          <text class="block">
            6.1 本应用不对因网络状况、通讯线路等任何技术原因导致的服务中断或其他缺陷承担责任。
          </text>
          <text class="mt-16rpx block">
            6.2 用户因使用本应用而产生的任何损失，本应用不承担任何责任。
          </text>
        </view>

        <view class="mb-32rpx">
          <text class="mb-16rpx block text-gray-800 font-bold">七、其他</text>
          <text class="block">
            7.1 本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。
          </text>
          <text class="mt-16rpx block">
            7.2 如本协议中的任何条款无论因何种原因完全或部分无效或不具有执行力，本协议的其余条款仍应有效并且有约束力。
          </text>
        </view>

        <view class="mt-48rpx text-center text-24rpx text-gray-400">
          <text>最后更新日期：2025 年 1 月 1日</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
