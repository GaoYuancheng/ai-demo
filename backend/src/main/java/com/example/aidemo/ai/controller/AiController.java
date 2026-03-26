package com.example.aidemo.ai.controller;

import com.example.aidemo.ai.dto.*;
import com.example.aidemo.ai.service.AiService;
import com.example.aidemo.common.Result;
import com.example.aidemo.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * AI控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Object chat(@CurrentUser Long userId, @Valid @RequestBody ChatRequest request) {
        log.info("Chat request: userId={}, sessionId={}, message={}", userId, request.getSessionId(), request.getMessage());

        if (Boolean.TRUE.equals(request.getStream())) {
            return createSseEmitter(userId, request);
        }

        ChatResponse response = aiService.chat(userId, request);
        return Result.success(response);
    }

    private SseEmitter createSseEmitter(Long userId, ChatRequest request) {
        SseEmitter emitter = new SseEmitter(60000L);

        executorService.execute(() -> {
            try {
                String sessionId = request.getSessionId();
                if (sessionId != null && !sessionId.isEmpty()) {
                    emitter.send(SseEmitter.event()
                            .data("{\"sessionId\":\"" + sessionId + "\"}"));
                }

                aiService.chatStream(userId, request, chunk -> {
                    try {
                        String jsonChunk = escapeJson(chunk);
                        emitter.send(SseEmitter.event()
                                .data("{\"content\":\"" + jsonChunk + "\"}"));
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                });

                emitter.send(SseEmitter.event().data("{\"done\":true}"));
                emitter.complete();
            } catch (Exception e) {
                log.error("SSE error", e);
                try {
                    String errorMsg = escapeJson(e.getMessage() != null ? e.getMessage() : "Unknown error");
                    emitter.send(SseEmitter.event().data("{\"error\":\"" + errorMsg + "\"}"));
                } catch (IOException ex) {
                    log.error("Failed to send error", ex);
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    @PostMapping("/session/create")
    public Result<SessionResponse> createSession(@CurrentUser Long userId,
                                                  @RequestBody(required = false) CreateSessionRequest request) {
        if (request == null) {
            request = new CreateSessionRequest();
        }
        SessionResponse response = aiService.createSession(userId, request);
        return Result.success("创建成功", response);
    }

    @GetMapping("/session/list")
    public Result<List<SessionResponse>> getSessionList(@CurrentUser Long userId) {
        List<SessionResponse> response = aiService.getSessionList(userId);
        return Result.success(response);
    }

    @GetMapping("/chat/history")
    public Result<ChatHistoryResponse> getChatHistory(@CurrentUser Long userId,
                                                       @RequestParam String sessionId) {
        ChatHistoryResponse response = aiService.getChatHistory(userId, sessionId);
        return Result.success(response);
    }

    @DeleteMapping("/session/{sessionId}")
    public Result<Void> deleteSession(@CurrentUser Long userId,
                                       @PathVariable String sessionId) {
        aiService.deleteSession(userId, sessionId);
        return Result.success("删除成功", null);
    }

    @GetMapping("/config")
    public Result<AiConfigResponse> getConfig() {
        AiConfigResponse response = aiService.getConfig();
        return Result.success(response);
    }
}
