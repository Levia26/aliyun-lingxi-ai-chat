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