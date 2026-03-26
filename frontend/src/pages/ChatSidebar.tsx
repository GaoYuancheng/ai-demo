import { Menu, Button } from "antd";
import { PlusOutlined, DeleteOutlined, MessageOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { SessionResponse } from "@/types";

interface ChatSidebarProps {
  sessions: SessionResponse[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onCreateSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const menuItems: MenuProps["items"] = sessions.map((session) => ({
    key: session.sessionId,
    icon: <MessageOutlined />,
    label: (
      <div className="session-item">
        <span className="session-title">{session.title}</span>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteSession(session.sessionId);
          }}
          danger
        />
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
    </div>
  );
}
