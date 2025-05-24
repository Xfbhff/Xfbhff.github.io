window.AI_CONFIG = {
    ZHIPU_API_KEY: "91121cdaea96476aaf159802ecefba89.P4fenWkNyRyfRHqP",
    ZHIPU_API_URL: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    ZHIPU_MODEL: "glm-4v-flash"
};
document.addEventListener('DOMContentLoaded', () => {
    const aiAssistantBtn = document.getElementById('ai-assistant-btn');
    const aiAssistantChat = document.getElementById('ai-assistant-chat');
    const closeChatBtn = aiAssistantChat.querySelector('.close-btn');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // !!! 警告：直接在前端暴露API Key存在安全风险 !!!
    // !!! 生产环境强烈建议使用后端代理 !!!
    // 从全局配置中获取API信息
    const ZHIPU_API_KEY = window.AI_CONFIG.ZHIPU_API_KEY;
    const ZHIPU_API_URL = window.AI_CONFIG.ZHIPU_API_URL;
    const ZHIPU_MODEL = window.AI_CONFIG.ZHIPU_MODEL;
    // 历史消息（用于智谱AI的 \`messages\` 参数）
    let conversationHistory = [
        { "role": "assistant", "content": "你好，有什么可以帮助你的吗？" }
    ];

    // 切换聊天窗口的显示/隐藏
    aiAssistantBtn.addEventListener('click', () => {
        aiAssistantChat.classList.toggle('hidden');
    });

    closeChatBtn.addEventListener('click', () => {
        aiAssistantChat.classList.add('hidden');
    });

    // 发送消息函数
    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return;

        // 1. 显示用户消息
        appendMessage(message, 'user-message');
        userInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight; // 滚动到底部

        // 2. 将用户消息添加到历史记录
        conversationHistory.push({ "role": "user", "content": message });

        // 3. 显示一个加载指示器
        const loadingMessage = appendMessage('AI正在思考...', 'ai-message loading-indicator');
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // 4. 直接调用智谱AI API
            const response = await fetch(ZHIPU_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ZHIPU_API_KEY}` // 注意：直接暴露API Key
                        },
                        body: JSON.stringify({
                            model: ZHIPU_MODEL,
                            messages: conversationHistory
                        })
                    });

                    if (!response.ok) {
                        // 尝试解析错误响应体
                        let errorData = await response.json();
                        console.error('智谱AI API错误响应:', errorData);
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error ? errorData.error.message : '未知错误'}`);
                    }

                    const data = await response.json();
                    const aiResponseContent = data.choices[0].message.content;

                    // 5. 移除加载指示器并显示AI响应
                    loadingMessage.remove(); // 移除加载消息
                    appendMessage(aiResponseContent, 'ai-message');
                    chatMessages.scrollTop = chatMessages.scrollHeight;

                    // 6. 将AI响应添加到历史记录
                    conversationHistory.push({"role": "assistant", "content": aiResponseContent});

                } catch (error) {
                    console.error('调用智谱AI API失败:', error);
                    loadingMessage.remove(); // 移除加载消息
                    appendMessage('AI助手暂时无法响应，请稍后再试。错误: ' + error.message, 'ai-message error-message');
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            };

            // 辅助函数：添加消息到聊天窗口
            const appendMessage = (text, type) => {
                const p = document.createElement('p');
                p.className = type;
                p.textContent = text;
                chatMessages.appendChild(p);
                return p; // 返回创建的元素，以便后续操作（如移除加载指示器）
            };

            // 绑定发送事件
            sendBtn.addEventListener('click', sendMessage);
            userInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    sendMessage();
                }
            });
        });
