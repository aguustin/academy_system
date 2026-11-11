import { Schema, model, type HydratedDocument } from 'mongoose'
import {
  noticeModeSchema,
  noticeRecipientStatusSchema,
  type Notice,
  type NoticeRecipient
} from '../../shared/notices'

type NoticeDocument = Omit<Notice, 'id'>

const noticeSchema = new Schema<NoticeDocument>(
  {
    description: { type: String, required: true },
    date: { type: Date, required: true },
    mode: { type: String, enum: noticeModeSchema.options, required: true },
    imagePath: { type: String, required: false, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'avisos' }
)

const NoticeModel = model<NoticeDocument>('Notice', noticeSchema)

function toNotice(doc: HydratedDocument<NoticeDocument>): Notice {
  const { _id, description, date, mode, imagePath, createdAt, updatedAt } = doc
  return {
    id: _id.toString(),
    description,
    date,
    mode,
    imagePath: imagePath ?? null,
    createdAt,
    updatedAt
  }
}

type CreateNoticeInput = Omit<NoticeDocument, 'createdAt' | 'updatedAt'>

export async function createNotice(data: CreateNoticeInput): Promise<Notice> {
  const now = new Date()
  const doc = await NoticeModel.create({ ...data, createdAt: now, updatedAt: now })
  return toNotice(doc)
}

export async function listNotices(): Promise<Notice[]> {
  const docs = await NoticeModel.find().sort({ createdAt: -1 })
  return docs.map(toNotice)
}

type NoticeRecipientDocument = Omit<NoticeRecipient, 'id'>

const noticeRecipientSchema = new Schema<NoticeRecipientDocument>(
  {
    noticeId: { type: String, required: true },
    studentId: { type: String, required: true },
    phone: { type: String, required: false },
    status: { type: String, enum: noticeRecipientStatusSchema.options, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: 'avisos_destinatarios' }
)

noticeRecipientSchema.index({ noticeId: 1 })

const NoticeRecipientModel = model<NoticeRecipientDocument>(
  'NoticeRecipient',
  noticeRecipientSchema
)

function toNoticeRecipient(doc: HydratedDocument<NoticeRecipientDocument>): NoticeRecipient {
  const { _id, noticeId, studentId, phone, status, createdAt } = doc
  return { id: _id.toString(), noticeId, studentId, phone: phone ?? null, status, createdAt }
}

type CreateNoticeRecipientInput = Omit<NoticeRecipientDocument, 'createdAt'>

export async function createNoticeRecipients(
  recipients: CreateNoticeRecipientInput[]
): Promise<NoticeRecipient[]> {
  if (recipients.length === 0) return []
  const now = new Date()
  const docs = await NoticeRecipientModel.create(
    recipients.map((recipient) => ({ ...recipient, createdAt: now }))
  )
  return docs.map(toNoticeRecipient)
}

export async function listNoticeRecipients(noticeId: string): Promise<NoticeRecipient[]> {
  const docs = await NoticeRecipientModel.find({ noticeId })
  return docs.map(toNoticeRecipient)
}
