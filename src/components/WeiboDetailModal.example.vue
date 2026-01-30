<script setup lang="ts">
/**
 * 微博详情弹窗使用示例
 *
 * 这个文件展示了如何在你的页面中使用 WeiboDetailModal 组件
 */

// 1. 导入组件
import WeiboDetailModal from './WeiboDetailModal.vue'

// 2. 定义响应式状态
const showDetailModal = ref(false)
const currentDetailData = ref(null)

// 3. 模拟从 API 获取的详情数据
const mockDetailData = {
  render_data: [
    {
      hotScheme: 'https://m.weibo.cn/p/index?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&luicode=20000061&lfid=5260469138622617&launchid=10000360-page_H5',
      appScheme: 'https://m.weibo.cn?luicode=20000061&lfid=5260469138622617&launchid=10000360-page_H5',
      callUinversalLink: false,
      callWeibo: false,
      schemeOrigin: false,
      appLink: 'sinaweibo://detail?mblogid=5260469138622617&luicode=20000061&lfid=5260469138622617&launchid=10000360-page_H5',
      xianzhi_scheme: 'xianzhi://mblogshow?mid=5260469138622617',
      third_scheme: 'sinaweibo://detail?mblogid=5260469138622617&luicode=20000061&lfid=5260469138622617&launchid=10000360-page_H5',
      status: {
        visible: {
          type: 0,
          list_id: 0,
        },
        created_at: 'Thu Jan 29 16:57:20 +0800 2026',
        id: '5260469138622617',
        mid: '5260469138622617',
        can_edit: false,
        text: '啊啊啊啊啊啊啊啊啊<br />去你妈的 傻逼傻逼傻逼<span class="url-icon"><img alt="[抓狂]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/02/201810_zhuakuang_mobile.png" style="width:1em; height:1em;" /></span><span class="url-icon"><img alt="[抓狂]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/02/201810_zhuakuang_mobile.png" style="width:1em; height:1em;" /></span><span class="url-icon"><img alt="[抓狂]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/02/201810_zhuakuang_mobile.png" style="width:1em; height:1em;" /></span><br />自己又不会化妆 在哪儿指指点点 提些无理要求<br />有本事请个化妆师来啊 折磨我干嘛啊操 ',
        textLength: 137,
        source: 'iPhone 15',
        favorited: false,
        pic_ids: [],
        is_paid: false,
        mblog_vip_type: 0,
        user: {
          id: 6655031510,
          screen_name: '汐栎fr',
          profile_image_url: 'https://tvax3.sinaimg.cn/crop.0.0.512.512.180/007gnPHUly8hw7szbzmhej30e80e8dgb.jpg?KID=imgbed,tva&Expires=1769747508&ssig=pll0%2FGrVwW',
          profile_url: 'https://m.weibo.cn/u/6655031510?luicode=20000061&lfid=5260469138622617&launchid=10000360-page_H5',
          close_blue_v: false,
          description: '今天会有好运降临吗',
          follow_me: false,
          following: false,
          follow_count: 426,
          followers_count: '20',
          cover_image_phone: 'https://tva1.sinaimg.cn/crop.0.0.640.640.640/549d0121tw1egm1kjly3jj20hs0hsq4f.jpg',
          avatar_hd: 'https://wx3.sinaimg.cn/orj480/007gnPHUly8hw7szbzmhej30e80e8dgb.jpg',
          badge: {
            user_name_certificate: 1,
            hongbao_2020: 2,
            video_visible: 1,
            city_university: 11,
            status_visible_y: 2023,
          },
          statuses_count: 254,
          verified: false,
          verified_type: -1,
          gender: 'f',
          mbtype: 2,
          svip: 0,
          urank: 4,
          mbrank: 5,
          followers_count_str: '20',
          verified_reason: '',
          like: false,
          like_me: false,
          special_follow: false,
          user_token: 'a0.MTg1ZGEwZWU0OWVhNGQyY8jYIQdGrjPw3FzQOt5n6Dbz1OkwYae4gH65MR-iA5KZ',
        },
        reposts_count: 0,
        comments_count: 0,
        reprint_cmt_count: 0,
        attitudes_count: 0,
        mixed_count: 0,
        pending_approval_count: 0,
        isLongText: false,
        show_mlevel: 0,
        darwin_tags: [],
        ad_marked: false,
        mblogtype: 0,
        item_category: 'status',
        rid: '0_0_0_163497550851319586_0_0_0',
        number_display_strategy: {
          apply_scenario_flag: 19,
          display_text_min_number: 1000000,
          display_text: '100万+',
        },
        comment_guide_ext: 'guide_type:-1|source:1',
        content_auth: 0,
        is_show_mixed: false,
        safe_tags: 2251800082120704,
        comment_manage_info: {
          comment_permission_type: -1,
          approval_comment_type: 0,
          comment_sort_type: 0,
        },
        pic_num: 0,
        mlevel: 0,
        region_name: '发布于 浙江',
        region_opt: 1,
        detail_bottom_bar: 0,
        bid: 'Qpn4RAb8t',
        buttons: [
          {
            type: 'follow',
            name: '关注',
            sub_type: 0,
            params: {
              uid: 6655031510,
            },
          },
        ],
        status_title: '啊啊啊啊啊啊啊啊啊去你妈的...',
        ok: 1,
      },
      call: 1,
    },
  ],
  detail_id: '5260469138622617',
}

// 4. 打开详情弹窗的函数
function openDetailModal(weiboId: string) {
  // 在实际应用中，这里应该调用 API 获取详情数据
  // 例如: const data = await fetchWeiboDetail(weiboId)

  // 这里使用模拟数据
  currentDetailData.value = mockDetailData
  showDetailModal.value = true
}

// 5. 关闭弹窗的函数
function closeDetailModal() {
  showDetailModal.value = false
  // 可选：延迟清空数据，等待动画完成
  setTimeout(() => {
    currentDetailData.value = null
  }, 300)
}
</script>

<template>
  <div p-8>
    <h1 text-2xl font-700 mb-6>
      微博详情弹窗使用示例
    </h1>

    <!-- 示例按钮 -->
    <button
      bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-xl font-600
      hover:shadow-lg hover:shadow-rose-500
      class="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:scale-105"
      @click="openDetailModal('5260469138622617')"
    >
      查看微博详情
    </button>

    <!-- 使用详情弹窗组件 -->
    <WeiboDetailModal
      v-model:show="showDetailModal"
      :detail-data="currentDetailData"
      @close="closeDetailModal"
    />

    <!-- 使用说明 -->
    <div mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-900>
      <h2 text-lg font-700 mb-4 text-blue-900 dark:text-blue-100>
        使用说明
      </h2>
      <div text-sm text-blue-800 dark:text-blue-200 space-y-2 style="font-family: var(--font-body)">
        <p><strong>1. 导入组件：</strong></p>
        <pre bg-blue-100 dark:bg-blue-900 p-3 rounded overflow-x-auto><code>import WeiboDetailModal from '~/components/WeiboDetailModal.vue'</code></pre>

        <p><strong>2. 定义状态：</strong></p>
        <pre bg-blue-100 dark:bg-blue-900 p-3 rounded overflow-x-auto><code>const showDetailModal = ref(false)
const currentDetailData = ref(null)</code></pre>

        <p><strong>3. 在模板中使用：</strong></p>
        <pre bg-blue-100 dark:bg-blue-900 p-3 rounded overflow-x-auto><code>&lt;WeiboDetailModal
  v-model:show="showDetailModal"
  :detail-data="currentDetailData"
  @close="closeDetailModal"
/&gt;</code></pre>

        <p><strong>4. 打开弹窗：</strong></p>
        <pre bg-blue-100 dark:bg-blue-900 p-3 rounded overflow-x-auto><code>async function openDetailModal(weiboId: string) {
  // 调用 API 获取详情数据
  const data = await fetch(`/api/detail/${weiboId}`).then(r => r.json())
  currentDetailData.value = data
  showDetailModal.value = true
}</code></pre>

        <p><strong>5. API 接口：</strong></p>
        <p>接口地址：<code bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded>/detail/{weiboId}</code></p>
        <p>返回数据格式请参考组件中的 TypeScript 类型定义</p>
      </div>
    </div>
  </div>
</template>
