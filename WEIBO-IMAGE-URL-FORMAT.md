# 微博图片 URL 拼接说明

## 问题描述

微博详情 API 返回的数据中，`pic_ids` 是图片 ID 数组，而不是完整的 URL。

## 数据格式

### API 返回的数据
```json
{
  "status": {
    "pic_ids": [
      "006BCCEUgy1i960jftnwyj33b04eo4qt",
      "006BCCEUgy1i960jk580wj30ws17otnk",
      "006BCCEUgy1i960jdcjmyj32c0341u0x",
      "006BCCEUgy1i960jc6e2wj32c0340u0x",
      "006BCCEUgy1i960jnfrg9j32c0341b2a"
    ],
    "pic_infos": {
      // 可能存在，也可能不存在
      "006BCCEUgy1i960jftnwyj33b04eo4qt": {
        "large": {
          "url": "https://wx1.sinaimg.cn/large/006BCCEUgy1i960jftnwyj33b04eo4qt.jpg"
        }
      }
    }
  }
}
```

## URL 拼接规则

### 微博图片 URL 格式
```
https://wx1.sinaimg.cn/{size}/{pic_id}.jpg
```

### 尺寸选项
- `thumbnail` - 缩略图（150x150）
- `bmiddle` - 中等尺寸（440px 宽）
- `mw690` - 中等尺寸（690px 宽）
- `mw2000` - 大尺寸（2000px 宽）⭐ 推荐
- `large` - 原图
- `orj960` - 原图（960px）
- `orj480` - 原图（480px）

### 推荐使用 `mw2000`
- 质量较高
- 文件大小适中
- 加载速度快

## 实现代码

### 当前实现
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

### 处理流程
1. **检查 pic_infos**：如果存在完整 URL，直接使用
2. **拼接 URL**：使用 `pic_id` 拼接成标准 URL
3. **反代处理**：通过 `proxyImageUrl` 函数反代

## 示例

### 输入
```javascript
picId = "006BCCEUgy1i960jftnwyj33b04eo4qt"
```

### 输出
```javascript
// 拼接后的 URL
"https://wx1.sinaimg.cn/mw2000/006BCCEUgy1i960jftnwyj33b04eo4qt.jpg"

// 反代后的 URL
"https://your-worker.com/image?url=https%3A%2F%2Fwx1.sinaimg.cn%2Fmw2000%2F006BCCEUgy1i960jftnwyj33b04eo4qt.jpg"
```

## 域名说明

微博图片使用多个 CDN 域名：
- `wx1.sinaimg.cn`
- `wx2.sinaimg.cn`
- `wx3.sinaimg.cn`
- `wx4.sinaimg.cn`
- `tvax1.sinaimg.cn`
- `tvax2.sinaimg.cn`
- `tvax3.sinaimg.cn`
- `tvax4.sinaimg.cn`

所有这些域名都会被 `proxyImageUrl` 函数识别并反代（因为包含 `sinaimg.cn`）。

## 注意事项

1. **图片格式**：微博图片通常是 `.jpg` 格式
2. **尺寸选择**：根据需求选择合适的尺寸，`mw2000` 是较好的平衡点
3. **pic_infos 优先**：如果 API 返回了 `pic_infos`，优先使用其中的 URL
4. **反代必须**：所有微博图片都需要反代才能正常显示（防盗链）

## 测试方法

### 1. 检查拼接的 URL
在浏览器开发者工具中查看图片请求：
```
https://your-worker.com/image?url=https%3A%2F%2Fwx1.sinaimg.cn%2Fmw2000%2F006BCCEUgy1i960jftnwyj33b04eo4qt.jpg
```

### 2. 验证图片加载
- 打开详情弹窗
- 查看图片是否正常显示
- 检查网络请求是否通过 Worker 反代

### 3. 测试不同尺寸
可以修改代码测试不同尺寸：
```typescript
const imageUrl = `https://wx1.sinaimg.cn/large/${picId}.jpg` // 原图
const imageUrl = `https://wx1.sinaimg.cn/bmiddle/${picId}.jpg` // 中等
```

## 相关文件

- `src/components/WeiboDetailModal.vue` - 详情弹窗组件
- `src/utils/proxy.ts` - 反代工具函数
- `WEIBO-IMAGE-PROXY.md` - 图片反代总体说明

## 更新时间

2026-01-30
