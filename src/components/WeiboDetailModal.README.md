# 微博详情弹窗组件 (WeiboDetailModal)

一个美观、现代的微博详情弹窗组件，用于展示微博的完整内容和互动数据。

## 功能特性

- ✨ 现代化的弹窗设计，带有流畅的动画效果
- 📱 完全响应式，支持移动端和桌面端
- 🌓 支持深色模式
- 🖼️ 支持多图展示（1-9张图片的自适应布局）
- 😊 支持微博表情渲染
- 📊 展示互动数据（转发、评论、点赞）
- 🔗 支持跳转到微博原文
- ⌨️ 支持键盘 ESC 关闭
- 🎨 使用 UnoCSS 原子化 CSS

## 组件位置

```
src/components/WeiboDetailModal.vue
```

## 数据格式

组件接收的数据格式如下：

```typescript
interface WeiboDetailData {
  render_data: Array<{
    status: {
      id: string                    // 微博ID
      mid: string                   // 微博MID
      created_at: string            // 发布时间
      text: string                  // 微博内容（HTML格式）
      source: string                // 发布来源（设备）
      user: {
        id: number
        screen_name: string         // 用户昵称
        profile_image_url: string   // 头像URL
        profile_url: string         // 用户主页URL
        description: string         // 用户简介
        followers_count: string | number  // 粉丝数
        statuses_count: number      // 微博数
        verified: boolean           // 是否认证
        verified_type: number       // 认证类型
        gender: string              // 性别
        mbtype: number              // 会员类型
        avatar_hd: string           // 高清头像
      }
      reposts_count: number         // 转发数
      comments_count: number        // 评论数
      attitudes_count: number       // 点赞数
      pic_ids: string[]             // 图片ID列表
      pic_infos?: Record<string, {  // 图片信息
        large?: { url: string }
      }>
      region_name?: string          // 发布地区
      isLongText: boolean           // 是否长文本
    }
  }>
  detail_id: string
}
```

## 使用方法

### 1. 基本使用

```vue
<script setup lang="ts">
import WeiboDetailModal from '~/components/WeiboDetailModal.vue'

const showDetailModal = ref(false)
const currentDetailData = ref(null)

// 打开详情弹窗
async function openDetail(weiboId: string) {
  // 调用 API 获取详情数据
  const response = await fetch(`/api/detail/${weiboId}`)
  const data = await response.json()

  currentDetailData.value = data
  showDetailModal.value = true
}

// 关闭弹窗
function closeDetail() {
  showDetailModal.value = false
}
</script>

<template>
  <div>
    <!-- 触发按钮 -->
    <button @click="openDetail('5260469138622617')">
      查看详情
    </button>

    <!-- 详情弹窗 -->
    <WeiboDetailModal
      v-model:show="showDetailModal"
      :detail-data="currentDetailData"
      @close="closeDetail"
    />
  </div>
</template>
```

### 2. 在微博列表中使用

```vue
<script setup lang="ts">
import WeiboDetailModal from '~/components/WeiboDetailModal.vue'

const showDetailModal = ref(false)
const currentDetailData = ref(null)
const weiboList = ref([...]) // 你的微博列表数据

async function viewDetail(weiboId: string) {
  try {
    const response = await fetch(`/api/detail/${weiboId}`)
    const data = await response.json()
    currentDetailData.value = data
    showDetailModal.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}
</script>

<template>
  <div>
    <!-- 微博列表 -->
    <div v-for="weibo in weiboList" :key="weibo.id">
      <div @click="viewDetail(weibo.id)">
        {{ weibo.text }}
      </div>
    </div>

    <!-- 详情弹窗 -->
    <WeiboDetailModal
      v-model:show="showDetailModal"
      :detail-data="currentDetailData"
      @close="() => showDetailModal = false"
    />
  </div>
</template>
```

### 3. 使用 v-model

组件支持 `v-model:show` 双向绑定：

```vue
<WeiboDetailModal
  v-model:show="showDetailModal"
  :detail-data="currentDetailData"
/>
```

## Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `show` | `boolean` | 是 | 控制弹窗显示/隐藏 |
| `detailData` | `WeiboDetailData \| null` | 是 | 微博详情数据 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `close` | - | 关闭弹窗时触发 |
| `update:show` | `value: boolean` | 更新 show 状态时触发 |

## API 接口示例

你需要实现一个获取微博详情的 API 接口：

```typescript
// 示例：使用 fetch
async function fetchWeiboDetail(weiboId: string) {
  const response = await fetch(`/api/detail/${weiboId}`)
  return response.json()
}

// 示例：使用 axios
async function fetchWeiboDetail(weiboId: string) {
  const { data } = await axios.get(`/api/detail/${weiboId}`)
  return data
}
```

接口应该返回符合 `WeiboDetailData` 格式的数据。

## 样式定制

组件使用 UnoCSS 原子化 CSS，你可以通过以下方式定制样式：

### 1. 修改主题色

在 `uno.config.ts` 中修改主题色：

```typescript
export default defineConfig({
  theme: {
    colors: {
      rose: {
        // 自定义玫瑰色
      }
    }
  }
})
```

### 2. 修改字体

组件使用 CSS 变量 `--font-heading` 和 `--font-body`，你可以在全局样式中定义：

```css
:root {
  --font-heading: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-body: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

### 3. 自定义滚动条

组件内置了自定义滚动条样式，你可以在组件的 `<style>` 部分修改。

## 注意事项

1. **图片代理**：组件使用 `proxyImageUrl` 函数处理图片 URL，确保你的项目中有这个工具函数。

2. **Teleport**：组件使用 `<Teleport to="body">` 将弹窗渲染到 body 下，确保你的应用支持 Teleport。

3. **动画**：组件使用 `motion-safe:` 前缀的动画类，这会在用户禁用动画时自动禁用动画效果。

4. **无障碍**：组件包含了 ARIA 属性，支持屏幕阅读器。

5. **响应式**：组件在移动端会自动调整布局，建议在移动端测试。

## 示例数据

查看 `WeiboDetailModal.example.vue` 文件获取完整的示例数据和使用方法。

## 依赖

- Vue 3
- UnoCSS
- @vueuse/core (可选，用于键盘事件处理)

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## License

MIT
