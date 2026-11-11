import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { noticeInputSchema, noticeModeSchema } from '../../shared/notices'
import {
  createNotice,
  discardNoticeImage,
  getNoticeImagePreview,
  listNotices,
  listNoticeRecipients,
  pickNoticeImage,
  previewNoticeRecipients
} from '../services/notice-service'
import { handleAdminOnly } from '../auth/require-admin'

const idSchema = z.string()
const previewInputSchema = z.object({ mode: noticeModeSchema, date: z.date() })

export function registerNoticeIpc(): void {
  handleAdminOnly(IPC_CHANNELS.NOTICE_CREATE, (_event, data: unknown) => {
    return createNotice(noticeInputSchema.parse(data))
  })

  handleAdminOnly(IPC_CHANNELS.NOTICE_LIST, () => {
    return listNotices()
  })

  handleAdminOnly(IPC_CHANNELS.NOTICE_LIST_RECIPIENTS, (_event, noticeId: unknown) => {
    return listNoticeRecipients(idSchema.parse(noticeId))
  })

  handleAdminOnly(IPC_CHANNELS.NOTICE_PICK_IMAGE, () => {
    return pickNoticeImage()
  })

  handleAdminOnly(IPC_CHANNELS.NOTICE_DISCARD_IMAGE, (_event, imagePath: unknown) => {
    return discardNoticeImage(idSchema.parse(imagePath))
  })

  handleAdminOnly(IPC_CHANNELS.NOTICE_GET_IMAGE_PREVIEW, (_event, imagePath: unknown) => {
    return getNoticeImagePreview(idSchema.parse(imagePath))
  })

  handleAdminOnly(IPC_CHANNELS.NOTICE_PREVIEW_RECIPIENTS, (_event, data: unknown) => {
    const input = previewInputSchema.parse(data)
    return previewNoticeRecipients(input.mode, input.date)
  })
}
