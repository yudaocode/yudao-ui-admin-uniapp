/**
 * FAQ 常见问题数据
 */
export interface FaqItem {
  /** 问题标题 */
  title: string
  /** 问题答案 */
  content: string
}

export interface FaqCategory {
  /** 分类图标 */
  icon: string
  /** 分类标题 */
  title: string
  /** 问题列表 */
  childList: FaqItem[]
}

/** FAQ 数据列表 */
export const faqList: FaqCategory[] = [
  {
    icon: 'github-filled',
    title: '芋道问题',
    childList: [
      {
        title: '芋道开源吗？',
        content: '开源，基于 MIT 协议，可免费商用。',
      },
      {
        title: '芋道可以商用吗？',
        content: '可以，芋道采用 MIT 开源协议，允许商业使用。',
      },
      {
        title: '芋道官网地址多少？',
        content: 'https://www.iocoder.cn',
      },
      {
        title: '芋道文档地址多少？',
        content: 'https://doc.iocoder.cn',
      },
    ],
  },
  {
    icon: 'warning',
    title: '其他问题',
    childList: [
      {
        title: '如何退出登录？',
        content: '请点击 [我的] - [退出登录] 即可退出登录。',
      },
      {
        title: '如何修改用户头像？',
        content: '请点击 [我的] - [个人资料] - [选择头像] 即可更换用户头像。',
      },
      {
        title: '如何修改登录密码？',
        content: '请点击 [我的] - [账号安全] - [修改密码] 即可修改登录密码。',
      },
      {
        title: '如何切换用户？',
        content: '请先退出当前账号，然后使用其他账号重新登录即可。',
      },
    ],
  },
]
