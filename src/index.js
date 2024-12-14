const url = 'https://api.chatanywhere.tech/v1/audio/transcriptions'

const transcribe = (apiKey, file, language, response_format, prompt, temperature) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', 'whisper-1')
    formData.append('response_format', response_format || 'verbose_json')
    if (language) {
        formData.append('language', language)
    }
    if (prompt) {
        formData.append('prompt', prompt)
    }
    if (temperature) {
        formData.append('temperature', temperature)
    }

    const headers = new Headers()
    headers.append('Authorization', `Bearer ${apiKey}`)

    return fetch(url, {
        method: 'POST',
        body: formData,
        headers: headers
    }).then(response => {
        console.log(response)
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

const saveQuickPrompt = () => {
    const quickPromptInput = document.querySelector('#quick-prompt');
    const savedQuickPrompts = localStorage.getItem('quick-prompts') || '';
    const newQuickPrompts = savedQuickPrompts ? `${savedQuickPrompts},${quickPromptInput.value}` : quickPromptInput.value;
    localStorage.setItem('quick-prompts', newQuickPrompts);
    quickPromptInput.value = '';
    loadQuickPrompts();
};

const loadQuickPrompts = () => {
    const savedQuickPrompts = localStorage.getItem('quick-prompts') || '';
    const quickPrompts = savedQuickPrompts.split(',');
    const container = document.querySelector('#quick-prompts-container');
    container.innerHTML = '';

    quickPrompts.forEach((prompt, index) => {
        if (prompt) {
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('quick-prompt-item');

            const button = document.createElement('button');
            button.innerText = prompt;
            button.classList.add('quick-prompt-button');
            button.addEventListener('click', () => {
                const promptInput = document.querySelector('#prompt');
                promptInput.value += (promptInput.value ? ',' : '') + prompt;
            });

            const deleteButton = document.createElement('button');
            deleteButton.innerText = '×';
            deleteButton.classList.add('quick-prompt-button');
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                const updatedQuickPrompts = quickPrompts.filter((_, i) => i !== index).join(',');
                localStorage.setItem('quick-prompts', updatedQuickPrompts);
                loadQuickPrompts();
            });

            buttonContainer.appendChild(button);
            buttonContainer.appendChild(deleteButton);
            container.appendChild(buttonContainer);
        }
    });
};

const getTimeStamp = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

const downloadFile = (content, originalFilename, format) => {
    const timestamp = getTimeStamp();
    const Filename = originalFilename.split('.')[0];
    const filename = `${Filename}_${timestamp}.${format}`;
    const element = document.createElement('a');
    const blob = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

window.addEventListener('load', () => {
    setupAPIKeyInput();
    outputElement = document.querySelector('#output');
    const savePromptButton = document.querySelector('#save-prompt');
    savePromptButton.addEventListener('click', saveQuickPrompt);

    const fileInput = document.querySelector('#audio-file');
    fileInput.addEventListener('change', () => {
        setTranscribingMessage('转录中...');
        const apiKey = localStorage.getItem('api-key');
        const file = fileInput.files[0];
        const originalFilename = file.name;
        const language = document.querySelector('#language').value;
        const response_format = document.querySelector('#response_format').value;
        const promptInput = document.querySelector('#prompt');
        const temperatureInput = document.querySelector('#temperature-number');
        const temperature = temperatureInput.value;
        const response = transcribe(apiKey, file, language, response_format, promptInput.value, temperature);

        response.then(transcription => {
            if (response_format === 'verbose_json') {
                setTranscribedSegments(transcription.segments);
            } else {
                setTranscribedPlainText(transcription);
                if (response_format === 'srt') {
                    downloadFile(transcription, originalFilename, 'srt');
                } else if (response_format === 'vtt') {
                    downloadFile(transcription, originalFilename, 'vtt');
                }
            }
            fileInput.value = null;
        });
    });


    loadQuickPrompts();

    const temperatureRange = document.querySelector('#temperature-input');
    const temperatureNumber = document.querySelector('#temperature-number');

    temperatureRange.addEventListener('input', () => {
        const value = temperatureRange.value;
        temperatureNumber.value = value;
    });

    temperatureNumber.addEventListener('input', () => {
        const value = temperatureNumber.value;
        temperatureRange.value = value;
    });
});

