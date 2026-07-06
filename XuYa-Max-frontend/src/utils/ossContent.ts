/**
 * 富文本 OSS 私有图片占位解析
 *
 * 后端富文本（公告、消息正文等）插入私有桶图片时，会以 `oss://{ossId}` 占位
 * 存储在内容中，渲染前需批量解析为带预签名的真实访问 URL。
 *
 * 与 plus-ui 的 resolveOssContent 行为一致；适配 XuYa-Max 前端：
 * `listByIds` 在 `request()` 拦截器里已解包，返回 `OssVO[]`。
 */
import { listByIds } from '@/api/system/oss'

const OSS_MARKER_RE = /oss:\/\/([\w-]+)/g

/**
 * 将 HTML 中的 `oss://{ossId}` 标记批量解析为真实 OSS 授权 URL。
 * 失败时返回原文，不影响主流程渲染。
 *
 * @example
 * const html = await resolveOssContent('<p><img src="oss://12345"/></p>')
 */
export async function resolveOssContent(html: string): Promise<string> {
  if (!html) return html

  const matches = [...html.matchAll(OSS_MARKER_RE)]
  if (matches.length === 0) return html

  const ossIds = [...new Set(matches.map((m) => m[1]))]

  try {
    const list = await listByIds(ossIds.join(','))
    const arr = Array.isArray(list) ? list : []
    let result = html
    for (const oss of arr) {
      result = result.replaceAll(`oss://${oss.ossId}`, oss.url)
    }
    return result
  } catch {
    return html
  }
}
