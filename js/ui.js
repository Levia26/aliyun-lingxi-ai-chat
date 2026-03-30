;(function () {
  function $(selector) {
    return document.querySelector(selector)
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag)
    if (className) el.className = className
    if (typeof text === 'string') el.textContent = text
    return el
  }

  function formatTime(date) {
    const d = date instanceof Date ? date : new Date()
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }

  function getChatList() {
    return $('#chatList')
  }

  function scrollToBottom() {
    const list = getChatList()
    if (!list) return
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight
    })
  }
  function renderMarkdown(target, text) {
    if (!target) return
  
    const source = text || ''
  
    if (window.marked) {
      marked.setOptions({
        gfm: true,
        breaks: true,
      })
  
      target.innerHTML = marked.parse(source)
    } else {
      target.textContent = source
    }
  
    if (window.hljs) {
      const codeBlocks = target.querySelectorAll('pre code')
      codeBlocks.forEach(function (block) {
        hljs.highlightElement(block)
      })
    }
  
    const preBlocks = target.querySelectorAll('pre')
    preBlocks.forEach(function (pre) {
      const code = pre.querySelector('code')
      if (!code) return
  
      // 防止重复插入工具栏
      if (pre.querySelector('.code-toolbar')) return
  
      // 提取语言名
      let language = 'code'
      const classNames = code.className ? code.className.split(' ') : []
      const langClass = classNames.find(function (name) {
        return name.indexOf('language-') === 0
      })
  
      if (langClass) {
        language = langClass.replace('language-', '')
      }
  
      const toolbar = document.createElement('div')
      toolbar.className = 'code-toolbar'
  
      const langLabel = document.createElement('span')
      langLabel.className = 'code-lang'
      langLabel.textContent = language
  
      const btn = document.createElement('button')
      btn.className = 'copy-code-btn'
      btn.type = 'button'
      btn.textContent = '复制'
  
      btn.addEventListener('click', async function () {
        const codeText = code.innerText || code.textContent || ''
  
        try {
          await navigator.clipboard.writeText(codeText)
          btn.textContent = '已复制'
          setTimeout(function () {
            btn.textContent = '复制'
          }, 1500)
        } catch (error) {
          btn.textContent = '复制失败'
          setTimeout(function () {
            btn.textContent = '复制'
          }, 1500)
          console.error('复制失败：', error)
        }
      })
  
      toolbar.appendChild(langLabel)
      toolbar.appendChild(btn)
  
      pre.insertBefore(toolbar, code)
    })
  }
  function addUserMessage(text) {
    if (!text) return
    const list = getChatList()
    if (!list) return

    const item = createElement('div', 'chat-item user')
    const content = createElement('div', 'message-content')
    const bubble = createElement('div', 'chat-bubble', text)
    const meta = createElement('div', 'chat-meta', formatTime())

    content.appendChild(bubble)
    content.appendChild(meta)
    item.appendChild(content)
    list.appendChild(item)
    scrollToBottom()
  }

  function addUserImage(imageUrl, fileName) {
    if (!imageUrl) return
    const list = getChatList()
    if (!list) return
  
    const item = createElement('div', 'chat-item user')
    const content = createElement('div', 'message-content')
    const bubble = createElement('div', 'chat-bubble user-image-bubble')
    const img = createElement('img')
  
    img.src = imageUrl
    img.alt = fileName || '图片'
    img.className = 'user-upload-image'
  
    bubble.appendChild(img)
  
    const meta = createElement('div', 'chat-meta', formatTime())
  
    content.appendChild(bubble)
    content.appendChild(meta)
    item.appendChild(content)
    list.appendChild(item)
    scrollToBottom()
  }

  function addAiMessage(text) {
    if (!text) return
    const list = getChatList()
    if (!list) return

    const item = createElement('div', 'chat-item ai')
    const avatar = createElement('div', 'chat-avatar', '灵')
    const content = createElement('div', 'message-content')
    const bubble = createElement('div', 'chat-bubble')
    const meta = createElement('div', 'chat-meta', `灵犀 · ${formatTime()}`)

    renderMarkdown(bubble, text)

    content.appendChild(bubble)
    content.appendChild(meta)

    item.appendChild(avatar)
    item.appendChild(content)
    list.appendChild(item)
    scrollToBottom()
  }

  function addAiStreamingMessage(options) {
    const list = getChatList()
    if (!list) return null

    const item = createElement('div', 'chat-item ai')
    const avatar = createElement('div', 'chat-avatar', '灵')
    const content = createElement('div', 'message-content')
    const bubble = createElement('div', 'chat-bubble')
    const meta = createElement('div', 'chat-meta', `灵犀 · ${formatTime()}`)

    renderMarkdown(bubble, (options && options.initialText) || '')

    content.appendChild(bubble)
    content.appendChild(meta)

    item.appendChild(avatar)
    item.appendChild(content)
    list.appendChild(item)
    scrollToBottom()

    return {
      setText(nextText) {
        renderMarkdown(bubble, nextText || '')
        scrollToBottom()
      },
      getText() {
        return bubble.textContent || ''
      }
    }
  }

  function clearChat() {
    const list = getChatList()
    if (!list) return
    list.innerHTML = ''
  }

  function hideWelcome() {
    const welcome = document.getElementById('welcomeSection')
    const chat = document.getElementById('chatSection')
    if (!welcome || !chat) return
    welcome.classList.add('hidden')
    chat.classList.remove('hidden')
  }

  function showWelcome() {
    const welcome = document.getElementById('welcomeSection')
    const chat = document.getElementById('chatSection')
    if (!welcome || !chat) return
    welcome.classList.remove('hidden')
    chat.classList.add('hidden')
  }

  window.LingxiUI = {
    addUserMessage,
    addUserImage,
    addAiMessage,
    addAiStreamingMessage,
    clearChat,
    hideWelcome,
    showWelcome,
  }
})()