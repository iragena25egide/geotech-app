import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { AxiosError } from "axios";
import { api } from "../../services/api";

interface Props {
  onLogin: () => void;
}

interface LoginValues {
  email: string;
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

      console.log("LOGIN RESPONSE:", res.data);

      // Store token
      localStorage.setItem("token", res.data.access_token);

      message.success("Login successful");

      // Trigger parent login handler
      onLogin();
    } catch (err: unknown) {
      let errorMessage = "Invalid email or password";

      if (err instanceof AxiosError) {
        const data = err.response?.data as ErrorResponse;

        console.log("LOGIN ERROR:", data);

        if (data?.message) {
          errorMessage = data.message;
        }
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <div className="flex justify-center mb-6">
          <img src="/icon.jpeg" alt="GeoTech" className="w-16 h-16" />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          GeoTech
        </h2>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please input your email!",
              },
              {
                type: "email",
                message: "Please enter a valid email!",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="you@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <p className="text-center text-gray-400 text-sm mt-4">
          &copy; {new Date().getFullYear()} GeoTech Soil Analysis
        </p>
      </Card>
    </div>
  );
}
