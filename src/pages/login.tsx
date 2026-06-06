import { useState } from "react";
import { Form, Input, Button, Card, message, Row, Col } from "antd";
import { DeploymentUnitOutlined } from "@ant-design/icons";
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
    <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex" }}>
      <Row style={{ width: "100%", margin: 0 }}>
        {/* Left Side: Diagram (Hidden on Mobile) */}
        <Col
          xs={0}
          sm={0}
          md={12}
          lg={14}
          style={{
            background: "#1a1a2e",
            backgroundImage: "url('/login-bg-soil.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.1))",
            }}
          ></div>
        </Col>

        {/* Right Side: Form */}
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={10}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            padding: 40,
          }}
        >
          <Card
            bordered={false}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 20,
              boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
            bodyStyle={{ padding: "48px 32px" }}
          >
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))",
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: 28,
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.08)",
                }}
              >
                <DeploymentUnitOutlined />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Welcome to GeoTech
              </h2>
              <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
                Please enter your credentials to access the portal
              </p>
            </div>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Username required" }]}
                style={{ marginBottom: 20 }}
              >
                <Input
                  placeholder="Email or Username"
                  size="large"
                  style={{
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 15,
                    background: "#ffffff",
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "Password required" }]}
                style={{ marginBottom: 32 }}
              >
                <Input.Password
                  placeholder="Password"
                  size="large"
                  style={{
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 15,
                    background: "#ffffff",
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{
                    background: "#8b5cf6",
                    border: "none",
                    borderRadius: 10,
                    height: 52,
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                  }}
                >
                  Continue
                </Button>
              </Form.Item>
            </Form>

            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 12,
                marginTop: 32,
                marginBottom: 0,
              }}
            >
              Secured by GeoTech Security
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
