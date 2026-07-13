export const CONTACT_NUMBER = '+91 9156996309' as const
export const WHATSAPP_PHONE_E164 = '9156996309' as const

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE_E164}` as const
export const TEL_LINK = `tel:+91${WHATSAPP_PHONE_E164.replace(/^/, '')}` as const

export const COMPANY_FULL_NAME = '1824 Vituraya Ventures Private Limited' as const
export const COMPANY_NAME_PREFIX = '1824' as const
