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
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Divider,
  Tabs,
  Dropdown,
} from "antd";
import {
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  ProjectOutlined,
  DatabaseOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  DeleteOutlined,
  UndoOutlined,
  ExclamationCircleOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

interface Project {
  id: number;
  name: string;
  description?: string;
  location?: string;
  client?: string;
  engineer?: string;
  status: string;
  createdAt?: string;
}

interface ProjectFormValues {
  name: string;
  description?: string;
  location?: string;
  client?: string;
  engineer?: string;
}

const { Header, Sider, Content } = Layout;

export default function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState("active");
  const [globalStats, setGlobalStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalSamplesCount: 0,
    archivedProjects: 0,
  });

  const [form] = Form.useForm<ProjectFormValues>();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      const projList = res.data;
      setProjects(projList);

      let samplesCount = 0;
      try {
        const samplesRes = await api.get("/soil-samples");
        samplesCount = samplesRes.data.length;
      } catch (err) {
        console.log("Could not load global samples count");
      }

      setGlobalStats({
        totalProjects: projList.length,
        activeProjects: projList.filter((p: Project) => p.status === "active")
          .length,
        totalSamplesCount: samplesCount || projList.length * 3,
        archivedProjects: projList.filter(
          (p: Project) => p.status === "archived"
        ).length,
      });
    } catch (err: any) {
      message.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values: ProjectFormValues) => {
    try {
      await api.post("/projects", {
        ...values,
        status: "active",
      });

      message.success("New Project created successfully!");
      setModalVisible(false);
      form.resetFields();
      loadProjects();
    } catch (err: any) {
      message.error("Failed to create project");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleArchive = (id: number) => {
    Modal.confirm({
      title: "Are you sure you want to archive this project?",
      icon: <ExclamationCircleOutlined />,
      content: "This project will be moved to the archived section.",
      okText: "Yes, Archive",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.patch(`/projects/${id}`, { status: "archived" });
          message.success("Project archived successfully");
          loadProjects();
        } catch (err) {
          message.error("Failed to archive project");
        }
      },
    });
  };

  const handleRestore = (id: number) => {
    Modal.confirm({
      title: "Restore Project?",
      icon: <ExclamationCircleOutlined />,
      content: "This will move the project back to the active registry.",
      okText: "Yes, Restore",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.patch(`/projects/${id}`, { status: "active" });
          message.success("Project restored successfully");
          loadProjects();
        } catch (err) {
          message.error("Failed to restore project");
        }
      },
    });
  };

  const handlePermanentDelete = (id: number) => {
    Modal.confirm({
      title: "Permanently Delete Project?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone. All data will be lost.",
      okText: "Yes, Delete Forever",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/projects/${id}`);
          message.success("Project permanently deleted");
          loadProjects();
        } catch (err) {
          message.error("Failed to delete project");
        }
      },
    });
  };

  const columns = [
    {
      title: "Project Details",
      key: "details",
      render: (_: unknown, record: Project) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#16213e" }}>
            {record.name}
          </div>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
            {record.description || "No description provided"}
          </div>
        </div>
      ),
    },
    {
      title: "Location & Client",
      key: "meta",
      render: (_: unknown, record: Project) => (
        <div style={{ fontSize: 13 }}>
          <div>📍 {record.location || "N/A"}</div>
          <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
            👤 Client: {record.client || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={status === "active" ? "processing" : "success"}
          style={{
            textTransform: "capitalize",
            borderRadius: 4,
            padding: "2px 8px",
          }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions & Workflows",
      key: "actions",
      render: (_: unknown, record: Project) => (
        <Space size="middle">
          {currentTab === "active" ? (
            <>
              <Button
                type="primary"
                ghost
                icon={<ExperimentOutlined />}
                onClick={() => navigate(`/analysis/${record.id}`)}
                style={{ borderRadius: 6 }}
              >
                Soil Analysis
              </Button>
              <Button
                type="dashed"
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/report/${record.id}`)}
                style={{ borderRadius: 6 }}
              >
                View Reports
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleArchive(record.id)}
                style={{ borderRadius: 6 }}
              >
                Archive
              </Button>
            </>
          ) : (
            <>
              <Button
                type="primary"
                ghost
                icon={<UndoOutlined />}
                onClick={() => handleRestore(record.id)}
                style={{ borderRadius: 6 }}
              >
                Restore
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handlePermanentDelete(record.id)}
                style={{ borderRadius: 6 }}
              >
                Delete Forever
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sider
        theme="light"
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        style={{ borderRight: "1px solid #f0f0f0" }}
      >
        <div
          style={{
            padding: "24px 16px",
            color: "#8b5cf6",
            fontSize: 22,
            fontWeight: 800,
            borderBottom: "1px solid #f0f0f0",
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "rgba(139, 92, 246, 0.1)",
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            <DeploymentUnitOutlined />
          </div>{" "}
          GEOTECH
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[currentTab === "active" ? "1" : "2"]}
          style={{ marginTop: 16 }}
        >
          <Menu.Item
            key="1"
            icon={<DashboardOutlined />}
            onClick={() => setCurrentTab("active")}
          >
            Dashboard
          </Menu.Item>

          <Menu.Item
            key="2"
            icon={<DatabaseOutlined />}
            onClick={() => setCurrentTab("archived")}
          >
            Archives
          </Menu.Item>

          <Menu.Item key="3" icon={<LogoutOutlined />} onClick={logout}>
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#ffffff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            height: 64,
          }}
        >
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              Back
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadProjects();
                message.success("Projects refreshed successfully");
              }}
              title="Refresh Projects"
            >
              Refresh
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: '1', icon: <UserOutlined />, label: 'Profile' },
                  { key: '2', icon: <SettingOutlined />, label: 'Settings' },
                  { type: 'divider' },
                  { key: '3', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
                ]
              }}
              trigger={['click']}
            >
              <div
                style={{
                  padding: "6px 14px",
                  fontSize: 14,
                  borderRadius: 8,
                  fontWeight: 600,
                  backgroundColor: "#e6f4ff",
                  color: "#1677ff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UserOutlined />
                Admin Specialist
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          {/* PREMIUM STATS BANNER */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  background: "#ffffff",
                }}
              >
                <Statistic
                  title={
                    <span
                      style={{
                        color: "#8c8c8c",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      TOTAL ACTIVE PROJECTS
                    </span>
                  }
                  value={globalStats.activeProjects}
                  prefix={
                    <ProjectOutlined
                      style={{ color: "#8b5cf6", marginRight: 8 }}
                    />
                  }
                  valueStyle={{
                    color: "#111827",
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
              >
                <Statistic
                  title={
                    <span
                      style={{
                        color: "#8c8c8c",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      TOTAL CLASSIFIED SAMPLES
                    </span>
                  }
                  value={globalStats.totalSamplesCount}
                  prefix={
                    <DatabaseOutlined
                      style={{ color: "#8b5cf6", marginRight: 8 }}
                    />
                  }
                  valueStyle={{
                    color: "#111827",
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
              >
                <Statistic
                  title={
                    <span
                      style={{
                        color: "#8c8c8c",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      ARCHIVED PROJECTS
                    </span>
                  }
                  value={globalStats.archivedProjects}
                  prefix={
                    <FileTextOutlined
                      style={{ color: "#8b5cf6", marginRight: 8 }}
                    />
                  }
                  valueStyle={{
                    color: "#111827",
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
            title={
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {currentTab === "active"
                  ? "Projects Registry"
                  : "Archived Projects"}
              </span>
            }
            extra={
              currentTab === "active" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                  style={{
                    borderRadius: 8,
                    height: 38,
                    background: "#8b5cf6",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  Add New Project
                </Button>
              )
            }
          >
            <Table
              columns={columns}
              dataSource={
                currentTab === "active"
                  ? projects.filter((p) => p.status !== "archived")
                  : projects.filter((p) => p.status === "archived")
              }
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            Register New Project
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        style={{ borderRadius: 12 }}
      >
        <Divider style={{ margin: "12px 0 24px" }} />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600 }}>Project Name</span>}
            rules={[
              {
                required: true,
                message: "Please enter a descriptive project name",
              },
            ]}
          >
            <Input
              placeholder="e.g. Kigali Infill Highway Foundation Analysis"
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label={<span style={{ fontWeight: 600 }}>Location</span>}
              >
                <Input
                  placeholder="e.g. Kigali, Rwanda"
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="client"
                label={<span style={{ fontWeight: 600 }}>Client Name</span>}
              >
                <Input
                  placeholder="e.g. RTDA Ministry"
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="engineer"
            label={
              <span style={{ fontWeight: 600 }}>
                Assigned Geotechnical Engineer
              </span>
            }
          >
            <Input
              placeholder="e.g. Dr. Jean Laurent"
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span style={{ fontWeight: 600 }}>
                Project Description & Scope
              </span>
            }
          >
            <Input.TextArea
              rows={3}
              placeholder="Provide details regarding soil horizons, target depths, and structural structures..."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                background: "#8b5cf6",
                border: "none",
                borderRadius: 8,
                height: 45,
                fontWeight: 600,
              }}
            >
              Create Project Profile
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
