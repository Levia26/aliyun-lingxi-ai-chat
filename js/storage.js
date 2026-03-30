;(function () {
  const THEME_KEY = 'LINGXI_THEME'
  const API_KEY = 'LINGXI_API_KEY'
  const ALLOWED = { 'theme-dark': true, 'theme-light': true }

  function safeGet(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null
    } catch (e) {
      return null
    }
  }

  function safeSet(key, value) {
    try {
      if (!window.localStorage) return
      window.localStorage.setItem(key, value)
    } catch (e) {
      // ignore
    }
  }

  function getTheme() {
    const v = safeGet(THEME_KEY)
    if (!v) return null
    return ALLOWED[v] ? v : null
  }

  function setTheme(theme) {
    if (!theme || !ALLOWED[theme]) return
    safeSet(THEME_KEY, theme)
  }

  function getApiKey() {
    const v = safeGet(API_KEY)
    const key = (v || '').trim()
    return key ? key : null
  }

  function setApiKey(key) {
    const next = (key || '').trim()
    if (!next) return
    safeSet(API_KEY, next)
  }

  window.LingxiStorage = window.LingxiStorage || {}
  window.LingxiStorage.getTheme = getTheme
  window.LingxiStorage.setTheme = setTheme
  window.LingxiStorage.getApiKey = getApiKey
  window.LingxiStorage.setApiKey = setApiKey
})()
