import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f6fa",
      }}
    >
      <h1 style={{ fontSize: 72, fontWeight: 700, color: "#1890ff" }}>404</h1>
      <h2 style={{ fontWeight: 500, color: "#333" }}>Page Not Found</h2>
      <Button
        type="primary"
        style={{ marginTop: 24 }}
        onClick={() => navigate("/")}
      >
        Go to Dashboard
      </Button>
    </div>
  );
}
