<script setup lang="ts">
import { proxyImageUrl } from '~/utils/proxy'

defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
const weiboStore = useWeiboStore()

// 如果有博主，自动跳转到第一个博主的页面
onMounted(() => {
  if (weiboStore.bloggerIds.length > 0 && !router.currentRoute.value.query.manage) {
    const firstBloggerId = weiboStore.bloggerIds[0]
    router.replace(`/weibo/${firstBloggerId}`)
  }
})

const newBloggerId = ref('')
const errorMessage = ref('')
const isAdding = ref(false)
const showDeleteModal = ref(false)
const bloggerToDelete = ref<number | null>(null)

async function addBlogger() {
  const id = Number.parseInt(newBloggerId.value.trim())

  if (!id || Number.isNaN(id)) {
    errorMessage.value = '请输入有效的博主ID'
    return
  }

  if (weiboStore.bloggerIds.includes(id)) {
    errorMessage.value = '该博主已存在'
    return
  }

  isAdding.value = true
  weiboStore.addBlogger(id)

  await new Promise(resolve => setTimeout(resolve, 300))

  newBloggerId.value = ''
  errorMessage.value = ''
  isAdding.value = false

  router.push(`/weibo/${id}`)
}

function confirmRemoveBlogger(id: number) {
  bloggerToDelete.value = id
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  bloggerToDelete.value = null
}

function removeBlogger() {
  if (bloggerToDelete.value === null)
    return

  weiboStore.removeBlogger(bloggerToDelete.value)
  showDeleteModal.value = false

  // 如果删除后没有博主了，留在当前页面
  if (weiboStore.bloggerIds.length === 0) {
    bloggerToDelete.value = null
    return
  }
  // 如果还有博主，跳转到第一个
  router.push(`/weibo/${weiboStore.bloggerIds[0]}`)
  bloggerToDelete.value = null
}

function viewBlogger(id: number) {
  router.push(`/weibo/${id}`)
}

useHead({
  title: '微博博主管理',
})
</script>

<template>
  <div min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4>
    <div max-w-4xl mx-auto>
      <!-- Header -->
      <div text-center mb-12>
 
      </div>

      <!-- Add Blogger Card -->
      <div bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-800 class="motion-safe:transition-all motion-safe:duration-300">
        <h2 text-2xl font-700 mb-6 flex items-center gap-3 style="font-family: var(--font-heading)">
          <div i-carbon-add-alt text-rose-600 text-2xl />
          {{ weiboStore.bloggerIds.length === 0 ? '添加第一个博主' : '添加新博主' }}
        </h2>

        <div flex flex-col gap-4>
          <input
            v-model="newBloggerId"
            type="text"
            placeholder="请输入博主ID（例如：6052726496）"
            aria-label="博主ID输入框"
            bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700
            rounded-xl px-5 py-4 text-base
            focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-4 focus:ring-rose-200 dark:focus:ring-rose-900
            class="motion-safe:transition-all motion-safe:duration-200"
            style="font-family: var(--font-body)"
            @keydown.enter="addBlogger"
          >
          <button
            bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 py-4 rounded-xl font-600
            hover:shadow-lg hover:shadow-rose-500 
            class="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:scale-105"
            flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
            style="font-family: var(--font-body)"
            :disabled="isAdding"
            :aria-label="isAdding ? '正在添加博主' : '添加博主'"
            @click="addBlogger"
          >
            <div v-if="isAdding" i-carbon-circle-dash animate-spin text-lg />
            <div v-else i-carbon-add text-lg />
            {{ isAdding ? '添加中...' : '添加博主' }}
          </button>
        </div>

        <div
          v-if="errorMessage"
          text-red-500 text-sm mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900
          role="alert"
          aria-live="polite"
        >
          <div i-carbon-warning flex-shrink-0 />
          <span style="font-family: var(--font-body)">{{ errorMessage }}</span>
        </div>

        <div mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-900>
          <div i-carbon-information text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 text-lg />
          <p text-sm text-blue-800 dark:text-blue-300 style="font-family: var(--font-body)">
            提示：可以从微博用户主页URL中获取博主ID，例如 weibo.com/u/<strong>6052726496</strong>
          </p>
        </div>
      </div>

      <!-- Bloggers List -->
      <div v-if="weiboStore.bloggerIds.length > 0" bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800>
        <div flex items-center justify-between mb-8>
          <h2 text-2xl font-700 flex items-center gap-3 style="font-family: var(--font-heading)">
            <div i-carbon-user-avatar text-rose-600 text-2xl />
            我的博主
          </h2>
          <span
            bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 px-4 py-2 rounded-full text-sm font-600 border border-rose-200 dark:border-rose-900
            style="font-family: var(--font-body)"
          >
            {{ weiboStore.bloggerIds.length }} 位
          </span>
        </div>

        <!-- Blogger Cards -->
        <div grid grid-cols-1 md:grid-cols-2 gap-6>
          <div
            v-for="id in weiboStore.bloggerIds"
            :key="id"
            bg-white dark:bg-gray-800 rounded-2xl p-6
            border-2 cursor-pointer
            class="motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:shadow-xl motion-safe:hover:scale-[1.02]"
            :class="id === weiboStore.currentBloggerId
              ? 'border-rose-500 shadow-lg shadow-rose-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700'"
            role="article"
            :aria-label="`博主 ${weiboStore.getBloggerData(id)?.screen_name || id}`"
            @click="viewBlogger(id)"
          >
            <div flex items-center gap-5>
              <!-- Avatar -->
              <div
                w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-rose-400 to-pink-500 flex-shrink-0 shadow-lg ring-4 ring-white dark:ring-gray-800
                class="motion-safe:transition-transform motion-safe:duration-300"
              >
                <img
                  v-if="weiboStore.getBloggerData(id)?.profile_image_url"
                  :src="proxyImageUrl(weiboStore.getBloggerData(id)?.profile_image_url || '')"
                  :alt="`${weiboStore.getBloggerData(id)?.screen_name}的头像`"
                  w-full h-full object-cover
                  loading="lazy"
                >
                <div v-else i-carbon-user-avatar text-4xl text-white flex items-center justify-center w-full h-full />
              </div>

              <!-- Info -->
              <div flex-1 min-w-0>
                <h3 text-xl font-700 mb-1 truncate style="font-family: var(--font-heading)">
                  {{ weiboStore.getBloggerData(id)?.screen_name || `博主 ${id}` }}
                </h3>
                <p text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2 style="font-family: var(--font-body)">
                  <div i-carbon-identification aria-hidden="true" />
                  ID: {{ id }}
                </p>
                <div v-if="weiboStore.getBloggerData(id)" flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 style="font-family: var(--font-body)">
                  <span flex items-center gap-1.5>
                    <div i-carbon-user-follow text-rose-500 aria-hidden="true" />
                    {{ weiboStore.getBloggerData(id)?.followers_count }} 粉丝
                  </span>
                  <span flex items-center gap-1.5>
                    <div i-carbon-document text-blue-500 aria-hidden="true" />
                    {{ weiboStore.getBloggerData(id)?.statuses_count }} 微博
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div flex items-center gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-gray-700>
              <button
                bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex-1 font-600 flex items-center justify-center gap-2 cursor-pointer
                class="motion-safe:transition-all motion-safe:duration-200"
                style="font-family: var(--font-body)"
                aria-label="查看博主主页"
                @click.stop="viewBlogger(id)"
              >
                <div i-carbon-view text-lg aria-hidden="true" />
                查看主页
              </button>
              <button
                bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl cursor-pointer
                class="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:scale-110"
                aria-label="删除博主"
                @click.stop="confirmRemoveBlogger(id)"
              >
                <div i-carbon-trash-can text-lg />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-800
        flex flex-col items-center justify-center text-center
      >
        <div
          w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6
          class="motion-safe:animate-pulse"
        >
          <div i-carbon-user-multiple text-5xl text-gray-400 dark:text-gray-500 />
        </div>
        <h3 text-2xl font-700 mb-3 text-gray-700 dark:text-gray-300 style="font-family: var(--font-heading)">
          还没有添加博主
        </h3>
        <p text-base text-gray-500 dark:text-gray-400 style="font-family: var(--font-body)">
          在上方输入框中添加你的第一个博主吧
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="motion-safe:transition-opacity motion-safe:duration-200"
        leave-active-class="motion-safe:transition-opacity motion-safe:duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showDeleteModal"
          fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4
          @click="cancelDelete"
        >
          <Transition
            enter-active-class="motion-safe:transition-all motion-safe:duration-200"
            leave-active-class="motion-safe:transition-all motion-safe:duration-200"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showDeleteModal"
              bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200 dark:border-gray-800
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
              @click.stop
            >
              <div flex items-center gap-4 mb-6>
                <div w-12 h-12 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center flex-shrink-0>
                  <div i-carbon-warning text-2xl text-red-600 dark:text-red-400 />
                </div>
                <h3 id="delete-modal-title" text-2xl font-700 style="font-family: var(--font-heading)">
                  确认删除
                </h3>
              </div>

              <p text-base text-gray-600 dark:text-gray-400 mb-8 style="font-family: var(--font-body)">
                确定要删除博主
                <strong class="text-gray-900 dark:text-white">
                  {{ weiboStore.getBloggerData(bloggerToDelete!)?.screen_name || `ID: ${bloggerToDelete}` }}
                </strong>
                吗？此操作无法撤销。
              </p>

              <div flex items-center gap-3>
                <button
                  flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-600 cursor-pointer
                  class="motion-safe:transition-all motion-safe:duration-200"
                  style="font-family: var(--font-body)"
                  @click="cancelDelete"
                >
                  取消
                </button>
                <button
                  flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-600 cursor-pointer
                  class="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:scale-105"
                  style="font-family: var(--font-body)"
                  @click="removeBlogger"
                >
                  确认删除
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
