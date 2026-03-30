// ========== 全局图片放大预览工具（新增） ==========
function openImagePreview(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85); z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    cursor: zoom-out;
  `;

  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = `
    max-width: 90vw; max-height: 90vh; object-fit: contain;
    transition: transform 0.2s;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute; top: 20px; right: 20px;
    background: rgba(255,255,255,0.2); color: white;
    border: none; border-radius: 50%; width: 40px; height: 40px;
    font-size: 20px; cursor: pointer;
  `;

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  function close() {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
  }
  overlay.addEventListener('click', e => e.target === overlay && close());
  closeBtn.addEventListener('click', close);
  document.body.style.overflow = 'hidden';
}
// ========== 预览工具结束 ==========

;(function () {
  function $(selector) {
    return document.querySelector(selector)
  }

  function getInitialTheme() {
    const saved =
      window.LingxiStorage && typeof window.LingxiStorage.getTheme === 'function'
        ? window.LingxiStorage.getTheme()
        : null
    return saved || 'theme-dark'
  }
  function getThemeIcon(theme) {
    if (theme === 'theme-dark') {
      return `
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4.93 4.93l1.41 1.41"></path>
            <path d="M17.66 17.66l1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="M4.93 19.07l1.41-1.41"></path>
            <path d="M17.66 6.34l1.41-1.41"></path>
          </svg>
        </span>
      `
    }
  
    return `
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path>
        </svg>
      </span>
    `
  }
  function setTheme(next, shouldSave) {
    const body = document.body
    body.classList.remove('theme-light', 'theme-dark')
    body.classList.add(next)
  
    const btn = $('#themeToggleBtn')
    const btn2 = $('#themeToggleBtn2')
    const iconHtml = getThemeIcon(next)
  
    if (btn) btn.innerHTML = iconHtml
    if (btn2) btn2.innerHTML = iconHtml
  
    if (shouldSave && window.LingxiStorage && typeof window.LingxiStorage.setTheme === 'function') {
      window.LingxiStorage.setTheme(next)
    }
  }
  function initThemeToggle() {
    const btn = $('#themeToggleBtn')
    const btn2 = $('#themeToggleBtn2')
    const handler = function () {
      const body = document.body
      const isLight = body.classList.contains('theme-light')
      const next = isLight ? 'theme-dark' : 'theme-light'
      setTheme(next)
      if (window.LingxiStorage && typeof window.LingxiStorage.setTheme === 'function') {
        window.LingxiStorage.setTheme(next)
      }
    }
    if (btn) btn.addEventListener('click', handler)
    if (btn2) btn2.addEventListener('click', handler)
  }
  function initChat() {
    const textarea = $('#messageInput')
    const sendBtn = $('#sendBtn')
    const clearBtn = $('#clearChatBtn')
    const uploadBtn = $('#uploadImageBtn')
    const imageInput = $('#imageInput')
    const preview = $('#attachmentPreview')
  
    let selectedImage = null
    let isGenerating = false
    function getSendIcon(isGenerating) {
      if (isGenerating) {
        return `
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="6.5" y="6.5" width="11" height="11" rx="1.8"></rect>
            </svg>
          </span>
        `
      }
    
      return `
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 19V5"></path>
            <path d="M6 11l6-6 6 6"></path>
          </svg>
        </span>
      `
    }
    function setGenerating(next) {
      isGenerating = !!next
    
      if (!sendBtn) return
    
      sendBtn.innerHTML = getSendIcon(isGenerating)
    
      if (isGenerating) {
        sendBtn.classList.remove('hidden')
        sendBtn.title = '停止生成'
        sendBtn.classList.add('is-generating')
    
        if (uploadBtn) {
          uploadBtn.classList.add('hidden')
        }
      } else {
        sendBtn.title = '发送'
        sendBtn.classList.remove('is-generating')
    
        if (uploadBtn) {
          uploadBtn.classList.remove('hidden')
        }
    
        updateSendVisibility()
      }
    }
    window.LingxiApp = window.LingxiApp || {}
window.LingxiApp.setGenerating = setGenerating

// ========== 修复发送前预览图可点击放大 ==========
function renderPreview() {
  if (!preview) return

  preview.innerHTML = ''

  if (!selectedImage) {
    preview.classList.add('hidden')
    return
  }

  preview.classList.remove('hidden')
  
  const chip = document.createElement('div')
  chip.className = 'attachment-chip'
  chip.style.cssText = `
    display: flex;
    align-items: center;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 8px 0;
    gap: 8px;
    background: #f9f9f9;
  `

  const thumbWrap = document.createElement('div')
  thumbWrap.className = 'attachment-thumb-wrap'
  thumbWrap.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
  `

  const img = document.createElement('img')
  img.className = 'attachment-thumb'
  img.src = selectedImage.url
  img.alt = selectedImage.name || '图片'
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: zoom-in;
  `
  // 点击放大
  img.addEventListener('click', () => openImagePreview(selectedImage.url))

  thumbWrap.appendChild(img)

  const meta = document.createElement('div')
  meta.className = 'attachment-meta'
  meta.style.cssText = `
    flex: 1;
    min-width: 0;
  `

  const name = document.createElement('div')
  name.className = 'attachment-name'
  name.textContent = selectedImage.name || '已选择图片'
  name.style.cssText = `
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  `

  const hint = document.createElement('div')
  hint.className = 'attachment-hint'
  hint.textContent = '发送后将作为图片消息展示'
  hint.style.cssText = `
    font-size: 12px;
    color: #666;
  `

  meta.appendChild(name)
  meta.appendChild(hint)

  const remove = document.createElement('button')
  remove.className = 'attachment-remove'
  remove.type = 'button'
  remove.setAttribute('aria-label', '移除图片')
  remove.innerHTML = '✕'
  remove.style.cssText = `
    border: none;
    background: transparent;
    color: #999;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  `
  remove.onmouseover = function() {
    this.style.background = '#eee'
    this.style.color = '#333'
  }
  remove.onmouseout = function() {
    this.style.background = 'transparent'
    this.style.color = '#999'
  }

  remove.addEventListener('click', function () {
    if (selectedImage && selectedImage.url) {
      URL.revokeObjectURL(selectedImage.url)
    }
    selectedImage = null
    if (imageInput) imageInput.value = ''
    renderPreview()
    updateSendVisibility()
    if (textarea) textarea.focus()
  })

  chip.appendChild(thumbWrap)
  chip.appendChild(meta)
  chip.appendChild(remove)
  preview.appendChild(chip)
  
  preview.offsetHeight
}
// ========== 预览修复结束 ==========

    function updateSendVisibility() {
      if (!sendBtn || !textarea) return
    
      if (isGenerating) {
        sendBtn.classList.remove('hidden')
        if (uploadBtn) uploadBtn.classList.add('hidden')
        return
      }
    
      if (uploadBtn) uploadBtn.classList.remove('hidden')
    
      const hasText = !!textarea.value.trim()
      const hasImage = !!selectedImage
    
      if (hasText || hasImage) {
        sendBtn.classList.remove('hidden')
      } else {
        sendBtn.classList.add('hidden')
      }
    }
  
    // function sendFromUI() {
    //   if (!textarea) return
  
    //   const text = textarea.value
    //   const payload = selectedImage
    //   ? {
    //       file: selectedImage.file,
    //       imageUrl: selectedImage.url,
    //       fileName: selectedImage.name,
    //     }
    //   : null
  
    //   if (window.LingxiChat && typeof window.LingxiChat.sendMessage === 'function') {
    //     setGenerating(true)
  
    //     window.LingxiChat.sendMessage(text, payload).finally(function () {
    //       setGenerating(false)
    //       updateSendVisibility()
    //       if (textarea) textarea.focus()
    //     })
    //   }
  
    //   textarea.value = ''
  
    //   if (selectedImage && selectedImage.url) {
    //     URL.revokeObjectURL(selectedImage.url)
    //   }
  
    //   selectedImage = null
    //   if (imageInput) imageInput.value = ''
  
    //   renderPreview()
    //   updateSendVisibility()
    // }

    // 把图片转成 base64，避免发送后链接失效
function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

// 在 sendFromUI 里异步转成 base64
async function sendFromUI() {
  if (!textarea) return

  const text = textarea.value
  let payload = null

  if (selectedImage) {
    const base64 = await fileToDataUrl(selectedImage.file)
    payload = {
      file: selectedImage.file,
      imageUrl: base64, // 用 base64 替代临时 URL
      fileName: selectedImage.name,
    }
  }

  if (window.LingxiChat && typeof window.LingxiChat.sendMessage === 'function') {
    setGenerating(true)
    window.LingxiChat.sendMessage(text, payload).finally(function () {
      setGenerating(false)
      updateSendVisibility()
      if (textarea) textarea.focus()
    })
  }

  textarea.value = ''

  if (selectedImage && selectedImage.url) {
    URL.revokeObjectURL(selectedImage.url)
  }

  selectedImage = null
  if (imageInput) imageInput.value = ''

  renderPreview()
  updateSendVisibility()
}
  
    if (window.LingxiChat && typeof window.LingxiChat.bindInputBehavior === 'function') {
      window.LingxiChat.bindInputBehavior(textarea, function () {
        if (isGenerating) return
        sendFromUI()
      })
    }
  
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        if (isGenerating) {
          if (window.LingxiChat && typeof window.LingxiChat.stopActiveGeneration === 'function') {
            window.LingxiChat.stopActiveGeneration()
          }
          return
        }
  
        sendFromUI()
      })
    }
  
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (window.LingxiChat && typeof window.LingxiChat.stopActiveGeneration === 'function') {
          window.LingxiChat.stopActiveGeneration()
        }
  
        setGenerating(false)
  
        if (window.LingxiUI && typeof window.LingxiUI.clearChat === 'function') {
          window.LingxiUI.clearChat()
        }
  
        if (window.LingxiUI && typeof window.LingxiUI.showWelcome === 'function') {
          window.LingxiUI.showWelcome()
        }
  
        if (textarea) textarea.value = ''
  
        if (selectedImage && selectedImage.url) {
          URL.revokeObjectURL(selectedImage.url)
        }
  
        selectedImage = null
        if (imageInput) imageInput.value = ''
  
        renderPreview()
        updateSendVisibility()
      })
    }
  
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function () {
        if (!imageInput) return
        imageInput.click()
      })
    }
  
    if (imageInput) {
      imageInput.addEventListener('change', function () {
        const file = imageInput.files && imageInput.files[0]
        if (!file) return
        if (!file.type || !file.type.startsWith('image/')) return
  
        if (selectedImage && selectedImage.url) {
          URL.revokeObjectURL(selectedImage.url)
        }
  
        selectedImage = {
          file,
          name: file.name,
          url: URL.createObjectURL(file),
        }
  
        renderPreview()
        updateSendVisibility()
      })
    }
  
    if (textarea) {
      textarea.addEventListener('input', function () {
        updateSendVisibility()
      })
      updateSendVisibility()
    }
  }

  function initSuggestionCards() {
    const cards = document.querySelectorAll('.suggestion-card')
    if (!cards || !cards.length) return
  
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        const prompt = card.getAttribute('data-prompt') || card.textContent || ''
        if (!prompt) return
  
        if (window.LingxiChat && typeof window.LingxiChat.sendMessage === 'function') {
          if (window.LingxiApp && typeof window.LingxiApp.setGenerating === 'function') {
            window.LingxiApp.setGenerating(true)
          }
  
          window.LingxiChat.sendMessage(prompt).finally(function () {
            if (window.LingxiApp && typeof window.LingxiApp.setGenerating === 'function') {
              window.LingxiApp.setGenerating(false)
            }
          })
        }
      })
    })
  }
  function ensureApiKey() {
     const storage = window.LingxiStorage
  if (!storage) return

  let key = storage.getApiKey()

  if (!key) {
    key = prompt('请输入你的阿里云百炼 API Key（只需输入一次）')

    if (key && key.trim()) {
      storage.setApiKey(key.trim())
    } else {
      alert('未输入 API Key，将无法使用 AI 功能')
    }
  }
  }

  function init() {
    ensureApiKey()
    setTheme(getInitialTheme())
    initThemeToggle()
    initChat()
    initSuggestionCards()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()

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
  
      if (pre.querySelector('.code-toolbar')) return
  
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

  // ========== 修复发送后聊天图片可点击放大 ==========
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
    // 点击放大
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openImagePreview(imageUrl));

    bubble.appendChild(img)

    const meta = createElement('div', 'chat-meta', formatTime())

    content.appendChild(bubble)
    content.appendChild(meta)
    item.appendChild(content)
    list.appendChild(item)
    scrollToBottom()
  }
  // ========== 聊天图片修复结束 ==========

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

;(function () {
  let activeController = null

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader()

      reader.onload = function () {
        resolve(reader.result)
      }

      reader.onerror = function () {
        reject(new Error('图片读取失败'))
      }

      reader.readAsDataURL(file)
    })
  }

  async function sendMessage(text, imagePayload) {
    const hasText = !!(text && text.trim())
    const hasImage = !!(imagePayload && imagePayload.file)

    if (!hasText && !hasImage) return
    if (!window.LingxiUI) return

    stopActiveGeneration()
    window.LingxiUI.hideWelcome()

    if (hasText) {
      window.LingxiUI.addUserMessage(text.trim())
    }

    if (hasImage) {
      window.LingxiUI.addUserImage(imagePayload.imageUrl, imagePayload.fileName)
    }

    const userText = hasText ? text.trim() : '请描述这张图片的内容。'

    let userContent = userText

    if (hasImage) {
      const dataUrl = await fileToDataUrl(imagePayload.file)

      userContent = [
        {
          type: 'text',
          text: userText,
        },
        {
          type: 'image_url',
          image_url: {
            url: dataUrl,
          },
        },
      ]
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个简洁、友好的 AI 助手，请使用中文回答，并尽量使用清晰的 Markdown 格式。',
      },
      {
        role: 'user',
        content: userContent,
      },
    ]

    const controller = new AbortController()
    activeController = controller

    const streamer =
      window.LingxiUI && typeof window.LingxiUI.addAiStreamingMessage === 'function'
        ? window.LingxiUI.addAiStreamingMessage({
            initialText: '',
          })
        : null

    let latestText = ''

    try {
      const finalText = await window.LingxiAPI.streamChat(messages, {
        controller,
        onDelta(fullText) {
          latestText = fullText
          if (streamer && typeof streamer.setText === 'function') {
            streamer.setText(fullText)
          }
        },
      })

      activeController = null
      return finalText
    } catch (error) {
      if (error.name === 'AbortError') {
        if (streamer && typeof streamer.setText === 'function') {
          const stoppedText = latestText
            ? `${latestText}\n\n（已停止生成）`
            : '（已停止生成）'
          streamer.setText(stoppedText)
        }
      } else {
        if (streamer && typeof streamer.setText === 'function') {
          streamer.setText(`调用失败：${error.message}`)
        } else if (window.LingxiUI && typeof window.LingxiUI.addAiMessage === 'function') {
          window.LingxiUI.addAiMessage(`调用失败：${error.message}`)
        }
        console.error(error)
      }

      activeController = null
    }
  }

  function bindInputBehavior(textarea, onEnterSend) {
    if (!textarea) return

    textarea.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (typeof onEnterSend === 'function') {
          onEnterSend(textarea.value)
        }
      }
    })
  }

  function stopActiveGeneration() {
    if (activeController) {
      activeController.abort()
      activeController = null
    }
  }

  window.LingxiChat = {
    sendMessage,
    bindInputBehavior,
    stopActiveGeneration,
  }
})()