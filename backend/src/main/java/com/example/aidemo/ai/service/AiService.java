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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * AI服务类
 * 提供AI会话管理、消息处理和与AI模型交互的核心功能
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiSessionMapper sessionMapper; // 会话数据访问对象
    private final AiMessageMapper messageMapper; // 消息数据访问对象
    private final OpenAiClient openAiClient; // OpenAI客户端
    private final AiProperties aiProperties; // AI配置属性
    private final ObjectMapper objectMapper; // JSON对象映射器

    /**
     * 创建新会话
     * 
     * @param userId  用户ID
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

        return new SessionResponse(session.getSessionId(), session.getTitle(), session.getCreateTime(),
                session.getUpdateTime());
    }

    /**
     * 获取用户的会话列表
     * 
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
     * 
     * @param userId    用户ID
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
                .map(m -> new MessageDto(m.getRole(), m.getContent(), m.getReasoningContent(), m.getCreateTime()))
                .collect(Collectors.toList());

        return new ChatHistoryResponse(session.getSessionId(), session.getTitle(), messageDtos);
    }

    /**
     * 删除会话
     * 
     * @param userId    用户ID
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
     * 判断是否需要工具调用（第一次调用，非流式，不入库）
     * 
     * @param userId  用户ID
     * @param request 聊天请求
     * @return 工具检查响应对象
     */
    public ToolCheckResponse checkTools(Long userId, ChatRequest request) {
        String sessionId = request.getSessionId();

        // 获取历史消息（不入库）
        List<MessageDto> history = new ArrayList<>();
        if (sessionId != null && !sessionId.isEmpty()) {
            history = getMessageHistory(sessionId);
        }

        // 调用AI模型，判断是否需要工具调用
        com.fasterxml.jackson.databind.JsonNode response = openAiClient.chat(request.getMessage(), history,
                request.getModel(), request.getTools());

        ToolCheckResponse toolCheckResponse = new ToolCheckResponse();
        toolCheckResponse.setNeedsTools(false);

        if (response != null) {
            com.fasterxml.jackson.databind.JsonNode choices = response.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                com.fasterxml.jackson.databind.JsonNode message = choices.get(0).path("message");

                // 检查是否有工具调用指令
                com.fasterxml.jackson.databind.JsonNode toolCalls = message.path("tool_calls");
                if (toolCalls.isArray() && toolCalls.size() > 0) {
                    toolCheckResponse.setNeedsTools(true);
                    toolCheckResponse.setToolCalls(toolCalls);
                } else {
                    // 不需要工具调用，返回内容
                    toolCheckResponse.setContent(message.path("content").asText(""));
                }
            }
        }

        return toolCheckResponse;
    }

    /**
     * 与AI进行聊天
     * 
     * @param userId  用户ID
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

        saveMessage(sessionId, "user", request.getMessage(), null);

        List<MessageDto> history = getMessageHistory(sessionId);

        // 调用AI模型，支持工具调用
        com.fasterxml.jackson.databind.JsonNode response = openAiClient.chat(request.getMessage(), history,
                request.getModel(), request.getTools());

        String aiReply = "";
        String reasoningContent = "";
        if (response != null) {
            com.fasterxml.jackson.databind.JsonNode choices = response.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                com.fasterxml.jackson.databind.JsonNode message = choices.get(0).path("message");
                aiReply = message.path("content").asText("");
                reasoningContent = message.path("reasoning_content").asText("");

                // 检查是否有工具调用指令
                com.fasterxml.jackson.databind.JsonNode toolCalls = message.path("tool_calls");
                if (toolCalls.isArray() && toolCalls.size() > 0) {
                    // 这里可以处理工具调用，但由于我们在Node.js BFF层已经处理了工具调用，
                    // 这里直接返回响应，让BFF层处理工具调用逻辑
                }
            }
        }

        saveMessage(sessionId, "assistant", aiReply, reasoningContent);

        updateSessionTime(sessionId);

        return new ChatResponse(sessionId, "req_" + System.currentTimeMillis(), aiReply, LocalDateTime.now());
    }

    /**
     * 处理工具调用后的第二次模型调用
     * 
     * @param messages 完整的消息列表
     * @param model    模型名称
     * @param tools    工具列表
     * @return AI模型响应
     */
    public com.fasterxml.jackson.databind.JsonNode chatWithTools(List<Map<String, Object>> messages, String model,
            Object tools) {
        return openAiClient.chatWithTools(messages, model, tools);
    }

    /**
     * 与AI进行流式聊天（第二次调用，入库）
     * 
     * @param userId  用户ID
     * @param request 聊天请求（包含工具执行结果）
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

        saveMessage(sessionId, "user", request.getMessage(), null);

        List<MessageDto> history = getMessageHistory(sessionId);

        StringBuilder fullReply = new StringBuilder();
        StringBuilder fullReasoning = new StringBuilder();

        // 如果有工具执行结果，添加到消息历史中
        if (request.getToolResults() != null) {
            openAiClient.chatStreamWithToolResults(request.getMessage(), history, request.getModel(),
                    request.getTools(), request.getToolResults(), chunk -> {
                        // 解析SSE数据，提取content和reasoning_content
                        if (chunk.startsWith("data: ")) {
                            String data = chunk.substring(6).trim();
                            if (!data.equals("[DONE]")) {
                                try {
                                    JsonNode json = objectMapper.readTree(data);
                                    JsonNode choices = json.path("choices");
                                    if (choices.isArray() && choices.size() > 0) {
                                        JsonNode delta = choices.get(0).path("delta");
                                        JsonNode contentNode = delta.get("content");
                                        JsonNode reasoningNode = delta.get("reasoning_content");

                                        if (contentNode != null && !contentNode.isNull()) {
                                            String content = contentNode.asText();
                                            if (content != null && !content.isEmpty()) {
                                                fullReply.append(content);
                                            }
                                        }
                                        if (reasoningNode != null && !reasoningNode.isNull()) {
                                            String reasoningContent = reasoningNode.asText();
                                            if (reasoningContent != null && !reasoningContent.isEmpty()) {
                                                fullReasoning.append(reasoningContent);
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                    log.error("解析SSE数据失败", e);
                                }
                            }
                        }
                        // 将原始数据传递给客户端
                        onChunk.accept(chunk);
                    });
        } else {
            openAiClient.chatStream(request.getMessage(), history, request.getModel(), request.getTools(), chunk -> {
                // 解析SSE数据，提取content和reasoning_content
                if (chunk.startsWith("data: ")) {
                    String data = chunk.substring(6).trim();
                    if (!data.equals("[DONE]")) {
                        try {
                            JsonNode json = objectMapper.readTree(data);
                            JsonNode choices = json.path("choices");
                            if (choices.isArray() && choices.size() > 0) {
                                JsonNode delta = choices.get(0).path("delta");
                                JsonNode contentNode = delta.get("content");
                                JsonNode reasoningNode = delta.get("reasoning_content");

                                if (contentNode != null && !contentNode.isNull()) {
                                    String content = contentNode.asText();
                                    if (content != null && !content.isEmpty()) {
                                        fullReply.append(content);
                                    }
                                }
                                if (reasoningNode != null && !reasoningNode.isNull()) {
                                    String reasoningContent = reasoningNode.asText();
                                    if (reasoningContent != null && !reasoningContent.isEmpty()) {
                                        fullReasoning.append(reasoningContent);
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("解析SSE数据失败", e);
                        }
                    }
                }
                // 将原始数据传递给客户端
                onChunk.accept(chunk);
            });
        }

        saveMessage(sessionId, "assistant", fullReply.toString(), fullReasoning.toString());

        updateSessionTime(sessionId);
    }

    /**
     * 重命名会话
     * 
     * @param userId    用户ID
     * @param sessionId 会话ID
     * @param title     新标题
     * @throws BusinessException 当会话不存在时抛出
     */
    @Transactional
    public void renameSession(Long userId, String sessionId, String title) {
        AiSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "会话不存在");
        }

        session.setTitle(title);
        session.setUpdateTime(LocalDateTime.now());
        sessionMapper.updateById(session);
    }

    /**
     * 获取AI配置
     * 
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
     * 
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
     * 
     * @param sessionId        会话ID
     * @param role             角色（user或assistant）
     * @param content          消息内容
     * @param reasoningContent 思考内容
     */
    private void saveMessage(String sessionId, String role, String content, String reasoningContent) {
        AiMessage message = new AiMessage();
        message.setSessionId(sessionId);
        message.setRole(role);
        message.setContent(content);
        message.setReasoningContent(reasoningContent);
        message.setCreateTime(LocalDateTime.now());
        messageMapper.insert(message);
    }

    /**
     * 获取消息历史的私有方法
     * 
     * @param sessionId 会话ID
     * @return 消息DTO列表
     */
    private List<MessageDto> getMessageHistory(String sessionId) {
        LambdaQueryWrapper<AiMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiMessage::getSessionId, sessionId)
                .orderByAsc(AiMessage::getCreateTime);

        List<AiMessage> messages = messageMapper.selectList(wrapper);

        return messages.stream()
                .map(m -> new MessageDto(m.getRole(), m.getContent(), m.getReasoningContent(), m.getCreateTime()))
                .collect(Collectors.toList());
    }

    /**
     * 更新会话时间的私有方法
     * 
     * @param sessionId 会话ID
     */
    private void updateSessionTime(String sessionId) {
        AiSession session = new AiSession();
        session.setSessionId(sessionId);
        session.setUpdateTime(LocalDateTime.now());
        sessionMapper.updateById(session);
    }
}
