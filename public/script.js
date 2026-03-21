class SecureMessenger {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.currentChat = null;
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    
    if (this.token) {
      await this.validateToken();
    } else {
      this.showScreen('authScreen');
    }
  }

  setupEventListeners() {
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        e.target.classList.add('active');
        const formId = e.target.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
        document.getElementById(formId).classList.add('active');
      });
    });

    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

    // Sidebar actions
    document.getElementById('searchBtn').addEventListener('click', () => this.toggleSearch());
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

    // Message input
    document.getElementById('messageTextInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
    document.getElementById('attachBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

    // Call buttons
    document.getElementById('callBtn').addEventListener('click', () => this.initiateCall('audio'));
    document.getElementById('videoCallBtn').addEventListener('click', () => this.initiateCall('video'));
    document.getElementById('closeCallBtn').addEventListener('click', () => this.endCall());
    document.getElementById('endCallBtn').addEventListener('click', () => this.endCall());

    // Auto-refresh token
    setInterval(() => this.refreshAccessToken(), 14 * 60 * 1000); // Every 14 minutes
  }

  async validateToken() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.user;
        this.showScreen('messengerScreen');
        this.initializeSocket();
        this.loadConversations();
        this.updateUserProfile();
      } else {
        await this.refreshAccessToken();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      this.logout();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    this.showLoading(true);
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.currentUser = data.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('refreshToken', this.refreshToken);
        
        this.showScreen('messengerScreen');
        this.initializeSocket();
        this.loadConversations();
        this.updateUserProfile();
      } else {
        this.showError(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Ошибка подключения');
    } finally {
      this.showLoading(false);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    this.showLoading(true);
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const displayName = document.getElementById('registerDisplayName').value;
    const password = document.getElementById('registerPassword').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, displayName, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.currentUser = data.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('refreshToken', this.refreshToken);
        
        this.showScreen('messengerScreen');
        this.initializeSocket();
        this.loadConversations();
        this.updateUserProfile();
      } else {
        this.showError(data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Ошибка подключения');
    } finally {
      this.showLoading(false);
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.accessToken;
        localStorage.setItem('token', this.token);
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
    }
  }

  initializeSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket.emit('user_online', this.currentUser.id);
    });

    this.socket.on('new_message', (message) => {
      if (this.currentChat && (message.senderId === this.currentChat.id || message.recipientId === this.currentChat.id)) {
        this.displayMessage(message);
      } else {
        this.loadConversations(); // Refresh conversation list
      }
    });

    this.socket.on('user_typing', (data) => {
      if (this.currentChat && data.senderId === this.currentChat.id) {
        this.showTypingIndicator();
      }
    });

    this.socket.on('incoming_call', (callData) => {
      this.showIncomingCall(callData);
    });

    this.socket.on('call_answered', (callData) => {
      this.onCallAnswered(callData);
    });

    this.socket.on('call_ended', (callData) => {
      this.onCallEnded(callData);
    });

    this.socket.on('users_online', (users) => {
      this.updateOnlineStatus(users);
    });

    this.socket.on('user_status_updated', (data) => {
      this.updateUserStatus(data);
    });
  }

  async loadConversations() {
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      this.displayConversations(data.conversations);
      this.updateUnreadCount();
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  }

  displayConversations(conversations) {
    const container = document.getElementById('conversationsList');
    container.innerHTML = '';

    conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.innerHTML = `
        <img src="${conv.avatar_url || 'https://via.placeholder.com/40'}" alt="${conv.display_name}" class="avatar">
        <div class="conversation-info">
          <div class="conversation-name">${conv.display_name}</div>
          <div class="conversation-last-message">${conv.last_message || 'Нет сообщений'}</div>
        </div>
        <div class="conversation-meta">
          <div>${this.formatTime(conv.last_message_time)}</div>
          ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ''}
        </div>
      `;
      
      item.addEventListener('click', () => this.openChat(conv));
      container.appendChild(item);
    });
  }

  async openChat(user) {
    this.currentChat = user;
    
    // Update UI
    document.getElementById('chatName').textContent = user.display_name;
    document.getElementById('chatAvatar').src = user.avatar_url || 'https://via.placeholder.com/40';
    document.getElementById('chatStatus').innerHTML = `<span class="status-dot ${user.status}"></span> ${this.getStatusText(user.status)}`;
    
    // Show chat elements
    document.getElementById('chatHeader').classList.remove('hidden');
    document.getElementById('messageInput').classList.remove('hidden');
    
    // Highlight active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load messages
    await this.loadMessages(user.id);
  }

  async loadMessages(userId) {
    try {
      const response = await fetch(`/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      this.displayMessages(data.messages);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  }

  displayMessages(messages) {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';

    messages.forEach(message => {
      this.displayMessage(message, false);
    });

    container.scrollTop = container.scrollHeight;
  }

  displayMessage(message, scroll = true) {
    const container = document.getElementById('messagesList');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.senderId === this.currentUser.id ? 'sent' : 'received'}`;
    
    if (message.messageType === 'text') {
      messageEl.innerHTML = `
        <img src="${message.senderAvatar || 'https://via.placeholder.com/32'}" alt="Avatar" class="message-avatar">
        <div class="message-content">
          <div class="message-text">${message.content}</div>
          <div class="message-time">${this.formatTime(message.createdAt)}</div>
        </div>
      `;
    } else if (message.messageType === 'image') {
      messageEl.innerHTML = `
        <img src="${message.senderAvatar || 'https://via.placeholder.com/32'}" alt="Avatar" class="message-avatar">
        <div class="message-content">
          <div>${message.fileName}</div>
          <img src="${message.fileUrl}" alt="${message.fileName}" style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;">
          <div class="message-time">${this.formatTime(message.createdAt)}</div>
        </div>
      `;
    } else if (message.messageType === 'video') {
      messageEl.innerHTML = `
        <img src="${message.senderAvatar || 'https://via.placeholder.com/32'}" alt="Avatar" class="message-avatar">
        <div class="message-content">
          <div>${message.fileName}</div>
          <video controls style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;">
            <source src="${message.fileUrl}" type="video/mp4">
          </video>
          <div class="message-time">${this.formatTime(message.createdAt)}</div>
        </div>
      `;
    } else {
      messageEl.innerHTML = `
        <img src="${message.senderAvatar || 'https://via.placeholder.com/32'}" alt="Avatar" class="message-avatar">
        <div class="message-content file">
          <div class="file-info">
            <div class="file-icon">📄</div>
            <div>
              <div>${message.fileName}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${this.formatFileSize(message.fileSize)}</div>
            </div>
          </div>
          <div class="message-time">${this.formatTime(message.createdAt)}</div>
        </div>
      `;
    }
    
    container.appendChild(messageEl);
    
    if (scroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  async sendMessage() {
    const input = document.getElementById('messageTextInput');
    const content = input.value.trim();
    
    if (!content || !this.currentChat) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          recipientId: this.currentChat.id,
          content,
          messageType: 'text'
        })
      });

      if (response.ok) {
        input.value = '';
        // Message will be displayed via socket event
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !this.currentChat) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('recipientId', this.currentChat.id);

    try {
      const response = await fetch('/api/messages/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      if (response.ok) {
        e.target.value = '';
        // File message will be displayed via socket event
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  }

  async initiateCall(callType = 'video') {
    if (!this.currentChat) return;

    try {
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          recipientId: this.currentChat.id,
          callType
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.showCallModal(data.call, callType);
      }
    } catch (error) {
      console.error('Initiate call error:', error);
    }
  }

  showCallModal(call, callType) {
    document.getElementById('callTitle').textContent = callType === 'video' ? 'Видеозвонок' : 'Аудиозвонок';
    document.getElementById('callName').textContent = this.currentChat.display_name;
    document.getElementById('callAvatar').src = this.currentChat.avatar_url || 'https://via.placeholder.com/80';
    document.getElementById('callStatus').textContent = 'Вызов...';
    document.getElementById('callModal').classList.remove('hidden');
    
    this.currentCall = call;
    this.callTimer = null;
    this.callStartTime = Date.now();
  }

  showIncomingCall(callData) {
    // Implement incoming call UI
    if (confirm(`Входящий звонок от ${callData.callerName}`)) {
      this.answerCall(callData.callId);
    }
  }

  async answerCall(callId) {
    try {
      const response = await fetch(`/api/calls/${callId}/answer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        // Setup WebRTC connection
        this.setupWebRTC();
      }
    } catch (error) {
      console.error('Answer call error:', error);
    }
  }

  setupWebRTC() {
    // WebRTC implementation would go here
    // This is a complex feature requiring STUN/TURN servers
    console.log('Setting up WebRTC connection...');
  }

  endCall() {
    if (this.currentCall) {
      fetch(`/api/calls/${this.currentCall.id}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
    }

    document.getElementById('callModal').classList.add('hidden');
    this.currentCall = null;
    
    if (this.callTimer) {
      clearInterval(this.callTimer);
    }
  }

  toggleSearch() {
    const container = document.getElementById('searchContainer');
    container.classList.toggle('hidden');
    if (!container.classList.contains('hidden')) {
      document.getElementById('searchInput').focus();
    }
  }

  async handleSearch(query) {
    if (query.length < 2) {
      document.getElementById('searchResults').innerHTML = '';
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      this.displaySearchResults(data.users);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  displaySearchResults(users) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    users.forEach(user => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <img src="${user.avatar_url || 'https://via.placeholder.com/32'}" alt="${user.display_name}" class="avatar">
        <div>
          <div>${user.display_name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">@${user.username}</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        this.openChat(user);
        document.getElementById('searchContainer').classList.add('hidden');
        document.getElementById('searchInput').value = '';
      });
      
      container.appendChild(item);
    });
  }

  updateUserProfile() {
    document.getElementById('userDisplayName').textContent = this.currentUser.displayName;
    document.getElementById('userAvatar').src = this.currentUser.avatarUrl || 'https://via.placeholder.com/40';
  }

  async updateUnreadCount() {
    try {
      const response = await fetch('/api/messages/unread/count', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      const badge = document.getElementById('unreadCount');
      
      if (data.unreadCount > 0) {
        badge.textContent = data.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch (error) {
      console.error('Update unread count error:', error);
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
  }

  showError(message) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.showScreen('authScreen');
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusText(status) {
    const statusMap = {
      online: 'В сети',
      away: 'Отошел',
      busy: 'Занят',
      offline: 'Не в сети'
    };
    return statusMap[status] || 'Не в сети';
  }

  showTypingIndicator() {
    // Implement typing indicator
    setTimeout(() => {
      // Remove typing indicator after 3 seconds
    }, 3000);
  }

  updateOnlineStatus(users) {
    // Update online status in conversation list
  }

  updateUserStatus(data) {
    // Update specific user status
  }

  showSettings() {
    // Implement settings modal
    alert('Настройки в разработке');
  }
}

// Initialize the messenger
const messenger = new SecureMessenger();
