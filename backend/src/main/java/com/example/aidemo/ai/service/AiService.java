package com.example.aidemo.ai.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aidemo.ai.client.OpenAiClient;
import com.example.aidemo.ai.config.AiProperties;
import com.example.aidemo.ai.dto.*;
import com.example.aidemo.ai.entity.AiMessage;
import com.example.aidemo.ai.entity.AiSession;
import com.example.aidemo.ai.mapper.AiMessageMapper;
import com.example.aidemo.ai.mapper.AiSessionMapper;
import com.example.aidemo.common.BusinessException;
import com.example.aidemo.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * AI服务类
 * 提供AI会话管理、消息处理和与AI模型交互的核心功能
 */
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiSessionMapper sessionMapper;     // 会话数据访问对象
    private final AiMessageMapper messageMapper;     // 消息数据访问对象
    private final OpenAiClient openAiClient;         // OpenAI客户端
    private final AiProperties aiProperties;         // AI配置属性

    /**
     * 创建新会话
     * @param userId 用户ID
     * @param request 创建会话请求
     * @return 会话响应对象
     */
    @Transactional
    public SessionResponse createSession(Long userId, CreateSessionRequest request) {
        AiSession session = new AiSession();
        session.setSessionId("s_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        session.setUserId(userId);
        session.setTitle(request.getTitle());
        session.setCreateTime(LocalDateTime.now());
        session.setUpdateTime(LocalDateTime.now());
        session.setDeleted(0);

        sessionMapper.insert(session);

        return new SessionResponse(session.getSessionId(), session.getTitle(), session.getCreateTime(), session.getUpdateTime());
    }

    /**
     * 获取用户的会话列表
     * @param userId 用户ID
     * @return 会话响应列表
     */
    public List<SessionResponse> getSessionList(Long userId) {
        LambdaQueryWrapper<AiSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiSession::getUserId, userId)
                .orderByDesc(AiSession::getUpdateTime);

        List<AiSession> sessions = sessionMapper.selectList(wrapper);

        return sessions.stream()
                .map(s -> new SessionResponse(s.getSessionId(), s.getTitle(), s.getCreateTime(), s.getUpdateTime()))
                .collect(Collectors.toList());
    }

    /**
     * 获取聊天历史
     * @param userId 用户ID
     * @param sessionId 会话ID
     * @return 聊天历史响应对象
     * @throws BusinessException 当会话不存在时抛出
     */
    public ChatHistoryResponse getChatHistory(Long userId, String sessionId) {
        AiSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "会话不存在");
        }

        LambdaQueryWrapper<AiMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiMessage::getSessionId, sessionId)
                .orderByAsc(AiMessage::getCreateTime);

        List<AiMessage> messages = messageMapper.selectList(wrapper);

        List<MessageDto> messageDtos = messages.stream()
                .map(m -> new MessageDto(m.getRole(), m.getContent(), m.getCreateTime()))
                .collect(Collectors.toList());

        return new ChatHistoryResponse(session.getSessionId(), session.getTitle(), messageDtos);
    }

    /**
     * 删除会话
     * @param userId 用户ID
     * @param sessionId 会话ID
     * @throws BusinessException 当会话不存在时抛出
     */
    @Transactional
    public void deleteSession(Long userId, String sessionId) {
        AiSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "会话不存在");
        }

        sessionMapper.deleteById(sessionId);

        LambdaQueryWrapper<AiMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiMessage::getSessionId, sessionId);
        messageMapper.delete(wrapper);
    }

    /**
     * 与AI进行聊天
     * @param userId 用户ID
     * @param request 聊天请求
     * @return 聊天响应对象
     * @throws BusinessException 当会话不存在时抛出
     */
    @Transactional
    public ChatResponse chat(Long userId, ChatRequest request) {
        String sessionId = request.getSessionId();
        AiSession session;

        if (sessionId == null || sessionId.isEmpty()) {
            session = createNewSession(userId);
            sessionId = session.getSessionId();
        } else {
            session = sessionMapper.selectById(sessionId);
            if (session == null || !session.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "会话不存在");
            }
        }

        saveMessage(sessionId, "user", request.getMessage());

        List<MessageDto> history = getMessageHistory(sessionId);

        String aiReply = openAiClient.chat(request.getMessage(), history, request.getModel());

        saveMessage(sessionId, "assistant", aiReply);

        updateSessionTime(sessionId);

        return new ChatResponse(sessionId, "req_" + System.currentTimeMillis(), aiReply, LocalDateTime.now());
    }

    /**
     * 与AI进行流式聊天
     * @param userId 用户ID
     * @param request 聊天请求
     * @param onChunk 流式回调函数
     * @throws BusinessException 当会话不存在时抛出
     */
    @Transactional
    public void chatStream(Long userId, ChatRequest request, Consumer<String> onChunk) {
        String sessionId = request.getSessionId();
        AiSession session;

        if (sessionId == null || sessionId.isEmpty()) {
            session = createNewSession(userId);
            sessionId = session.getSessionId();
        } else {
            session = sessionMapper.selectById(sessionId);
            if (session == null || !session.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "会话不存在");
            }
        }

        saveMessage(sessionId, "user", request.getMessage());

        List<MessageDto> history = getMessageHistory(sessionId);

        StringBuilder fullReply = new StringBuilder();

        openAiClient.chatStream(request.getMessage(), history, request.getModel(), chunk -> {
            fullReply.append(chunk);
            onChunk.accept(chunk);
        });

        saveMessage(sessionId, "assistant", fullReply.toString());

        updateSessionTime(sessionId);
    }

    /**
     * 获取AI配置
     * @return AI配置响应对象
     */
    public AiConfigResponse getConfig() {
        AiConfigResponse response = new AiConfigResponse();
        response.setModelList(aiProperties.getModelList());
        response.setMaxTokens(aiProperties.getMaxTokens());
        response.setTemperature(aiProperties.getTemperature());
        return response;
    }

    /**
     * 创建新会话的私有方法
     * @param userId 用户ID
     * @return 创建的会话对象
     */
    private AiSession createNewSession(Long userId) {
        AiSession session = new AiSession();
        session.setSessionId("s_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        session.setUserId(userId);
        session.setTitle("新对话");
        session.setCreateTime(LocalDateTime.now());
        session.setUpdateTime(LocalDateTime.now());
        session.setDeleted(0);
        sessionMapper.insert(session);
        return session;
    }

    /**
     * 保存消息的私有方法
     * @param sessionId 会话ID
     * @param role 角色（user或assistant）
     * @param content 消息内容
     */
    private void saveMessage(String sessionId, String role, String content) {
        AiMessage message = new AiMessage();
        message.setSessionId(sessionId);
        message.setRole(role);
        message.setContent(content);
        message.setCreateTime(LocalDateTime.now());
        messageMapper.insert(message);
    }

    /**
     * 获取消息历史的私有方法
     * @param sessionId 会话ID
     * @return 消息DTO列表
     */
    private List<MessageDto> getMessageHistory(String sessionId) {
        LambdaQueryWrapper<AiMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiMessage::getSessionId, sessionId)
                .orderByAsc(AiMessage::getCreateTime);

        List<AiMessage> messages = messageMapper.selectList(wrapper);

        return messages.stream()
                .map(m -> new MessageDto(m.getRole(), m.getContent(), m.getCreateTime()))
                .collect(Collectors.toList());
    }

    /**
     * 更新会话时间的私有方法
     * @param sessionId 会话ID
     */
    private void updateSessionTime(String sessionId) {
        AiSession session = new AiSession();
        session.setSessionId(sessionId);
        session.setUpdateTime(LocalDateTime.now());
        sessionMapper.updateById(session);
    }
}
