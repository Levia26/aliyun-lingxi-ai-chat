;(function () {
    const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
    // const MODEL_NAME = 'qwen-flash' // 想更稳一点也可以改回 qwen-plus
  const MODEL_NAME = 'qwen3-vl-flash'
    async function sendChat(messages) {
      if (!window.LingxiStorage || typeof window.LingxiStorage.getApiKey !== 'function') {
        throw new Error('未找到存储模块，无法读取 API Key')
      }
  
      const apiKey = window.LingxiStorage.getApiKey()
      if (!apiKey) {
        throw new Error('未找到 API Key，请先输入并保存 LINGXI_API_KEY')
      }
  
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
        }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        const msg =
          data && data.error && data.error.message
            ? data.error.message
            : '百炼接口调用失败'
        throw new Error(msg)
      }
  
      const content =
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
  
      if (!content) {
        throw new Error('接口返回成功，但没有拿到回复内容')
      }
  
      return content
    }
  
    async function streamChat(messages, options) {
      if (!window.LingxiStorage || typeof window.LingxiStorage.getApiKey !== 'function') {
        throw new Error('未找到存储模块，无法读取 API Key')
      }
  
      const apiKey = window.LingxiStorage.getApiKey()
      if (!apiKey) {
        throw new Error('未找到 API Key，请先输入并保存 LINGXI_API_KEY')
      }
  
      const controller = options && options.controller ? options.controller : null
      const onDelta = options && typeof options.onDelta === 'function' ? options.onDelta : null
  
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller ? controller.signal : undefined,
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
          stream: true,
        }),
      })
  
      if (!response.ok) {
        let msg = '百炼流式接口调用失败'
        try {
          const errData = await response.json()
          if (errData && errData.error && errData.error.message) {
            msg = errData.error.message
          }
        } catch (e) {}
        throw new Error(msg)
      }
  
      if (!response.body) {
        throw new Error('当前浏览器不支持流式读取')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
  
      let fullText = ''
      let buffer = ''
  
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
  
        buffer += decoder.decode(value, { stream: true })
  
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
  
        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith('data:')) continue
  
          const dataStr = line.slice(5).trim()
          if (!dataStr || dataStr === '[DONE]') continue
  
          try {
            const json = JSON.parse(dataStr)
            const delta =
              json &&
              json.choices &&
              json.choices[0] &&
              json.choices[0].delta &&
              json.choices[0].delta.content
  
            if (delta) {
              fullText += delta
              if (onDelta) onDelta(fullText)
            }
          } catch (err) {
            console.warn('流式分片解析失败：', err, dataStr)
          }
        }
      }
  
      return fullText
    }
  
    window.LingxiAPI = {
      sendChat,
      streamChat,
    }
  })()