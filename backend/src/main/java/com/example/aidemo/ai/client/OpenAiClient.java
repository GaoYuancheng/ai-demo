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

    public String chat(String message, List<MessageDto> history, String model) {
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

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    aiProperties.getBaseUrl() + "/chat/completions",
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode choices = response.getBody().path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    return choices.get(0).path("message").path("content").asText();
                }
            }

            return "AI服务响应异常";
        } catch (Exception e) {
            log.error("调用AI服务失败", e);
            return "AI服务调用失败: " + e.getMessage();
        }
    }

    public void chatStream(String message, List<MessageDto> history, String model, Consumer<String> onChunk) {
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

            connection.getOutputStream().write(objectMapper.writeValueAsBytes(requestBody));
            connection.getOutputStream().flush();

            reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data: ")) {
                    String data = line.substring(6);
                    if ("[DONE]".equals(data)) {
                        break;
                    }

                    JsonNode jsonNode = objectMapper.readTree(data);
                    JsonNode choices = jsonNode.path("choices");
                    if (choices.isArray() && choices.size() > 0) {
                        JsonNode delta = choices.get(0).path("delta");
                        String content = delta.path("content").asText("");
                        if (!content.isEmpty()) {
                            onChunk.accept(content);
                        }
                    }
                }
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

    private List<Map<String, String>> buildMessages(String message, List<MessageDto> history) {
        List<Map<String, String>> messages = new ArrayList<>();

        if (history != null) {
            for (MessageDto msg : history) {
                Map<String, String> msgMap = new HashMap<>();
                msgMap.put("role", msg.getRole());
                msgMap.put("content", msg.getContent());
                messages.add(msgMap);
            }
        }

        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", message);
        messages.add(userMessage);

        return messages;
    }
}
