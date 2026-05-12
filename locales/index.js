import zh from './zh.js'
import en from './en.js'
import ko from './ko.js'

const locales = { zh, en, ko }
const defaultLang = 'zh'

// 每次获取都从storage读取，确保页面刷新后能获取最新语言
let currentLang = uni.getStorageSync('language') || defaultLang

export const getLocale = () => {
  // 每次调用都重新读取storage，确保获取最新值
  const savedLang = uni.getStorageSync('language')
  if (savedLang && locales[savedLang]) {
    currentLang = savedLang
  }
  return currentLang
}

export const setLocale = (lang) => {
  if (locales[lang]) {
    currentLang = lang
    uni.setStorageSync('language', lang)
  }
}

// 支持嵌套key，如 'styles.formal'
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part]
    }
    return undefined
  }, obj)
}

export const t = (key) => {
  // 每次调用t函数都重新读取当前语言
  const savedLang = uni.getStorageSync('language')
  if (savedLang && locales[savedLang]) {
    currentLang = savedLang
  }
  const lang = locales[currentLang] || locales[defaultLang]
  const value = getNestedValue(lang, key)
  return value !== undefined ? value : key
}

export const getLocaleOptions = () => [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' }
]

export default locales
