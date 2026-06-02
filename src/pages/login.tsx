import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { AxiosError } from "axios";
import { api } from "../../services/api";

interface Props {
  onLogin: () => void;
}

interface LoginValues {
  username: string;
  password: string;
}

interface ErrorResponse {
  message?: string;
}

export default function Login({ onLogin }: Props) {
  const [loading, setLoading] = useState<boolean>(false);

  const onFinish = async (values: LoginValues) => {
    setLoading(true);

    try {
      const res = await api.post("/auth/login", values);

      localStorage.setItem("token", res.data.access_token);

      message.success("Login successful");

      onLogin();
    } catch (err: unknown) {
      let errorMessage = "Invalid username or password";

      if (err instanceof AxiosError) {
        const data = err.response?.data as ErrorResponse;

        if (data?.message) {
          errorMessage = Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message;
        }
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.97)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1890ff, #0050b3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 28,
            }}
          >
            🌍
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#1a1a2e",
            }}
          >
            GeoTech
          </h2>
          <p style={{ margin: "4px 0 0", color: "#8c8c8c", fontSize: 14 }}>
            Soil Analysis Platform
          </p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter your username!" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="geotech@admin"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                background: "linear-gradient(135deg, #1890ff, #0050b3)",
                border: "none",
                borderRadius: 8,
                height: 48,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <p
          style={{
            textAlign: "center",
            color: "#bfbfbf",
            fontSize: 12,
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          © {new Date().getFullYear()} GeoTech Soil Analysis
        </p>
      </Card>
    </div>
  );
}
