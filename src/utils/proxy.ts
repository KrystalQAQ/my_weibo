/**
 * 代理工具函数
 * 用于处理微博 API 和图片的代理请求
 */

// 获取 Worker URL（从环境变量）
const WORKER_URL = (import.meta.env.VITE_WORKER_URL || '').replace(/\/$/, '')

/**
 * 代理图片 URL，绕过防盗链
 * @param url 原始图片 URL
 * @returns 代理后的图片 URL
 */
export function proxyImageUrl(url: string): string {
  if (!url)
    return ''

  if (url.startsWith('/image?url=') || (WORKER_URL && url.startsWith(`${WORKER_URL}/image?url=`)))
    return url

  try {
    const hostname = new URL(url).hostname
    const isWeiboImage = [
      'sinaimg.cn',
      'sina.cn',
      'weibo.com',
      'weibocdn.com',
    ].some(domain => hostname === domain || hostname.endsWith(`.${domain}`))

    if (isWeiboImage)
      return `${WORKER_URL}/image?url=${encodeURIComponent(url)}`
  }
  catch {
    // Keep relative and malformed URLs unchanged.
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
 * 获取微博详情
 * @param weiboId 微博 ID
 * @returns 微博详情数据
 */
export async function fetchWeiboDetail(weiboId: string) {
  // 如果配置了 Worker，使用代理
  if (WORKER_URL) {
    const response = await fetch(
      `${WORKER_URL}/detail/${weiboId}`,
    )
    return await response.json()
  }

  // 否则直接请求微博 API（可能会有跨域问题）
  const response = await fetch(
    `/detail/${weiboId}`,
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
