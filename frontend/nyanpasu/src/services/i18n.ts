import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from '../locales/zh-CN.json'

// 单一中文版本配置
const resources = {
  'zh-CN': { translation: zhCN },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh-CN',
  fallbackLng: 'zh-CN', // 回退也是中文
  debug: false,
  
  // 只有中文，无需预加载其他语言
  preload: ['zh-CN'],
  
  // 命名空间配置
  ns: ['translation'],
  defaultNS: 'translation',
  
  // 插值配置
  interpolation: {
    escapeValue: false,
  },
  
  // React 配置 - 简化配置
  react: {
    useSuspense: false,
  },
  
  // 明确告诉 i18next 只有这一个语言资源
  partialBundledLanguages: false,
})
