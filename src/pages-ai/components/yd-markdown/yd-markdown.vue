<template>
  <view class="yd-markdown">
    <rich-text :nodes="htmlContent" selectable />
  </view>
</template>

<script lang="ts" setup>
import MarkdownIt from 'markdown-it'

const props = withDefaults(defineProps<{
  content?: string
}>(), {
  content: '',
})

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
})
markdown.renderer.rules.paragraph_open = (tokens, index, options, env, renderer) => {
  tokens[index].attrJoin('class', 'yd-markdown-paragraph')
  return renderer.renderToken(tokens, index, options)
}

const htmlContent = computed(() => markdown.render(props.content))
</script>

<style lang="scss" scoped>
.yd-markdown {
  color: #333;
  font-size: 28rpx;
  line-height: 1.75;
  word-break: break-word;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 28rpx 0 16rpx;
    color: #1f2329;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 40rpx;
  }

  :deep(h2) {
    font-size: 34rpx;
  }

  :deep(h3),
  :deep(h4) {
    font-size: 30rpx;
  }

  :deep(.yd-markdown-paragraph),
  :deep(blockquote),
  :deep(pre),
  :deep(ul),
  :deep(ol),
  :deep(table) {
    margin: 16rpx 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 42rpx;
  }

  :deep(blockquote) {
    padding: 12rpx 20rpx;
    border-left: 6rpx solid #4f7cff;
    background: #f5f7ff;
    color: #666;
  }

  :deep(code) {
    border-radius: 6rpx;
    background: #f2f3f5;
    padding: 2rpx 8rpx;
    font-family: monospace;
  }

  :deep(pre) {
    overflow-x: auto;
    border-radius: 12rpx;
    background: #1f2329;
    padding: 20rpx;
    color: #f5f5f5;
  }

  :deep(pre code) {
    background: transparent;
    padding: 0;
    color: inherit;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid #ddd;
    padding: 10rpx 12rpx;
    text-align: left;
  }

  :deep(a) {
    color: #4f7cff;
  }
}
</style>
