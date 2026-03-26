import { GetRef, Modal, message } from "antd";
import { Bubble, Sender } from "@ant-design/x";
import { useXChat } from "@ant-design/x-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { aiApi } from "@/api/ai";
import { SessionResponse, MessageDto, AiConfigResponse } from "@/types";
import {
  createAiChatProvider,
  ChatMessage,
  ChatInput,
  ChatOutput,
} from "@/providers/AiChatProvider";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import "./ChatPage.css";

export default function ChatPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<AiConfigResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-3.5-turbo");
  const [loading, setLoading] = useState(false);

  const provider = useMemo(() => createAiChatProvider(), [token]);

  const senderZhRef = useRef<GetRef<typeof Sender>>(null);

  const { messages, onRequest, isRequesting, abort, setMessages } = useXChat<
    ChatMessage,
    ChatMessage,
    ChatInput,
    ChatOutput
  >({
    provider,
    requestPlaceholder: {
      id: `placeholder-${Date.now()}`,
      content: "正在思考中...",
      role: "assistant",
      status: "loading",
    },
    requestFallback: (_, { error }) => {
      if (error.name === "AbortError") {
        return {
          id: `fallback-${Date.now()}`,
          content: "已取消回复",
          role: "assistant" as const,
          status: "error",
        };
      }
      return {
        id: `fallback-${Date.now()}`,
        content: error.message || "网络异常，请稍后重试",
        role: "assistant" as const,
        status: "error",
      };
    },
  });

  useEffect(() => {
    loadSessions();
    loadConfig();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadChatHistory(currentSessionId);
      provider.setSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const data = await aiApi.getSessionList();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].sessionId);
      }
    } catch (error) {
      message.error("加载会话列表失败");
    }
  };

  const loadConfig = async () => {
    try {
      const data = await aiApi.getConfig();
      setConfig(data);
      if (data.modelList.length > 0) {
        setSelectedModel(data.modelList[0]);
      }
    } catch (error) {
      console.error("加载配置失败", error);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    setLoading(true);
    try {
      const data = await aiApi.getChatHistory(sessionId);
      const formattedMessages = data.messages.map(
        (msg: MessageDto, index: number) => ({
          id: `msg-${index}`,
          message: {
            id: `msg-${index}`,
            content: msg.content,
            role: msg.role as "user" | "assistant",
            status: "success" as const,
          },
          status: "success" as const,
        }),
      );
      setMessages(formattedMessages);
    } catch (error) {
      message.error("加载历史消息失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const session = await aiApi.createSession();
      setSessions([session, ...sessions]);
      setCurrentSessionId(session.sessionId);
      provider.clearSession();
      setMessages([]);
    } catch (error) {
      message.error("创建会话失败");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个会话吗？",
      onOk: async () => {
        try {
          await aiApi.deleteSession(sessionId);
          setSessions(sessions.filter((s) => s.sessionId !== sessionId));
          if (currentSessionId === sessionId) {
            const newCurrentId =
              sessions.length > 1
                ? sessions.find((s) => s.sessionId !== sessionId)?.sessionId ||
                  null
                : null;
            setCurrentSessionId(newCurrentId);
            provider.clearSession();
            setMessages([]);
          }
          message.success("删除成功");
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      onRequest({
        message: content.trim(),
        model: selectedModel,
        sessionId: currentSessionId || undefined,
      });
      senderZhRef.current?.clear();
    },
    [onRequest, selectedModel, currentSessionId],
  );

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const items = messages.map((msg) => ({
    key: msg.id,
    role: msg.message.role,
    placement:
      msg.message.role === "user" ? ("end" as const) : ("start" as const),
    typing: msg.status === "loading",
    content: msg.message.content,
    avatar: msg.message.role === "assistant" ? "🤖" : undefined,
    styles: {
      content: {
        backgroundColor: msg.message.role === "user" ? "#1677ff" : "#f5f5f5",
        color: msg.message.role === "user" ? "#fff" : "#333",
      },
    },
  }));

  return (
    <div className="chat-page">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
      />
      <div className="chat-main">
        <ChatHeader
          title={
            sessions.find((s) => s.sessionId === currentSessionId)?.title ||
            "AI 对话"
          }
          models={config?.modelList || []}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
        <div className="chat-content">
          {loading ? (
            <div className="chat-loading">
              <span>加载中...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <span>开始新的对话吧</span>
            </div>
          ) : (
            <Bubble.List items={items} />
          )}
        </div>
        <div className="chat-input">
          <Sender
            ref={senderZhRef}
            onSubmit={handleSendMessage}
            loading={isRequesting}
            onCancel={abort}
            placeholder="输入消息..."
          />
        </div>
      </div>
    </div>
  );
}
