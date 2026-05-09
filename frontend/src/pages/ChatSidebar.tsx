import { Menu, Button, Input, Dropdown, Modal, message } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  MoreOutlined,
  PushpinOutlined,
  ShareAltOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { SessionResponse } from "@/types";
import { useState } from "react";
import { aiApi } from "@/api/ai";

interface ChatSidebarProps {
  sessions: SessionResponse[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onCreateSession: () => void;
  onSessionUpdate: (sessions: SessionResponse[]) => void;
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onCreateSession,
  onSessionUpdate,
}: ChatSidebarProps) {
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [currentRenameSessionId, setCurrentRenameSessionId] = useState<
    string | null
  >(null);
  const [renameTitle, setRenameTitle] = useState("");

  // 置顶会话
  const handlePinSession = async (_sessionId: string) => {
    try {
      message.info("置顶功能开发中");
    } catch (error) {
      message.error("置顶失败");
    }
  };

  // 分享会话
  const handleShareSession = async (sessionId: string) => {
    try {
      const shareUrl = `${window.location.origin}/chat?sessionId=${sessionId}`;
      await navigator.clipboard.writeText(shareUrl);
      message.success("分享链接已复制到剪贴板");
    } catch (error) {
      message.error("分享失败");
    }
  };

  // 重命名会话
  const handleRenameSession = async (sessionId: string, title: string) => {
    try {
      await aiApi.renameSession(sessionId, title);
      const updatedSessions = sessions.map((s) =>
        s.sessionId === sessionId ? { ...s, title } : s,
      );
      onSessionUpdate(updatedSessions);
      message.success("重命名成功");
    } catch (error) {
      message.error("重命名失败");
    }
  };

  // 举报会话
  const handleReportSession = async (_sessionId: string) => {
    try {
      message.info("举报功能开发中");
    } catch (error) {
      message.error("举报失败");
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个会话吗？",
      onOk: async () => {
        try {
          await aiApi.deleteSession(sessionId);
          const updatedSessions = sessions.filter(
            (s) => s.sessionId !== sessionId,
          );
          onSessionUpdate(updatedSessions);
          // 如果删除的是当前会话，切换到其他会话
          if (currentSessionId === sessionId && updatedSessions.length > 0) {
            onSessionSelect(updatedSessions[0].sessionId);
          }
          message.success("删除成功");
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const menuItems: MenuProps["items"] = sessions.map((session) => ({
    key: session.sessionId,
    icon: <MessageOutlined />,
    label: (
      <div className="session-item">
        <div className="session-title-container">
          <span className="session-title">{session.title}</span>
          <div className="session-actions">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "pin",
                    icon: <PushpinOutlined />,
                    label: "置顶",
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                      handlePinSession(session.sessionId);
                    },
                  },
                  {
                    key: "share",
                    icon: <ShareAltOutlined />,
                    label: "分享",
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                      handleShareSession(session.sessionId);
                    },
                  },
                  {
                    key: "rename",
                    icon: <EditOutlined />,
                    label: "重命名",
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                      setCurrentRenameSessionId(session.sessionId);
                      setRenameTitle(session.title);
                      setRenameModalVisible(true);
                    },
                  },
                  {
                    key: "report",
                    icon: <ExclamationCircleOutlined />,
                    label: "举报",
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                      handleReportSession(session.sessionId);
                    },
                  },
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: "删除",
                    danger: true,
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                      handleDeleteSession(session.sessionId);
                    },
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className="more-button"
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateSession}
          block
        >
          新建对话
        </Button>
      </div>
      <Menu
        mode="inline"
        selectedKeys={currentSessionId ? [currentSessionId] : []}
        items={menuItems}
        onClick={(e) => onSessionSelect(e.key)}
        className="session-menu"
      />
      <Modal
        title="重命名会话"
        open={renameModalVisible}
        onOk={() => {
          if (renameTitle.trim() && currentRenameSessionId) {
            handleRenameSession(currentRenameSessionId, renameTitle.trim());
            setRenameModalVisible(false);
            setCurrentRenameSessionId(null);
          } else {
            message.error("请输入会话标题");
          }
        }}
        onCancel={() => {
          setRenameModalVisible(false);
          setCurrentRenameSessionId(null);
        }}
      >
        <Input
          value={renameTitle}
          onChange={(e) => setRenameTitle(e.target.value)}
          placeholder="请输入会话标题"
          autoFocus
        />
      </Modal>
    </div>
  );
}
