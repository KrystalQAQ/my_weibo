// 微博 API 反代和图片防盗链代理
// 用户信息 API: https://m.weibo.cn/api/container/getIndex?jumpfrom=weibocom&type=uid&value=6052726496&containerid=1005056052726496
// 博文信息 API: https://m.weibo.cn/api/container/getIndex?jumpfrom=weibocom&type=uid&value=6052726496&containerid=1076036052726496

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 添加 CORS 头
function addCorsHeaders(response) {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return headers
}

// 处理 OPTIONS 预检请求
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}

// 处理微博 API 反代
async function handleApiProxy(request, url) {
  try {
    // 构建微博 API URL
    const weiboApiUrl = `https://m.weibo.cn${url.pathname}${url.search}`

    // 发起请求到微博 API
    const response = await fetch(weiboApiUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://m.weibo.cn/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    })

    // 获取响应数据
    const data = await response.text()

    // 返回带 CORS 头的响应
    return new Response(data, {
      status: response.status,
      headers: addCorsHeaders(response)
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'API proxy failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// 处理图片防盗链代理
async function handleImageProxy(url) {
  const imageUrl = url.searchParams.get('url')

  if (!imageUrl) {
    return new Response(JSON.stringify({
      error: 'Missing image URL parameter'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    // 验证 URL 是否为微博图片域名
    const allowedDomains = [
      'sinaimg.cn',
      'sina.cn',
      'weibo.com',
      'weibocdn.com'
    ]

    const imageUrlObj = new URL(imageUrl)
    const isAllowed = allowedDomains.some(domain =>
      imageUrlObj.hostname.includes(domain)
    )

    if (!isAllowed) {
      return new Response(JSON.stringify({
        error: 'Invalid image domain'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 请求图片，添加 Referer 绕过防盗链
    const response = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://weibo.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch image',
        status: response.status
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 返回图片，添加缓存和 CORS 头
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'public, max-age=31536000') // 缓存一年
    headers.set('CDN-Cache-Control', 'public, max-age=31536000')

    return new Response(response.body, {
      status: 200,
      headers
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Image proxy failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// 主请求处理函数
async function handleRequest(request) {
  const url = new URL(request.url)

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  // 路由分发
  if (url.pathname.startsWith('/api/')) {
    // API 反代：/api/container/getIndex?...
    return handleApiProxy(request, url)
  } else if (url.pathname === '/image' || url.pathname === '/img') {
    // 图片代理：/image?url=https://...
    return handleImageProxy(url)
  } else if (url.pathname === '/' || url.pathname === '') {
    // 根路径返回使用说明
    return new Response(JSON.stringify({
      name: 'Weibo Proxy Service',
      version: '1.0.0',
      endpoints: {
        api: {
          path: '/api/*',
          description: 'Proxy for Weibo API',
          example: '/api/container/getIndex?type=uid&value=6052726496&containerid=1005056052726496'
        },
        image: {
          path: '/image?url=<image_url>',
          description: 'Proxy for Weibo images (bypass referer check)',
          example: '/image?url=https://wx1.sinaimg.cn/large/xxx.jpg'
        }
      }
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } else {
    // 404
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Invalid endpoint. Use /api/* for API proxy or /image?url=<url> for image proxy.'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}