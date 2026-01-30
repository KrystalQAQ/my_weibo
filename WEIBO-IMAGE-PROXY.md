# 微博详情弹窗 - 图片反代功能说明

## 更新内容

已修改 `WeiboDetailModal.vue` 组件，确保所有图片都使用反代。

## 反代的图片类型

### 1. 用户头像
```vue
<img :src="proxyImageUrl(status.user.profile_image_url)" />
```

### 2. 微博配图
```typescript
function getImageUrl(picId: string): string {
  // 优先使用 pic_infos 中的 URL
  if (status.value?.pic_infos?.[picId]?.large?.url) {
    return proxyImageUrl(status.value.pic_infos[picId].large.url)
  }

  // 如果没有 pic_infos，使用 pic_id 拼接 URL
  // 微博图片 URL 格式：https://wx1.sinaimg.cn/mw2000/{pic_id}.jpg
  const imageUrl = `https://wx1.sinaimg.cn/mw2000/${picId}.jpg`
  return proxyImageUrl(imageUrl)
}
```

**说明：**
- `pic_ids` 数组包含图片 ID，如：`["006BCCEUgy1i960jftnwyj33b04eo4qt", ...]`
- 需要拼接成完整 URL：`https://wx1.sinaimg.cn/mw2000/006BCCEUgy1i960jftnwyj33b04eo4qt.jpg`
- 然后通过 `proxyImageUrl` 反代

### 3. 微博内容中的表情图片 ⭐ 新增
```typescript
const processedText = computed(() => {
  if (!status.value?.text)
    return ''

  let text = status.value.text

  // 替换所有 img 标签中的 src 属性
  text = text.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    const proxiedSrc = proxyImageUrl(src)
    return `<img${before}src="${proxiedSrc}"${after}>`
  })

  return text
})
```

## 工作原理

### 表情图片处理流程

1. **原始数据**：微博 API 返回的 `text` 字段包含 HTML 内容
   ```html
   去你妈的 傻逼傻逼傻逼<span class="url-icon"><img alt="[抓狂]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/02/201810_zhuakuang_mobile.png" style="width:1em; height:1em;" /></span>
   ```

2. **正则匹配**：使用正则表达式匹配所有 `<img>` 标签
   ```javascript
   /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi
   ```

3. **URL 提取**：提取 `src` 属性的值
   ```
   https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/02/201810_zhuakuang_mobile.png
   ```

4. **反代处理**：通过 `proxyImageUrl` 函数处理
   ```javascript
   proxyImageUrl('https://face.t.sinajs.cn/...')
   // 返回: 'https://your-worker.com/image?url=https%3A%2F%2Fface.t.sinajs.cn%2F...'
   ```

5. **替换 URL**：将原始 URL 替换为反代 URL
   ```html
   <img alt="[抓狂]" src="https://your-worker.com/image?url=..." style="width:1em; height:1em;" />
   ```

6. **渲染显示**：使用 `v-html` 渲染处理后的内容
   ```vue
   <div v-html="processedText" />
   ```

## 反代函数说明

`proxyImageUrl` 函数位于 `src/utils/proxy.ts`：

```typescript
export function proxyImageUrl(url: string): string {
  if (!url)
    return ''

  // 如果没有配置 Worker URL，直接返回原 URL
  if (!WORKER_URL)
    return url

  // 如果是微博图片，使用代理
  if (url.includes('sinaimg.cn') || url.includes('sina.cn') || url.includes('weibo.com')) {
    return `${WORKER_URL}/image?url=${encodeURIComponent(url)}`
  }

  return url
}
```

## 支持的图片域名

- `sinaimg.cn` - 微博图床
- `sina.cn` - 新浪图床
- `weibo.com` - 微博域名
- `t.sinajs.cn` - 表情图片域名（包含在 sina.cn 中）

## 测试方法

### 1. 检查表情图片
打开浏览器开发者工具，查看网络请求：
```
https://your-worker.com/image?url=https%3A%2F%2Fface.t.sinajs.cn%2F...
```

### 2. 检查配图
查看微博配图的请求：
```
https://your-worker.com/image?url=https%3A%2F%2Ftvax3.sinaimg.cn%2F...
```

### 3. 检查用户头像
查看用户头像的请求：
```
https://your-worker.com/image?url=https%3A%2F%2Fwx3.sinaimg.cn%2F...
```

## 注意事项

1. **Worker 配置**：确保在 `.env` 文件中配置了 `VITE_WORKER_URL`
2. **Worker 实现**：Worker 需要实现 `/image?url=` 接口
3. **URL 编码**：图片 URL 会被 `encodeURIComponent` 编码
4. **性能优化**：使用计算属性缓存处理后的文本，避免重复处理
5. **安全性**：使用正则表达式处理 HTML 时要注意 XSS 攻击

## 示例数据

### 输入（API 返回）
```json
{
  "text": "啊啊啊啊啊啊啊啊啊<br />去你妈的 傻逼傻逼傻逼<span class=\"url-icon\"><img alt=\"[抓狂]\" src=\"https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/02/201810_zhuakuang_mobile.png\" style=\"width:1em; height:1em;\" /></span>"
}
```

### 输出（处理后）
```html
啊啊啊啊啊啊啊啊啊<br />去你妈的 傻逼傻逼傻逼<span class="url-icon"><img alt="[抓狂]" src="https://your-worker.com/image?url=https%3A%2F%2Fface.t.sinajs.cn%2Ft4%2Fappstyle%2Fexpression%2Fext%2Fnormal%2F02%2F201810_zhuakuang_mobile.png" style="width:1em; height:1em;" /></span>
```

## 相关文件

- `src/components/WeiboDetailModal.vue` - 详情弹窗组件（已更新）
- `src/utils/proxy.ts` - 反代工具函数
- `worker.js` - Worker 实现（需要实现 `/image` 接口）

## 更新时间

2026-01-30
