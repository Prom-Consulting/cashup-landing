import { z } from "zod";

/** Центр уведомлений кабинета: событие заведения с пометкой прочитано/непрочитано. */
export const notificationSchema = z.looseObject({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  createdAt: z.string(),
  read: z.boolean(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationsInboxSchema = z.looseObject({
  unread: z.number(),
  items: z.array(notificationSchema),
});
export type NotificationsInbox = z.infer<typeof notificationsInboxSchema>;
