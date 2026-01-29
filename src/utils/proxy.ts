/**
 * 代理工具函数
 * 用于处理微博 API 和图片的代理请求
 */

// 获取 Worker URL（从环境变量）
const WORKER_URL = import.meta.env.VITE_WORKER_URL || ''

/**
 * 代理图片 URL，绕过防盗链
 * @param url 原始图片 URL
 * @returns 代理后的图片 URL
 */
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

/**
 * 获取博主信息
 * @param bloggerId 博主 ID
 * @returns 博主信息数据
 */
export async function fetchBloggerInfo(bloggerId: number) {
  const containerId = `100505${bloggerId}`
  console.log(WORKER_URL,'WORKER_URL')
  // 如果配置了 Worker，使用代理
  if (WORKER_URL) {
    const response = await fetch(
      `${WORKER_URL}/api/container/getIndex?type=uid&value=${bloggerId}&containerid=${containerId}`,
    )
    return await response.json()
  }

  // 否则直接请求微博 API（可能会有跨域问题）
  const response = await fetch(
    `/api/container/getIndex?type=uid&value=${bloggerId}&containerid=${containerId}`,
  )
  return await response.json()
}

/**
 * 获取博主微博列表
 * @param bloggerId 博主 ID
 * @param page 页码（可选）
 * @returns 微博列表数据
 */
export async function fetchBloggerWeibos(bloggerId: number, page = 1) {
  const containerId = `107603${bloggerId}`
  const params = new URLSearchParams({
    type: 'uid',
    value: String(bloggerId),
    containerid: containerId,
  })

  if (page > 1) {
    params.append('page', String(page))
  }

  // 如果配置了 Worker，使用代理
  if (WORKER_URL) {
    const response = await fetch(
      `${WORKER_URL}/api/container/getIndex?${params.toString()}`,
    )
    return await response.json()
  }

  // 否则直接请求微博 API（可能会有跨域问题）
  const response = await fetch(
    `/api/container/getIndex?${params.toString()}`,
  )
  return await response.json()
}

/**
 * 检查是否配置了代理
 * @returns 是否配置了 Worker URL
 */
export function hasProxy(): boolean {
  return !!WORKER_URL
}

/**
 * 获取 Worker URL
 * @returns Worker URL
 */
export function getWorkerUrl(): string {
  return WORKER_URL
}
