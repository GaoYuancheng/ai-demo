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
}

interface ChatMessage {
  id: string;
  content: string;
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
        role: "assistant",
      };
    }

    if (chunk.content) {
      return {
        id: originMessage?.id || `msg-${Date.now()}`,
        content: `${originMessage?.content || ""}${chunk.content}`,
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
                    controller.enqueue(json);
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
