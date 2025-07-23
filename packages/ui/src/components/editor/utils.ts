import { generateHTML, generateJSON } from '@tiptap/core'
import { type JSONContent } from 'novel'
import { defaultExtensions } from './extensions'

export const getHTMLfromJson = (json: JSONContent): string => {
  if (!json) return ''

  return generateHTML(json, defaultExtensions)
}

export const getJSONfromHTML = (html: string): JSONContent => {
  return generateJSON(html, defaultExtensions)
}
