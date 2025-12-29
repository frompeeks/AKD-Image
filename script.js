document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d');
    
    const el = {
        mainS: document.getElementById('main-screen'),
        editS: document.getElementById('editor-screen'),
        back: document.getElementById('back-btn'),
        change: document.getElementById('change-img-btn'),
        info: document.getElementById('info-icon'),
        fileInp: document.getElementById('file-input'),
        uploadZ: document.getElementById('upload-zone'),
        previewZ: document.getElementById('preview-area'),
        title: document.getElementById('editor-title'),
        process: document.getElementById('process-btn'),
        qRange: document.getElementById('quality-range'),
        qVal: document.getElementById('quality-value'),
        wInp: document.getElementById('resize-width'),
        hInp: document.getElementById('resize-height'),
        aspect: document.getElementById('maintain-aspect'),
        wmText: document.getElementById('wm-text'),
        wmOp: document.getElementById('wm-opacity'),
        wmRot: document.getElementById('wm-rotate'),
        wmColor: document.getElementById('wm-color'),
        rRange: document.getElementById('round-radius'),
        rVal: document.getElementById('radius-value')
    };

    let currentTool = '', ratio = 1, img = new Image();

    // Функция для показа главного экрана
    function showMainScreen() {
        el.mainS.classList.remove('hidden');
        el.editS.classList.add('hidden');
        currentTool = '';
        // Добавляем запись в историю при возврате на главную
        if (window.location.pathname !== '/' && window.location.search !== '') {
            history.pushState({ screen: 'main' }, '', window.location.pathname);
        }
    }

    // Функция для показа редактора с конкретным инструментом
    function showEditor(tool, pushHistory = true) {
        currentTool = tool;
        const card = document.querySelector(`[data-tool="${tool}"]`);
        if (!card) return;
        
        el.title.innerText = card.querySelector('h2').innerText;
        el.mainS.classList.add('hidden');
        el.editS.classList.remove('hidden');
        
        document.querySelectorAll('.setting-item').forEach(s => s.classList.add('hidden'));
        const active = document.getElementById(`${currentTool}-settings`);
        if(active) active.classList.remove('hidden');

        currentTool === 'rounded' ? el.info.classList.remove('hidden') : el.info.classList.add('hidden');
        
        // Добавляем запись в историю браузера
        if (pushHistory) {
            history.pushState(
                { screen: 'editor', tool: tool }, 
                '', 
                `?tool=${tool}`
            );
        }
        
        render();
    }

    // Обработка нажатий на карточки инструментов
    document.querySelectorAll('.tool-card').forEach(card => {
        card.onclick = () => {
            showEditor(card.dataset.tool, true);
        };
    });

    // Обработка кнопки "Назад"
    el.back.onclick = () => {
        showMainScreen();
    };

    // Обработка нажатия кнопки "Назад" в браузере
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.screen === 'editor' && e.state.tool) {
            // Возврат к редактору с конкретным инструментом
            showEditor(e.state.tool, false);
        } else {
            // Возврат на главную
            showMainScreen();
        }
    });

    // Проверка URL при загрузке страницы (для прямых ссылок)
    const urlParams = new URLSearchParams(window.location.search);
    const toolParam = urlParams.get('tool');
    if (toolParam) {
        showEditor(toolParam, false);
    } else {
        // Устанавливаем начальное состояние для главной страницы
        history.replaceState({ screen: 'main' }, '', window.location.pathname);
    }

    el.fileInp.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            img.onload = () => {
                ratio = img.width / img.height;
                el.wInp.value = img.width;
                el.hInp.value = img.height;
                el.uploadZ.classList.add('hidden');
                el.previewZ.classList.remove('hidden');
                el.change.classList.remove('hidden');
                render();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    function render() {
        if(!img.src) return;
        const w = (currentTool === 'resize') ? (parseInt(el.wInp.value) || img.width) : img.width;
        const h = (currentTool === 'resize') ? (parseInt(el.hInp.value) || img.height) : img.height;
        canvas.width = w; canvas.height = h;

        ctx.clearRect(0, 0, w, h);

        if (currentTool === 'rounded') {
            const r = Math.min(parseInt(el.rRange.value), w/2, h/2);
            ctx.beginPath();
            ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
            ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
            ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
            ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            ctx.clip();
        }

        ctx.drawImage(img, 0, 0, w, h);

        if(currentTool === 'watermark' && el.wmText.value) {
            ctx.save();
            ctx.globalAlpha = el.wmOp.value;
            ctx.fillStyle = el.wmColor.value;
            const fontSize = Math.max(w, h) / 25;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            const angle = el.wmRot.value * Math.PI / 180;
            const stepX = fontSize * 6, stepY = fontSize * 4;
            for (let x = -w; x < w * 2; x += stepX) {
                for (let y = -h; y < h * 2; y += stepY) {
                    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
                    ctx.fillText(el.wmText.value, 0, 0); ctx.restore();
                }
            }
            ctx.restore();
        }
    }

    [el.qRange, el.wInp, el.hInp, el.wmText, el.wmOp, el.wmRot, el.wmColor, el.rRange].forEach(i => {
        i.oninput = () => {
            if(i === el.qRange) el.qVal.innerText = i.value;
            if(i === el.rRange) el.rVal.innerText = i.value;
            if(i === el.wInp && el.aspect.checked) el.hInp.value = Math.round(el.wInp.value / ratio);
            if(i === el.hInp && el.aspect.checked) el.wInp.value = Math.round(el.hInp.value * ratio);
            render();
        };
    });

    el.change.onclick = () => el.fileInp.click();
    el.uploadZ.onclick = () => el.fileInp.click();
    
    el.process.onclick = () => {
        const isPng = currentTool === 'rounded';
        const link = document.createElement('a');
        link.download = `AKD_${Date.now()}.${isPng ? 'png' : 'jpg'}`;
        link.href = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? 1.0 : el.qRange.value / 100);
        link.click();
    };
});