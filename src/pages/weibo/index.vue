<script setup lang="ts">
defineOptions({
  name: 'WeiboBloggers',
})

const weiboStore = useWeiboStore()
const router = useRouter()

const newBloggerId = ref('')
const errorMessage = ref('')
const isAdding = ref(false)

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

function removeBlogger(id: number) {
  if (confirm('确定要删除这个博主吗？')) {
    weiboStore.removeBlogger(id)
  }
}

function viewBlogger(id: number) {
  router.push(`/weibo/${id}`)
}

useHead({
  title: '微博博主管理',
})
</script>

<template>
  <div min-h-screen bg-white dark:bg-gray-950 py-8 px-4>
    <div max-w-5xl mx-auto>
      <!-- Header -->
      <div mb-12>
        <router-link to="/" inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-rose-600
          dark:hover:text-rose-400 transition-colors duration-200 mb-6>
          <div i-carbon-arrow-left text-lg />
          <span font-500>返回首页</span>
        </router-link>
        <h1 text-5xl font-700 mb-3 flex items-center gap-4 style="font-family: var(--font-heading)">
          <div i-carbon-user-multiple text-rose-600 />
          博主管理
        </h1>
        <p text-lg text-gray-600 dark:text-gray-400 style="font-family: var(--font-body)">
          添加和管理你关注的微博博主
        </p>
      </div>

      <!-- Add Blogger Card -->
      <div bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 mb-12 border border-gray-100 dark:border-gray-800
        transition-all duration-300 hover:shadow-xl>
        <h2 text-2xl font-700 mb-6 flex items-center gap-3 style="font-family: var(--font-heading)">
          <div i-carbon-add-alt text-rose-600 text-2xl />
          添加新博主
        </h2>

        <div flex flex-col sm:flex-row gap-4>
          <input v-model="newBloggerId" type="text" placeholder="请输入博主ID" bg-gray-50 dark:bg-gray-800 border-2
            border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 flex-1 text-base focus:outline-none
            focus:border-rose-500 dark:focus:border-rose-400 transition-all duration-200
            style="font-family: var(--font-body)" @keydown.enter="addBlogger">
          <button bg-blue-600 text-white px-8 py-4 rounded-xl font-600 hover:bg-blue-700 hover:shadow-lg transition-all
            duration-200 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
            style="font-family: var(--font-body); cursor: pointer" :disabled="isAdding" @click="addBlogger">
            <div v-if="isAdding" i-carbon-circle-dash animate-spin text-lg />
            <div v-else i-carbon-add text-lg />
            {{ isAdding ? '添加中...' : '添加' }}
          </button>
        </div>

        <p v-if="errorMessage" text-red-500 text-sm mt-4 flex items-center gap-2>
          <div i-carbon-warning />
          {{ errorMessage }}
        </p>


      </div>

      <!-- Bloggers List -->
      <div bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-800>
        <div flex items-center justify-between mb-8>
          <h2 text-2xl font-700 flex items-center gap-3 style="font-family: var(--font-heading)">
            <div i-carbon-user-avatar text-rose-600 text-2xl />
            我的博主
          </h2>
          <span bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 px-4 py-2 rounded-full text-sm font-600
            border border-rose-200 dark:border-rose-900>
            {{ weiboStore.bloggerIds.length }} 位
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="weiboStore.bloggerIds.length === 0" text-center py-20>
          <div i-carbon-user-avatar-filled text-9xl text-gray-200 dark:text-gray-800 mb-6 />
          <p text-2xl font-600 text-gray-600 dark:text-gray-400 mb-3 style="font-family: var(--font-heading)">
            还没有添加任何博主
          </p>
          <p text-base text-gray-500 dark:text-gray-500 style="font-family: var(--font-body)">
            在上方输入框中添加你喜欢的博主ID
          </p>
        </div>

        <!-- Blogger Cards -->
        <div v-else grid grid-cols-1 md:grid-cols-2 gap-6>
          <div v-for="id in weiboStore.bloggerIds" :key="id" bg-white dark:bg-gray-800 rounded-2xl p-6 border-2
            transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-102 :class="id === weiboStore.currentBloggerId
              ? 'border-rose-500 shadow-lg shadow-rose-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700'"
            style="cursor: pointer" @click="viewBlogger(id)">
            <div flex items-center gap-5>
              <!-- Avatar -->
              <div w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-rose-400 to-pink-500 flex-shrink-0
                shadow-lg ring-4 ring-white dark:ring-gray-800>
                <img v-if="weiboStore.getBloggerData(id)?.profile_image_url"
                  :src="weiboStore.getBloggerData(id)?.profile_image_url"
                  :alt="weiboStore.getBloggerData(id)?.screen_name" w-full h-full object-cover>
                <div v-else i-carbon-user-avatar text-4xl text-white flex items-center justify-center w-full h-full />
              </div>

              <!-- Info -->
              <div flex-1 min-w-0>
                <h3 text-xl font-700 mb-1 truncate style="font-family: var(--font-heading)">
                  {{ weiboStore.getBloggerData(id)?.screen_name || `博主 ${id}` }}
                </h3>
                <p text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2>
                  <div i-carbon-identification />
                  ID: {{ id }}
                </p>
                <div v-if="weiboStore.getBloggerData(id)" flex items-center gap-4 text-xs text-gray-600
                  dark:text-gray-400>
                  <span flex items-center gap-1.5>
                    <div i-carbon-user-follow text-rose-500 />
                    {{ weiboStore.getBloggerData(id)?.followers_count }} 粉丝
                  </span>
                  <span flex items-center gap-1.5>
                    <div i-carbon-document text-blue-500 />
                    {{ weiboStore.getBloggerData(id)?.statuses_count }} 微博
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div flex items-center gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-gray-700>
              <button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all duration-200 flex-1
                font-600 flex items-center justify-center gap-2 title="查看主页" style="cursor: pointer"
                @click.stop="viewBlogger(id)">
                <div i-carbon-view text-lg />
                查看主页
              </button>
              <button bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl transition-all duration-200 title="删除博主"
                style="cursor: pointer" @click.stop="removeBlogger(id)">
                <div i-carbon-trash-can text-lg />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
