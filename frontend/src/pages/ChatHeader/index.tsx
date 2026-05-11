import { Dropdown, Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

interface ChatHeaderProps {
  title: string;
  models: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ChatHeader({
  title,
  models,
  selectedModel,
  onModelChange,
}: ChatHeaderProps) {
  const modelMenuItems: MenuProps["items"] = models.map((model) => ({
    key: model,
    label: model,
  }));

  const handleModelChange: MenuProps["onClick"] = (e) => {
    onModelChange(e.key);
  };

  return (
    <div className="chat-header">
      <h2 className="chat-title">{title}</h2>
      {models.length > 0 && (
        <Dropdown
          menu={{ items: modelMenuItems, onClick: handleModelChange }}
          placement="bottomRight"
        >
          <Button icon={<SettingOutlined />}>{selectedModel}</Button>
        </Dropdown>
      )}
    </div>
  );
}
