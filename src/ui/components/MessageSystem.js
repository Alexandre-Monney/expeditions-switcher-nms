class MessageSystem {
    constructor(appState) {
        this.appState = appState;
        this.container = document.getElementById('message-container');
        
        if (!this.container) {
            console.warn('Message container not found in DOM');
            return;
        }

        this.appState.subscribe((newState, prevState) => {
            if (newState.messages !== prevState.messages) {
                this.updateMessages(newState.messages);
            }
        });
    }

    updateMessages(messages) {
        if (!this.container) return;

        this.container.innerHTML = '';
        
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            this.container.appendChild(messageElement);
        });
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${message.type}`;
        messageDiv.dataset.messageId = message.id;
        
        const iconMap = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️',
            'warning': '⚠️'
        };
        
        const icon = iconMap[message.type] || iconMap.info;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-icon">${icon}</span>
                <span class="message-text">${message.text}</span>
                <button class="message-close" data-message-id="${message.id}">×</button>
            </div>
        `;
        
        const closeBtn = messageDiv.querySelector('.message-close');
        closeBtn.addEventListener('click', () => {
            this.appState.removeMessage(message.id);
        });

        messageDiv.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                this.appState.removeMessage(message.id);
            }
        });
        
        return messageDiv;
    }

    showMessage(text, type = 'info') {
        this.appState.addMessage(text, type);
    }

    showSuccess(text) {
        this.showMessage(text, 'success');
    }

    showError(text) {
        this.showMessage(text, 'error');
    }

    showWarning(text) {
        this.showMessage(text, 'warning');
    }

    showInfo(text) {
        this.showMessage(text, 'info');
    }

    clearAll() {
        this.appState.setState({ messages: [] });
    }
}

window.MessageSystem = MessageSystem;