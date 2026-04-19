import {
  AbstractChatProvider,
  XRequest,
  TransformMessage,
} from "@ant-design/x-sdk";

interface ChatInput {
  message: string;
  sessionId?: string;
  model?: string;
  stream?: boolean;
}

interface ChatOutput {
  sessionId?: string;
  content?: string;
  done?: boolean;
  error?: string;
  tool_call_id?: string;
  role?: string;
  name?: string;
  reasoning_content?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  reasoningContent?: string;
  role: "user" | "assistant";
  sessionId?: string;
  status: "loading" | "success" | "error";
  createTime?: string;
}

const getToken = (): string => {
  return localStorage.getItem("token") || "";
};

export class AiChatProvider extends AbstractChatProvider<
  ChatMessage,
  ChatInput,
  ChatOutput
> {
  private currentSessionId: string | undefined;

  transformParams(requestParams: Partial<ChatInput>): ChatInput {
    if (typeof requestParams !== "object") {
      throw new Error("requestParams must be an object");
    }

    return {
      message: requestParams.message || "",
      sessionId: this.currentSessionId || requestParams.sessionId,
      model: requestParams.model || "gpt-3.5-turbo",
      stream: true,
    };
  }

  transformLocalMessage(requestParams: Partial<ChatInput>): ChatMessage {
    return {
      id: `msg-${Date.now()}`,
      content: requestParams.message || "",
      role: "user",
      status: "success",
      createTime: new Date().toISOString(),
    };
  }

  transformMessage(
    info: TransformMessage<ChatMessage, ChatOutput>,
  ): ChatMessage {
    const { originMessage, chunk } = info;

    if (!chunk) {
      return (
        originMessage || {
          id: `msg-${Date.now()}`,
          content: "",
          role: "assistant",
          status: "loading",
        }
      );
    }

    if (chunk.sessionId) {
      this.currentSessionId = chunk.sessionId;
    }

    if (chunk.error) {
      return {
        id: originMessage?.id || `msg-${Date.now()}`,
        status: "error",
        content: chunk.error,
        role: "assistant",
      };
    }

    if (chunk.done) {
      return {
        id: originMessage?.id || `msg-${Date.now()}`,
        status: "success",
        content: originMessage?.content || "",
        reasoningContent: originMessage?.reasoningContent || "",
        role: "assistant",
      };
    }

    if (chunk.content || chunk.reasoning_content) {
      const content =
        (originMessage?.content || "") + (chunk.content?.trim() || "");
      const reasoningContent = chunk.reasoning_content
        ? (originMessage?.reasoningContent || "") +
          (chunk.reasoning_content?.trim() || "")
        : originMessage?.reasoningContent || "";
      return {
        id: originMessage?.id || `msg-${Date.now()}`,
        content: content,
        reasoningContent: reasoningContent,
        role: "assistant",
        status: "loading",
        sessionId: this.currentSessionId,
      };
    }

    // 处理工具调用的响应
    if (chunk.role === "tool" && chunk.content) {
      const toolContent =
        typeof chunk.content === "object"
          ? JSON.stringify(chunk.content)
          : chunk.content;
      return {
        id: originMessage?.id || `msg-${Date.now()}`,
        content: `${originMessage?.content || ""}[工具执行结果] ${toolContent}`,
        role: "assistant",
        status: "loading",
        sessionId: this.currentSessionId,
      };
    }

    return (
      originMessage || {
        id: `msg-${Date.now()}`,
        content: "",
        role: "assistant",
        status: "loading",
      }
    );
  }

  setSessionId(sessionId: string | undefined) {
    this.currentSessionId = sessionId;
  }

  getSessionId() {
    return this.currentSessionId;
  }

  clearSession() {
    this.currentSessionId = undefined;
  }
}

export const createAiChatProvider = () => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const provider = new AiChatProvider({
    request: XRequest("/api/v1/ai/chat", {
      headers,
      manual: true,
      transformStream: () => {
        const decoder = new TextDecoder();
        let buffer = "";

        return new TransformStream({
          transform(chunk, controller) {
            const text =
              typeof chunk === "string"
                ? chunk
                : decoder.decode(chunk as Uint8Array, { stream: true });
            buffer += text;
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data:")) {
                const jsonStr = line.substring(5).trim();
                if (jsonStr && jsonStr !== "[DONE]") {
                  try {
                    const json = JSON.parse(jsonStr);
                    // 检查是否是嵌套的SSE数据
                    if (json.content && json.content.startsWith("data: ")) {
                      // 处理嵌套的SSE数据
                      const nestedLines = json.content.split("\n");
                      for (const nestedLine of nestedLines) {
                        if (nestedLine.startsWith("data:")) {
                          const nestedJsonStr = nestedLine.substring(5).trim();
                          if (nestedJsonStr && nestedJsonStr !== "[DONE]") {
                            try {
                              const nestedJson = JSON.parse(nestedJsonStr);
                              if (
                                nestedJson.choices &&
                                nestedJson.choices.length > 0
                              ) {
                                const choice = nestedJson.choices[0];

                                if (
                                  choice.delta &&
                                  (choice.delta.content ||
                                    choice.delta.reasoning_content)
                                ) {
                                  controller.enqueue({
                                    content: choice.delta.content?.trim(),
                                    reasoning_content:
                                      choice.delta.reasoning_content?.trim(),
                                  });
                                }
                              }
                            } catch (e) {
                              console.error(
                                "Failed to parse nested SSE data:",
                                nestedJsonStr,
                                e,
                              );
                            }
                          }
                        }
                      }
                    } else {
                      controller.enqueue(json);
                    }
                  } catch (e) {
                    console.error("Failed to parse SSE data:", jsonStr, e);
                  }
                }
              } else if (line.trim()) {
                try {
                  const json = JSON.parse(line);
                  controller.enqueue(json);
                } catch (e) {
                  // ignore parse error
                }
              }
            }
          },
        });
      },
    }),
  });

  return provider;
};

export type { ChatMessage, ChatInput, ChatOutput };
