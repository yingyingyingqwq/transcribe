const url = 'https://api.chatanywhere.tech/v1/audio/transcriptions'

const transcribe = (apiKey, file, language, response_format) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', 'whisper-1')
    formData.append('response_format', response_format || 'verbose_json')
    if (language) {
        formData.append('language', language)
    }

    const headers = new Headers()
    headers.append('Authorization', `Bearer ${apiKey}`)

    return fetch(url, {
        method: 'POST',
        body: formData,
        headers: headers
    }).then(response => {
        console.log(response)
        // Automatically handle response format
        if (response_format === 'json' || response_format === 'verbose_json') {
            return response.json()
        } else {
            return response.text()
        }
    }).catch(error => console.error(error))
}

const hideStartView = () => {
    document.querySelector('#start-view').classList.add('hidden')
}

const showStartView = () => {
    document.querySelector('#start-view').classList.remove('hidden')
}

const setupAPIKeyInput = () => {
    const element = document.querySelector('#api-key')
    const savedAPIKey = localStorage.getItem('api-key') || ''
    element.value = savedAPIKey
    element.addEventListener('input', () => {
        const key = element.value
        console.log('saving:', key)
        localStorage.setItem('api-key', key)
        if (key) {
            hideStartView()
        } else {
            showStartView()
        }
    })

    if (savedAPIKey) {
        hideStartView()
    }
}

const updateTextareaSize = (element) => {
    element.style.height = 0

    const style = window.getComputedStyle(element)
    const paddingTop = parseFloat(style.getPropertyValue('padding-top'))
    const paddingBottom = parseFloat(style.getPropertyValue('padding-bottom'))

    const height = element.scrollHeight - paddingTop - paddingBottom

    element.style.height = `${height}px`
}

let outputElement

const setTranscribingMessage = (text) => {
    outputElement.innerHTML = text
}

const setTranscribedPlainText = (text) => {
    text = text.replaceAll('&', '&amp;')
    text = text.replaceAll('<', '&lt;')
    text = text.replaceAll('>', '&gt;')
    outputElement.innerHTML = `<pre>${text}</pre>`
}

const setTranscribedSegments = (segments) => {
    outputElement.innerHTML = ''
    for (const segment of segments) {
        const element = document.createElement('div')
        element.classList.add('segment')
        element.innerText = segment.text
        outputElement.appendChild(element)
    }
}

const downloadFile = (content, filename) => {
    const element = document.createElement('a')
    const blob = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(blob)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

window.addEventListener('load', () => {
    setupAPIKeyInput()
    outputElement = document.querySelector('#output')

    const fileInput = document.querySelector('#audio-file')
    fileInput.addEventListener('change', () => {
        setTranscribingMessage('转录中...')

        const apiKey = localStorage.getItem('api-key')
        const file = fileInput.files[0]
        const language = document.querySelector('#language').value
        const response_format = document.querySelector('#response_format').value
        const response = transcribe(apiKey, file, language, response_format)

        response.then(transcription => {
            if (response_format === 'verbose_json') {
                setTranscribedSegments(transcription.segments)
            } else {
                setTranscribedPlainText(transcription)
                if (response_format === 'srt') {
                    downloadFile(transcription, 'transcription.srt')
                } else if (response_format === 'vtt') {
                    downloadFile(transcription, 'transcription.vtt')
                }
            }

            fileInput.value = null
        })
    })
})