import { describe, expect, it } from 'vitest'
import { proxyImageUrl } from '../src/utils/proxy'

describe('proxyImageUrl', () => {
  it('routes Weibo images through the image proxy', () => {
    const url = 'https://wx3.sinaimg.cn/orj360/006BCCEUgy1ifxua4v2a2j33b04eox6r.jpg'

    expect(proxyImageUrl(url)).toMatch(new RegExp(`/image\\?url=${encodeURIComponent(url)}$`))
    expect(proxyImageUrl(url)).not.toBe(url)
  })

  it('does not proxy unrelated or already proxied URLs', () => {
    expect(proxyImageUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg')
    expect(proxyImageUrl('/image?url=https%3A%2F%2Fwx3.sinaimg.cn%2Fphoto.jpg'))
      .toBe('/image?url=https%3A%2F%2Fwx3.sinaimg.cn%2Fphoto.jpg')
  })
})
