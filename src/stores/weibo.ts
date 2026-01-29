import { acceptHMRUpdate, defineStore } from 'pinia'

export interface WeiboUser {
  id: number
  screen_name: string
  profile_image_url: string
  avatar_hd: string
  description: string
  follow_count: number
  followers_count: string
  statuses_count: number
  verified: boolean
  verified_type: number
  gender: string
  mbrank: number
  cover_image_phone?: string
}

export interface MblogPic {
  pid: string
  url: string
  size: string
  geo: {
    width: number
    height: number
    croped: boolean
  }
  large?: {
    size: string
    url: string
    geo: {
      width: number | string
      height: number | string
      croped: boolean
    }
  }
}

export interface Mblog {
  id: string
  mid: string
  created_at: string
  text: string
  source: string
  user: WeiboUser
  reposts_count: number
  comments_count: number
  attitudes_count: number
  pic_ids?: string[]
  pics?: MblogPic[]
  thumbnail_pic?: string
  original_pic?: string
  isLongText: boolean
  region_name?: string
  title?: {
    text: string
    base_color: number
  }
  bid: string
}

export interface WeiboCard {
  card_type: number
  mblog: Mblog
  itemid: string
  scheme: string
}

export interface WeiboHomeData {
  ok: number
  data: {
    cardlistInfo: {
      containerid: string
      total: number
      page: number
    }
    cards: WeiboCard[]
  }
}

export interface WeiboData {
  ok: number
  data: {
    userInfo: WeiboUser
    tabsInfo?: any
  }
}

export const useWeiboStore = defineStore('weibo', () => {
  // 存储的博主ID列表
  const bloggerIds = useLocalStorage<number[]>('weibo-blogger-ids', [])

  // 当前选中的博主ID
  const currentBloggerId = useLocalStorage<number | null>('weibo-current-blogger', null)

  // 博主数据缓存（持久化到本地存储）
  const bloggersDataStorage = useLocalStorage<Record<number, WeiboUser>>('weibo-bloggers-data', {})
  const bloggersData = computed(() => bloggersDataStorage.value)

  // 博主微博列表缓存（仅内存缓存，不持久化）
  const bloggersWeibos = ref<Map<number, WeiboCard[]>>(new Map())

  // 添加博主
  function addBlogger(id: number) {
    if (!bloggerIds.value.includes(id)) {
      bloggerIds.value.push(id)
      if (!currentBloggerId.value) {
        currentBloggerId.value = id
      }
    }
  }

  // 删除博主
  function removeBlogger(id: number) {
    const index = bloggerIds.value.indexOf(id)
    if (index > -1) {
      bloggerIds.value.splice(index, 1)
      // 从持久化存储中删除
      const newData = { ...bloggersDataStorage.value }
      delete newData[id]
      bloggersDataStorage.value = newData
      bloggersWeibos.value.delete(id)

      // 如果删除的是当前选中的博主，切换到第一个
      if (currentBloggerId.value === id) {
        currentBloggerId.value = bloggerIds.value[0] || null
      }
    }
  }

  // 切换当前博主
  function switchBlogger(id: number) {
    if (bloggerIds.value.includes(id)) {
      currentBloggerId.value = id
    }
  }

  // 保存博主数据到缓存（持久化）
  function saveBloggerData(id: number, data: WeiboUser) {
    bloggersDataStorage.value = {
      ...bloggersDataStorage.value,
      [id]: data,
    }
  }

  // 保存博主微博列表到缓存
  function saveBloggerWeibos(id: number, weibos: WeiboCard[]) {
    bloggersWeibos.value.set(id, weibos)
  }

  // 获取博主数据
  function getBloggerData(id: number) {
    return bloggersDataStorage.value[id]
  }

  // 获取博主微博列表
  function getBloggerWeibos(id: number) {
    return bloggersWeibos.value.get(id) || []
  }

  // 获取当前博主数据
  const currentBlogger = computed(() => {
    if (currentBloggerId.value) {
      return bloggersDataStorage.value[currentBloggerId.value]
    }
    return null
  })

  return {
    bloggerIds,
    currentBloggerId,
    bloggersData,
    bloggersWeibos,
    currentBlogger,
    addBlogger,
    removeBlogger,
    switchBlogger,
    saveBloggerData,
    saveBloggerWeibos,
    getBloggerData,
    getBloggerWeibos,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWeiboStore, import.meta.hot))
