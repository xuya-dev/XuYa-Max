/**
 * 文件保存工具（基于 file-saver）
 */
import { saveAs } from 'file-saver'

/**
 * 保存 Blob 为文件
 * @param blob Blob 数据
 * @param fileName 文件名（含扩展名）
 */
export const saveBlob = (blob: Blob, fileName: string): void => {
  saveAs(blob, fileName)
}

export default { saveBlob }
