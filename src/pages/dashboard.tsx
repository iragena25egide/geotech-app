import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
} from "antd";
import {
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

interface ProjectFormValues {
  name: string;
  description?: string;
}

const { Header, Sider, Content } = Layout;

export default function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [form] = Form.useForm<ProjectFormValues>();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);

    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err: unknown) {
      message.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values: ProjectFormValues) => {
    try {
      await api.post("/projects", values);

      message.success("Project created");

      setModalVisible(false);
      form.resetFields();

      loadProjects();
    } catch (err: unknown) {
      message.error("Failed to create project");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<ExperimentOutlined />}
            onClick={() => navigate(`/analysis/${record.id}`)}
          >
            Add Sample
          </Button>

          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/report/${record.id}`)}
          >
            View Report
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark">
        <div
          style={{
            padding: 16,
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          GeoTech
        </div>

        <Menu theme="dark" mode="inline">
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>

          <Menu.Item key="2" icon={<LogoutOutlined />} onClick={logout}>
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
          }}
        >
          <h2 style={{ margin: 0 }}>Welcome to GeoTech</h2>
        </Header>

        <Content style={{ margin: 24 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{ marginBottom: 16 }}
          >
            New Project
          </Button>

          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
            loading={loading}
          />
        </Content>
      </Layout>

      <Modal
        title="Create New Project"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              {
                required: true,
                message: "Please enter project name",
              },
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
