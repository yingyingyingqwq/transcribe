window.addEventListener('load', () => {
    setupAPIKeyInput();
    outputElement = document.querySelector('#output');
    const savePromptButton = document.querySelector('#save-prompt');
    savePromptButton.addEventListener('click', saveQuickPrompt);

    loadQuickPrompts();

    const temperatureRange = document.querySelector('#temperature-input');
    const temperatureNumber = document.querySelector('#temperature-number');
    temperatureRange.addEventListener('input', () => temperatureNumber.value = temperatureRange.value);
    temperatureNumber.addEventListener('input', () => temperatureRange.value = temperatureNumber.value);

    const dropArea = document.getElementById('drop-area');
    const showDropArea = () => dropArea.classList.replace('hidden', 'active');
    const hideDropArea = () => dropArea.classList.replace('active', 'hidden');

    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        showDropArea();
    });

    dropArea.addEventListener('dragover', e => e.preventDefault());
    dropArea.addEventListener('dragleave', hideDropArea);
    dropArea.addEventListener('drop', e => {
        e.preventDefault();
        hideDropArea();
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });

    const fileInput = document.querySelector('#audio-file');
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    const handleFiles = files => {
        if (!files.length) return;
        
        setTranscribingMessage('转录中...');
        const file = files[0];
        const apiKey = localStorage.getItem('api-key');
        if (!apiKey) return alert('请先输入API密钥');

        const originalFilename = file.name;
        const config = {
            language: document.querySelector('#language').value,
            response_format: document.querySelector('#response_format').value,
            prompt: document.querySelector('#prompt').value,
            temperature: document.querySelector('#temperature-number').value
        };

        transcribe(apiKey, file, config.language, config.response_format, config.prompt, config.temperature)
            .then(transcription => {
                if (config.response_format === 'verbose_json') {
                    setTranscribedSegments(transcription.segments);
                } else {
                    setTranscribedPlainText(transcription);
                    if (['srt', 'vtt'].includes(config.response_format)) {
                        downloadFile(transcription, originalFilename, config.response_format);
                    }
                }
                fileInput.value = '';
            })
            .catch(error => {
                console.error(error);
                setTranscribingMessage(`转录失败: ${error.message}`);
            });
    };
});
