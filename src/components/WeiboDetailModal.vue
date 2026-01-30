<script setup lang="ts">
import { proxyImageUrl } from '~/utils/proxy'

interface WeiboUser {
  id: number
  screen_name: string
  profile_image_url: string
  profile_url: string
  description: string
  followers_count: string | number
  statuses_count: number
  verified: boolean
  verified_type: number
  gender: string
  mbtype: number
  avatar_hd: string
}

interface WeiboStatus {
  id: string
  mid: string
  created_at: string
  text: string
  source: string
  user: WeiboUser
  reposts_count: number
  comments_count: number
  attitudes_count: number
  pic_ids: string[]
  pic_infos?: Record<string, { large?: { url: string } }>
  region_name?: string
  isLongText: boolean
}

interface WeiboDetailData {
  render_data: Array<{
    status: WeiboStatus
  }>
  detail_id: string
}

interface Props {
  show: boolean
  detailData: WeiboDetailData | null
}

interface Emits {
  (e: 'close'): void
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const status = computed(() => props.detailData?.render_data?.[0]?.status)

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

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化数字
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? Number.parseInt(num) : num
  if (Number.isNaN(n))
    return '0'
  if (n >= 10000)
    return `${(n / 10000).toFixed(1)}万`
  return n.toString()
}

// 关闭弹窗
function closeModal() {
  emit('close')
  emit('update:show', false)
}

// 点击背景关闭
function handleBackdropClick() {
  closeModal()
}

// 阻止事件冒泡
function handleContentClick(e: Event) {
  e.stopPropagation()
}

// 获取图片URL
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

// 处理微博内容中的图片URL，将所有图片替换为代理URL
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
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop with Instagram-style glassmorphism -->
    <Transition enter-active-class="motion-safe:transition-opacity motion-safe:duration-200"
      leave-active-class="motion-safe:transition-opacity motion-safe:duration-150" enter-from-class="opacity-0"
      leave-to-class="opacity-0">
      <div v-if="show && status" fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-md flex items-center justify-center p-4
        @click="handleBackdropClick">
        <!-- Modal with Instagram-style slide up -->
        <Transition enter-active-class="motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out"
          leave-active-class="motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-in"
          enter-from-class="opacity-0 translate-y-8" leave-to-class="opacity-0 translate-y-8">
          <div v-if="show && status" bg-white dark:bg-black rounded-xl shadow-2xl max-w-xl w-full max-h-90vh m-4
            overflow-hidden flex flex-col role="dialog" aria-modal="true" aria-labelledby="weibo-detail-title"
            class="instagram-modal" @click="handleContentClick">
            <!-- Header - Instagram style minimal -->
            <div flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800>
              <h2 id="weibo-detail-title" text-base font-600 text-gray-900 dark:text-white>
                微博详情
              </h2>
              <button w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center
                cursor-pointer class="motion-safe:transition-colors motion-safe:duration-150" aria-label="关闭弹窗"
                @click="closeModal">
                <div i-carbon-close text-xl text-gray-900 dark:text-white />
              </button>
            </div>

            <!-- Content - Instagram feed style -->
            <div flex-1 overflow-y-auto>
              <!-- User Info - Instagram post header style -->
              <div flex items-center justify-between px-4 py-3>
                <div flex items-center gap-3>
                  <a :href="status.user.profile_url" target="_blank" rel="noopener noreferrer" w-10 h-10 rounded-full
                    overflow-hidden flex-shrink-0 class="motion-safe:transition-opacity motion-safe:duration-150 hover:opacity-80">
                    <img :src="proxyImageUrl(status.user.profile_image_url)" :alt="`${status.user.screen_name}的头像`"
                      w-full h-full object-cover loading="lazy">
                  </a>

                  <div flex-1 min-w-0>
                    <div flex items-center gap-1.5>
                      <a :href="status.user.profile_url" target="_blank" rel="noopener noreferrer" text-sm font-600
                        text-gray-900 dark:text-white hover:opacity-70
                        class="motion-safe:transition-opacity motion-safe:duration-150">
                        {{ status.user.screen_name }}
                      </a>
                      <div v-if="status.user.verified" i-carbon-checkmark-filled text-blue-500 text-xs title="已认证" />
                    </div>
                    <p v-if="status.region_name" text-xs text-gray-500 dark:text-gray-400>
                      {{ status.region_name }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Images - Instagram style full width -->
              <div v-if="status.pic_ids && status.pic_ids.length > 0" w-full bg-black>
                <div v-if="status.pic_ids.length === 1" w-full aspect-square>
                  <img :src="getImageUrl(status.pic_ids[0])" :alt="`微博图片`" w-full h-full object-contain loading="lazy">
                </div>
                <div v-else grid :class="{
                  'grid-cols-2': status.pic_ids.length === 2 || status.pic_ids.length === 4,
                  'grid-cols-3': status.pic_ids.length === 3 || status.pic_ids.length > 4,
                }">
                  <div v-for="picId in status.pic_ids" :key="picId" aspect-square bg-black>
                    <img :src="getImageUrl(picId)" :alt="`微博图片`" w-full h-full object-cover loading="lazy">
                  </div>
                </div>
              </div>

           

           
              <!-- Content - Instagram caption style -->
              <div px-4 pb-3>
                <div text-sm text-gray-900 dark:text-white leading-relaxed>
                  <a :href="status.user.profile_url" target="_blank" rel="noopener noreferrer" font-600
                    hover:opacity-70 class="motion-safe:transition-opacity motion-safe:duration-150">
                    {{ status.user.screen_name }}
                  </a>
                  <span ml-2 v-html="processedText" />
                </div>
              </div>

              <!-- Comments count - Instagram style -->
              <div px-4 pb-3>
                <button text-sm text-gray-500 dark:text-gray-400 hover:opacity-70 cursor-pointer
                  class="motion-safe:transition-opacity motion-safe:duration-150">
                  查看全部 {{ formatNumber(status.comments_count) }} 条评论
                </button>
              </div>

              <!-- Meta Info - Instagram style -->
              <div px-4 pb-4>
                <div text-xs text-gray-500 dark:text-gray-400 uppercase>
                  {{ formatTime(status.created_at) }}
                </div>
              </div>

              <!-- User Description - Expandable section -->
 
              <!-- Additional Stats - Minimal display -->
              <div border-t border-gray-200 dark:border-gray-800 px-4 py-3>
                <div grid grid-cols-3 gap-4 text-center>
                  <div>
                    <div text-lg font-600 text-gray-900 dark:text-white>
                      {{ formatNumber(status.reposts_count) }}
                    </div>
                    <div text-xs text-gray-500 dark:text-gray-400>
                      转发
                    </div>
                  </div>
                  <div>
                    <div text-lg font-600 text-gray-900 dark:text-white>
                      {{ formatNumber(status.comments_count) }}
                    </div>
                    <div text-xs text-gray-500 dark:text-gray-400>
                      评论
                    </div>
                  </div>
                  <div>
                    <div text-lg font-600 text-gray-900 dark:text-white>
                      {{ formatNumber(status.attitudes_count) }}
                    </div>
                    <div text-xs text-gray-500 dark:text-gray-400>
                      点赞
                    </div>
                  </div>
                </div>
              </div>

              <!-- Source Info -->
              <div v-if="status.source" border-t border-gray-200 dark:border-gray-800 px-4 py-3>
                <div text-xs text-gray-500 dark:text-gray-400>
                  来自 {{ status.source }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Instagram-style modal */
.instagram-modal {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Instagram-style scrollbar - minimal and subtle */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 处理微博内容中的表情图片 */
:deep(.url-icon img) {
  display: inline-block;
  vertical-align: middle;
  width: 1.2em;
  height: 1.2em;
}

/* Instagram-style links - blue accent */
:deep(a) {
  color: #0095f6;
  text-decoration: none;
  transition: opacity 0.15s;
}

:deep(a:hover) {
  opacity: 0.7;
}

.dark :deep(a) {
  color: #0095f6;
}

.dark :deep(a:hover) {
  opacity: 0.7;
}

/* Remove default button styles */
button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
}
</style>
