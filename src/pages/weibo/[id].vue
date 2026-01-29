<script setup lang="ts">
import type { Mblog, WeiboCard, WeiboData, WeiboHomeData } from '~/stores/weibo'
import { fetchBloggerInfo, fetchBloggerWeibos, proxyImageUrl } from '~/utils/proxy'

defineOptions({
  name: 'WeiboBloggerProfile',
})

const route = useRoute()
const router = useRouter()
const weiboStore = useWeiboStore()

const bloggerId = computed(() => Number.parseInt(route.params.id as string))
const loading = ref(false)
const loadingWeibos = ref(false)
const loadingMore = ref(false)
const error = ref('')
const bloggerData = ref<WeiboData | null>(null)
const weiboCards = ref<WeiboCard[]>([])
const selectedImage = ref<string | null>(null)
const currentPage = ref(1)
const hasMore = ref(true)

// 格式化时间
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1)
    return '刚刚'
  if (minutes < 60)
    return `${minutes}分钟前`
  if (hours < 24)
    return `${hours}小时前`
  if (days < 7)
    return `${days}天前`

  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

// 格式化数字
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? Number.parseInt(num) : num
  if (n >= 10000)
    return `${(n / 10000).toFixed(1)}万`

  return n.toString()
}

// 清理HTML标签
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
}

// 获取博主信息
async function fetchBloggerData() {
  // 先检查本地缓存
  const cachedData = weiboStore.getBloggerData(bloggerId.value)
  if (cachedData) {
    // 使用缓存数据
    bloggerData.value = {
      ok: 1,
      data: {
        userInfo: cachedData,
      },
    }
    weiboStore.switchBlogger(bloggerId.value)
    // 后台静默更新数据
    fetchBloggerDataFromAPI()
    return
  }

  // 没有缓存，显示加载状态
  loading.value = true
  error.value = ''
  await fetchBloggerDataFromAPI()
  loading.value = false
}

// 从 API 获取博主信息
async function fetchBloggerDataFromAPI() {
  try {
    // 从 API 获取数据
    const data = await fetchBloggerInfo(bloggerId.value)

    if (data.ok === 1 && data.data?.userInfo) {
      bloggerData.value = data
      weiboStore.saveBloggerData(bloggerId.value, data.data.userInfo)
      weiboStore.switchBlogger(bloggerId.value)
    }
    else {
      // API 返回失败
      error.value = 'API 返回失败，请稍后重试'
      console.error('API 返回失败:', data)
    }
  }
  catch (err) {
    console.error('获取博主信息失败:', err)
    error.value = '获取博主信息失败，请检查网络连接'
  }
}

// 获取微博列表
async function fetchWeiboList(append = false) {
  if (append) {
    loadingMore.value = true
  }
  else {
    loadingWeibos.value = true
    currentPage.value = 1
    hasMore.value = true
  }

  try {
    // 从 API 获取数据
    const data: WeiboHomeData = await fetchBloggerWeibos(bloggerId.value, currentPage.value)

    console.log(`加载第 ${currentPage.value} 页，返回数据:`, data)

    if (data.ok === 1 && data.data?.cards) {
      // 过滤出包含 mblog 的卡片
      const validCards = data.data.cards.filter(card => card.mblog)

      console.log(`第 ${currentPage.value} 页有效卡片数:`, validCards.length)

      if (append) {
        // 追加模式：添加到现有列表
        weiboCards.value = [...weiboCards.value, ...validCards]
      }
      else {
        // 初始加载：替换列表
        weiboCards.value = validCards
        weiboStore.saveBloggerWeibos(bloggerId.value, validCards)
      }

      // 检查是否还有更多数据
      // 只有当返回的卡片数量为 0 时才认为没有更多数据
      if (validCards.length === 0) {
        hasMore.value = false
        console.log('没有更多数据了')
      }
    }
    else {
      // API 返回失败
      console.error('微博列表 API 返回失败:', data)
      hasMore.value = false
    }
  }
  catch (err) {
    console.error('加载微博列表失败:', err)
    hasMore.value = false
  }
  finally {
    loadingWeibos.value = false
    loadingMore.value = false
  }
}

// 加载更多微博
async function loadMoreWeibos() {
  if (loadingMore.value || !hasMore.value)
    return

  currentPage.value += 1
  await fetchWeiboList(true)
}

// 切换到其他博主
function switchToBlogger(id: number) {
  router.push(`/weibo/${id}`)
}

// 返回列表
function goBack() {
  router.push('/?manage=true')
}

// 打开图片查看器
function openImage(url: string) {
  selectedImage.value = url
}

// 关闭图片查看器
function closeImage() {
  selectedImage.value = null
}

// 瀑布流列数
const columnCount = ref(3)
const masonryColumns = computed(() => {
  const columns: WeiboCard[][] = Array.from({ length: columnCount.value }, () => [])
  const columnHeights: number[] = Array.from({ length: columnCount.value }, () => 0)

  weiboCards.value.forEach((card) => {
    // 找到高度最小的列
    const minHeight = Math.min(...columnHeights)
    const minIndex = columnHeights.indexOf(minHeight)

    // 将卡片添加到最短的列
    columns[minIndex].push(card)

    // 估算卡片高度（图片 + 内容）
    const imageHeight = card.mblog.pics && card.mblog.pics.length > 0 ? 300 : 0
    const textHeight = card.mblog.text ? 150 : 100
    columnHeights[minIndex] += imageHeight + textHeight
  })

  return columns
})

// 响应式更新列数
function updateColumnCount() {
  const width = window.innerWidth
  if (width < 768) {
    columnCount.value = 1
  }
  else if (width < 1024) {
    columnCount.value = 2
  }
  else {
    columnCount.value = 3
  }
}

// 无限滚动加载
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupInfiniteScroll() {
  // 清理旧的 observer
  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (!loadMoreTrigger.value)
    return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
        console.log('触发加载更多，当前页:', currentPage.value)
        loadMoreWeibos()
      }
    },
    {
      rootMargin: '200px', // 提前200px开始加载
      threshold: 0.1,
    },
  )

  observer.observe(loadMoreTrigger.value)
}

// 清理函数
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// 页面加载时获取数据
onMounted(async () => {
  // 初始化列数
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)

  await fetchBloggerData()
  await fetchWeiboList()
  // 等待 DOM 更新后设置无限滚动
  nextTick(() => {
    setupInfiniteScroll()
  })
})

// 监听路由变化
watch(() => route.params.id, async () => {
  if (route.params.id) {
    currentPage.value = 1
    hasMore.value = true
    weiboCards.value = []
    await fetchBloggerData()
    await fetchWeiboList()
    // 等待 DOM 更新后重新设置无限滚动
    nextTick(() => {
      setupInfiniteScroll()
    })
  }
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
})

useHead({
  title: computed(() => bloggerData.value?.data.userInfo.screen_name || '博主主页'),
})
</script>

<template>
  <div min-h-screen bg-white dark:bg-gray-950>
    <!-- Top Navigation -->
    <div sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg bg-opacity-95>
      <div max-w-6xl mx-auto px-4 py-3>
        <!-- Blogger Switcher - Always visible -->
        <div flex items-center justify-center gap-4 mb-3>
          <button
            v-for="id in weiboStore.bloggerIds"
            :key="id"
            relative flex flex-col items-center gap-2 transition-all flex-shrink-0
            style="cursor: pointer"
            @click="switchToBlogger(id)"
          >
            <div
              w-14 h-14 rounded-full overflow-hidden border-3 transition-all
              :class="id === bloggerId
                ? 'border-rose-500 ring-4 ring-rose-200 dark:ring-rose-900 scale-110 shadow-lg'
                : 'border-gray-300 dark:border-gray-700 hover:border-rose-400 hover:scale-105'"
            >
              <img
                v-if="weiboStore.getBloggerData(id)?.profile_image_url"
                :src="proxyImageUrl(weiboStore.getBloggerData(id)?.profile_image_url || '')"
                :alt="weiboStore.getBloggerData(id)?.screen_name"
                w-full h-full object-cover
              >
              <div v-else i-carbon-user-avatar w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 />
            </div>
            <span
              v-if="id === bloggerId"
              text-xs font-600 text-rose-600 dark:text-rose-400 truncate max-w-20
            >
              {{ weiboStore.getBloggerData(id)?.screen_name || `博主${id}` }}
            </span>
          </button>
        </div>

        <!-- Action Buttons -->
        <div flex items-center justify-between>
          <button
            flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-200 font-600
            style="cursor: pointer"
            @click="goBack"
          >
            <div i-carbon-settings text-xl />
            <span>管理</span>
          </button>

          <button
            flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-600
            style="cursor: pointer"
            @click="fetchBloggerData(); fetchWeiboList()"
          >
            <div i-carbon-renew text-xl />
            <span>刷新</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" flex flex-col items-center justify-center py-24>
      <div w-16 h-16 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mb-6 />
      <p text-lg text-gray-600 dark:text-gray-400 style="font-family: var(--font-body)">
        加载中...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" flex flex-col items-center justify-center py-24>
      <div i-carbon-warning text-7xl text-red-500 mb-6 />
      <p text-2xl text-gray-600 dark:text-gray-400 mb-6 style="font-family: var(--font-heading)">
        {{ error }}
      </p>
      <button
        bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-600
        style="cursor: pointer"
        @click="fetchBloggerData"
      >
        重试
      </button>
    </div>

    <!-- Profile Content -->
    <div v-else-if="bloggerData" max-w-6xl mx-auto>
      <!-- Profile Header -->
      <div px-4 py-8>
        <div flex flex-col md:flex-row items-center md:items-start gap-8>
          <!-- Avatar -->
          <div relative flex-shrink-0>
            <div w-36 h-36 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl bg-gradient-to-br from-rose-400 to-pink-500>
              <img
                :src="proxyImageUrl(bloggerData.data.userInfo.avatar_hd)"
                :alt="bloggerData.data.userInfo.screen_name"
                w-full h-full object-cover
              >
            </div>
            <div
              v-if="bloggerData.data.userInfo.verified"
              absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-lg
            >
              <div i-carbon-checkmark-filled text-white text-xl />
            </div>
          </div>

          <!-- User Info -->
          <div flex-1>
            <div flex flex-col md:flex-row items-center md:items-start gap-4 mb-4>
              <h1 text-4xl font-800 style="font-family: var(--font-heading)">
                {{ bloggerData.data.userInfo.screen_name }}
              </h1>
              <!-- <span
                v-if="bloggerData.data.userInfo.mbrank > 0"
                inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-700 shadow-lg
              >
                <div i-carbon-star-filled />
                会员{{ bloggerData.data.userInfo.mbrank }}
              </span> -->
            </div>

            <p v-if="bloggerData.data.userInfo.description" text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl style="font-family: var(--font-body)">
              {{ bloggerData.data.userInfo.description }}
            </p>

            <!-- Stats -->
            <div flex items-center gap-8 mb-6>
              <div text-center>
                <div text-3xl font-800 text-gray-900 dark:text-white style="font-family: var(--font-heading)">
                  {{ formatNumber(bloggerData.data.userInfo.statuses_count) }}
                </div>
                <div text-sm text-gray-500 dark:text-gray-400 font-500>
                  微博
                </div>
              </div>
              <div text-center>
                <div text-3xl font-800 text-gray-900 dark:text-white style="font-family: var(--font-heading)">
                  {{ formatNumber(bloggerData.data.userInfo.followers_count) }}
                </div>
                <div text-sm text-gray-500 dark:text-gray-400 font-500>
                  粉丝
                </div>
              </div>
              <div text-center>
                <div text-3xl font-800 text-gray-900 dark:text-white style="font-family: var(--font-heading)">
                  {{ formatNumber(bloggerData.data.userInfo.follow_count) }}
                </div>
                <div text-sm text-gray-500 dark:text-gray-400 font-500>
                  关注
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div border-t border-gray-200 dark:border-gray-800 />

      <!-- Weibo Grid -->
      <div px-4 py-8>
        <!-- Loading Weibos -->
        <div v-if="loadingWeibos" flex justify-center py-16>
          <div w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin />
        </div>

        <!-- Weibo Cards -->
        <div v-else>
          <!-- Empty State -->
          <div v-if="weiboCards.length === 0" text-center py-20>
            <div i-carbon-document-blank text-8xl text-gray-200 dark:text-gray-800 mb-6 />
            <p text-xl text-gray-500 dark:text-gray-400 style="font-family: var(--font-body)">
              暂无微博
            </p>
          </div>

          <!-- Grid Layout -->
          <div v-else>
            <div flex gap-6>
              <!-- 每一列 -->
              <div
                v-for="(column, columnIndex) in masonryColumns"
                :key="columnIndex"
                flex-1 flex flex-col gap-6
              >
                <!-- 列中的卡片 -->
                <div
                  v-for="card in column"
                  :key="card.mblog.id"
                  bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:scale-102
                >
                <!-- Images -->
                <div v-if="card.mblog.pics && card.mblog.pics.length > 0" relative>
                  <!-- Single Image: Full width -->
                  <div
                    v-if="card.mblog.pics.length === 1"
                    aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer
                    style="cursor: pointer"
                    @click="openImage(proxyImageUrl(card.mblog.pics[0].large?.url || card.mblog.pics[0].url))"
                  >
                    <img
                      :src="proxyImageUrl(card.mblog.pics[0].url)"
                      :alt="card.mblog.pics[0].pid"
                      w-full h-full object-cover hover:scale-105 transition-transform duration-300
                    >
                  </div>
                  <!-- Two Images: 2 columns, equal size -->
                  <div
                    v-else-if="card.mblog.pics.length === 2"
                    grid grid-cols-2 gap-1
                  >
                    <div
                      v-for="pic in card.mblog.pics"
                      :key="pic.pid"
                      aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer
                      style="cursor: pointer"
                      @click="openImage(proxyImageUrl(pic.large?.url || pic.url))"
                    >
                      <img
                        :src="proxyImageUrl(pic.url)"
                        :alt="pic.pid"
                        w-full h-full object-cover hover:scale-105 transition-transform duration-300
                      >
                    </div>
                  </div>
                  <!-- Three Images: 3 columns, equal size -->
                  <div
                    v-else-if="card.mblog.pics.length === 3"
                    grid grid-cols-3 gap-1
                  >
                    <div
                      v-for="pic in card.mblog.pics"
                      :key="pic.pid"
                      aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer
                      style="cursor: pointer"
                      @click="openImage(proxyImageUrl(pic.large?.url || pic.url))"
                    >
                      <img
                        :src="proxyImageUrl(pic.url)"
                        :alt="pic.pid"
                        w-full h-full object-cover hover:scale-105 transition-transform duration-300
                      >
                    </div>
                  </div>
                  <!-- Four or More Images: Standard grid -->
                  <div
                    v-else
                    grid gap-1
                    :class="{
                      'grid-cols-2': card.mblog.pics.length === 4,
                      'grid-cols-3': card.mblog.pics.length >= 5,
                    }"
                  >
                    <div
                      v-for="pic in card.mblog.pics.slice(0, 9)"
                      :key="pic.pid"
                      aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer
                      style="cursor: pointer"
                      @click="openImage(proxyImageUrl(pic.large?.url || pic.url))"
                    >
                      <img
                        :src="proxyImageUrl(pic.url)"
                        :alt="pic.pid"
                        w-full h-full object-cover hover:scale-105 transition-transform duration-300
                      >
                    </div>
                  </div>
                </div>

                <!-- Content -->
                <div p-5>
                  <!-- Text -->
                  <div
                    class="weibo-text"
                    text-left leading-relaxed mb-4 text-gray-800 dark:text-gray-200 style="font-family: var(--font-body)"
                    :class="{
                      'text-base': !card.mblog.pics || card.mblog.pics.length === 0,
                      'text-sm': card.mblog.pics && card.mblog.pics.length > 0
                    }"
                    v-html="card.mblog.text"
                  />

                  <!-- Meta -->
                  <div flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4>
                    <span>{{ formatTime(card.mblog.created_at) }}</span>
                    <span v-if="card.mblog.region_name">{{ card.mblog.region_name }}</span>
                  </div>

                  <!-- Actions -->
                  <div flex items-center gap-6 text-gray-600 dark:text-gray-400>
                    <button flex items-center gap-1.5 hover:text-rose-500 transition-colors duration-200 style="cursor: pointer">
                      <div i-carbon-favorite text-lg />
                      <span text-sm>{{ card.mblog.attitudes_count || 0 }}</span>
                    </button>
                    <button flex items-center gap-1.5 hover:text-blue-500 transition-colors duration-200 style="cursor: pointer">
                      <div i-carbon-chat text-lg />
                      <span text-sm>{{ card.mblog.comments_count || 0 }}</span>
                    </button>
                    <button flex items-center gap-1.5 hover:text-green-500 transition-colors duration-200 style="cursor: pointer">
                      <div i-carbon-share text-lg />
                      <span text-sm>{{ card.mblog.reposts_count || 0 }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <!-- Infinite Scroll Trigger - 放在瀑布流容器外部 -->
            <div v-if="hasMore" ref="loadMoreTrigger" flex justify-center py-8>
              <div flex items-center gap-2 text-gray-500 dark:text-gray-400>
                <div i-carbon-circle-dash animate-spin text-lg />
                <span text-sm style="font-family: var(--font-body)">加载中...</span>
              </div>
            </div>

            <!-- No More Data -->
            <div v-else-if="weiboCards.length > 0" text-center py-8>
              <p text-sm text-gray-500 dark:text-gray-400 style="font-family: var(--font-body)">
                没有更多微博了
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Viewer Modal -->
    <div
      v-if="selectedImage"
      fixed inset-0 z-100 bg-black bg-opacity-90 flex items-center justify-center p-4
      style="cursor: pointer"
      @click="closeImage"
    >
      <button
        absolute top-4 right-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200
        style="cursor: pointer"
        @click.stop="closeImage"
      >
        <div i-carbon-close text-2xl />
      </button>
      <img
        :src="selectedImage"
        alt="Full size image"
        max-w-full max-h-full object-contain rounded-lg shadow-2xl
        @click.stop
      >
    </div>
  </div>
</template>

<style scoped>
/* 强制微博文字左对齐，覆盖 API 返回的居中样式 */
:deep(.weibo-text *) {
  text-align: left !important;
}

/* 防止链接和图标换行 */
:deep(.weibo-text a) {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

:deep(.weibo-text .url-icon) {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
