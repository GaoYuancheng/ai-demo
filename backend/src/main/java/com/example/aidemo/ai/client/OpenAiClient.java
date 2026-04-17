package com.example.aidemo.ai.client;

import com.example.aidemo.ai.config.AiProperties;
import com.example.aidemo.ai.dto.MessageDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * OpenAI API客户端
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiClient {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    public JsonNode chat(String message, List<MessageDto> history, String model, Object tools) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiProperties.getApiKey());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model != null ? model : aiProperties.getDefaultModel());
            requestBody.put("messages", buildMessages(message, history));
            requestBody.put("max_tokens", aiProperties.getMaxTokens());
            requestBody.put("temperature", aiProperties.getTemperature());
            requestBody.put("stream", false);

            // 添加工具信息
            if (tools != null) {
                requestBody.put("tools", tools);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    aiProperties.getBaseUrl() + "/chat/completions",
                    HttpMethod.POST,
                    request,
                    JsonNode.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }

            return null;
        } catch (Exception e) {
            log.error("调用AI服务失败", e);
            return null;
        }
    }

    public void chatStream(String message, List<MessageDto> history, String model, Object tools,
            Consumer<String> onChunk) {
        HttpURLConnection connection = null;
        BufferedReader reader = null;

        try {
            URL url = new URL(aiProperties.getBaseUrl() + "/chat/completions");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + aiProperties.getApiKey());
            connection.setDoOutput(true);
            connection.setConnectTimeout(aiProperties.getTimeout());
            connection.setReadTimeout(aiProperties.getTimeout());

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model != null ? model : aiProperties.getDefaultModel());
            requestBody.put("max_tokens", aiProperties.getMaxTokens());
            requestBody.put("temperature", aiProperties.getTemperature());
            requestBody.put("stream", true);
            requestBody.set("messages", objectMapper.valueToTree(buildMessages(message, history)));

            // 添加工具信息
            if (tools != null) {
                requestBody.set("tools", objectMapper.valueToTree(tools));
            }

            connection.getOutputStream().write(objectMapper.writeValueAsBytes(requestBody));
            connection.getOutputStream().flush();

            reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
            String line;

            while ((line = reader.readLine()) != null) {
                // 直接将原始数据传递给客户端，不做任何处理
                onChunk.accept(line + "\n");
            }
        } catch (Exception e) {
            log.error("流式调用AI服务失败", e);
            onChunk.accept("\n[错误] AI服务调用失败: " + e.getMessage());
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (Exception e) {
                    log.error("关闭reader失败", e);
                }
            }
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private List<Map<String, Object>> buildMessages(String message, List<MessageDto> history) {
        List<Map<String, Object>> messages = new ArrayList<>();

        if (history != null) {
            for (MessageDto msg : history) {
                Map<String, Object> msgMap = new HashMap<>();
                msgMap.put("role", msg.getRole());
                msgMap.put("content", msg.getContent());
                messages.add(msgMap);
            }
        }

        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", message);
        messages.add(userMessage);

        return messages;
    }

    /**
     * 处理工具调用后的第二次模型调用（流式）
     * @param message 用户消息
     * @param history 历史消息
     * @param model 模型名称
     * @param tools 工具列表
     * @param toolResults 工具执行结果
     * @param onChunk 流式回调
     */
    public void chatStreamWithToolResults(String message, List<MessageDto> history, String model, Object tools,
            Object toolResults, Consumer<String> onChunk) {
        HttpURLConnection connection = null;
        BufferedReader reader = null;

        try {
            URL url = new URL(aiProperties.getBaseUrl() + "/chat/completions");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + aiProperties.getApiKey());
            connection.setDoOutput(true);
            connection.setConnectTimeout(aiProperties.getTimeout());
            connection.setReadTimeout(aiProperties.getTimeout());

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model != null ? model : aiProperties.getDefaultModel());
            requestBody.put("max_tokens", aiProperties.getMaxTokens());
            requestBody.put("temperature", aiProperties.getTemperature());
            requestBody.put("stream", true);
            
            // 构建消息列表，包含工具执行结果
            List<Map<String, Object>> messages = buildMessagesWithToolResults(message, history, toolResults);
            requestBody.set("messages", objectMapper.valueToTree(messages));

            // 添加工具信息
            if (tools != null) {
                requestBody.set("tools", objectMapper.valueToTree(tools));
            }

            connection.getOutputStream().write(objectMapper.writeValueAsBytes(requestBody));
            connection.getOutputStream().flush();

            reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
            String line;

            while ((line = reader.readLine()) != null) {
                // 直接将原始数据传递给客户端，不做任何处理
                onChunk.accept(line + "\n");
            }
        } catch (Exception e) {
            log.error("流式调用AI服务失败", e);
            onChunk.accept("\n[错误] AI服务调用失败: " + e.getMessage());
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (Exception e) {
                    log.error("关闭reader失败", e);
                }
            }
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * 构建包含工具执行结果的消息列表
     * @param message 用户消息
     * @param history 历史消息
     * @param toolResults 工具执行结果
     * @return 消息列表
     */
    private List<Map<String, Object>> buildMessagesWithToolResults(String message, List<MessageDto> history, 
            Object toolResults) {
        List<Map<String, Object>> messages = new ArrayList<>();

        // 添加历史消息
        if (history != null) {
            for (MessageDto msg : history) {
                Map<String, Object> msgMap = new HashMap<>();
                msgMap.put("role", msg.getRole());
                msgMap.put("content", msg.getContent());
                messages.add(msgMap);
            }
        }

        // 添加用户消息
        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", message);
        messages.add(userMessage);

        // 添加工具执行结果
        if (toolResults instanceof List) {
            List<?> toolResultList = (List<?>) toolResults;
            for (Object toolResult : toolResultList) {
                if (toolResult instanceof Map) {
                    Map<?, ?> toolResultMap = (Map<?, ?>) toolResult;
                    Map<String, Object> toolMessage = new HashMap<>();
                    toolMessage.put("role", toolResultMap.get("role"));
                    toolMessage.put("tool_call_id", toolResultMap.get("tool_call_id"));
                    toolMessage.put("content", toolResultMap.get("content"));
                    messages.add(toolMessage);
                }
            }
        }

        return messages;
    }

    /**
     * 处理工具调用后的第二次模型调用
     */
    public JsonNode chatWithTools(List<Map<String, Object>> messages, String model, Object tools) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiProperties.getApiKey());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model != null ? model : aiProperties.getDefaultModel());
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", aiProperties.getMaxTokens());
            requestBody.put("temperature", aiProperties.getTemperature());
            requestBody.put("stream", false);

            // 添加工具信息
            if (tools != null) {
                requestBody.put("tools", tools);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    aiProperties.getBaseUrl() + "/chat/completions",
                    HttpMethod.POST,
                    request,
                    JsonNode.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }

            return null;
        } catch (Exception e) {
            log.error("调用AI服务失败", e);
            return null;
        }
    }
}
