import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Table,
  Button,
  Card,
  Space,
  message,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  Input,
  List,
  Popconfirm,
  Badge,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

interface SoilSample {
  id?: number;
  ll: number;
  pl: number;
  p200: number;
  p4: number;
  p40: number;
  p10: number;
  d60: number;
  d30: number;
  d10: number;
  pi: number;
  cu: number;
  cc: number;
  symbol: string;
  groupName: string;
  projectId: number;
}

interface ServerReport {
  id: number;
  title: string;
  description?: string;
  reportType: string;
  filePath?: string;
  fileUrl?: string;
  status: string; // draft, approved
  generatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  reviewComments?: string;
  reportVersion: number;
  projectId: number;
  content?: {
    summary?: string;
    conclusions?: string[];
    recommendations?: string[];
  };
  statistics?: {
    totalSamples?: number;
    averageLL?: number;
    averagePL?: number;
    averagePI?: number;
  };
}

export default function Report() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [samples, setSamples] = useState<SoilSample[]>([]);
  const [reports, setReports] = useState<ServerReport[]>([]);

  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [form] = Form.useForm();

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedReportForApproval, setSelectedReportForApproval] =
    useState<ServerReport | null>(null);
  const [approvalForm] = Form.useForm();

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [samplesRes, projectRes, reportsRes] = await Promise.all([
        api.get(`/soil-samples?projectId=${projectId}`),
        api.get(`/projects/${projectId}`),
        api.get(`/reports?projectId=${projectId}`),
      ]);
      setSamples(samplesRes.data);
      setProjectName(projectRes.data.name);
      setReports(reportsRes.data);
    } catch (err) {
      message.error("Failed to load report workspace data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (values: any) => {
    if (samples.length === 0) {
      message.warning(
        "You must have at least one soil sample in this project to generate a report."
      );
      return;
    }

    setGeneratingReport(true);
    try {
      // Calculate Atterberg statistics
      const total = samples.length;
      const avgLL = samples.reduce((s, x) => s + Number(x.ll), 0) / total;
      const avgPL = samples.reduce((s, x) => s + Number(x.pl), 0) / total;
      const avgPI = samples.reduce((s, x) => s + Number(x.pi), 0) / total;

      const payload = {
        title: values.title,
        status: "draft",
        projectId: Number(projectId),
        reportVersion: 1,
        approvedBy: values.approvedBy || "Senior Geotechnical Engineer",
        content: {
          summary: values.summary,
          conclusions: values.conclusions
            .split("\n")
            .filter((l: string) => l.trim().length > 0),
          recommendations: values.recommendations
            .split("\n")
            .filter((l: string) => l.trim().length > 0),
        },
        statistics: {
          totalSamples: total,
          averageLL: avgLL,
          averagePL: avgPL,
          averagePI: avgPI,
        },
      };

      await api.post("/reports", payload);
      message.success(
        "Official Geotechnical PDF Report generated successfully!"
      );
      setCreateModalVisible(false);
      form.resetFields();

      const res = await api.get(`/reports?projectId=${projectId}`);
      setReports(res.data);
    } catch (err) {
      message.error("Failed to generate official report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadPdf = (reportId: number) => {
    const downloadUrl = `http://localhost:3000/reports/${reportId}/download`;
    window.open(downloadUrl, "_blank");
    message.info("Initiating server-side Geotechnical PDF download...");
  };

  const handleApproveReportSubmit = async (values: any) => {
    if (!selectedReportForApproval) return;

    try {
      await api.patch(`/reports/${selectedReportForApproval.id}`, {
        status: "approved",
        approvedBy: values.approvedBy,
        reviewComments: values.reviewComments,
        approvedAt: new Date(),
      });

      message.success("Report approved successfully!");
      setApproveModalVisible(false);
      approvalForm.resetFields();

      const res = await api.get(`/reports?projectId=${projectId}`);
      setReports(res.data);
    } catch {
      message.error("Failed to approve report");
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      await api.delete(`/reports/${reportId}`);
      message.success("Report deleted successfully");
      setReports(reports.filter((r) => r.id !== reportId));
    } catch {
      message.error("Failed to delete report record");
    }
  };

  const fillDefaultTemplates = () => {
    const total = samples.length;
    const avgLL = total
      ? (samples.reduce((s, x) => s + Number(x.ll), 0) / total).toFixed(1)
      : "0";
    const avgPI = total
      ? (samples.reduce((s, x) => s + Number(x.pi), 0) / total).toFixed(1)
      : "0";

    form.setFieldsValue({
      title: `Atterberg Soil Characterization Report — ${projectName}`,
      approvedBy: "Dr. Jean Laurent, P.E.",
      summary: `This formal report outlines Atterberg limit classifications and subgrade suitability calculations for project "${projectName}". A total of ${total} soil samples were laboratory analyzed. The testing indicates an average Liquid Limit of ${avgLL}% and an average Plasticity Index of ${avgPI}%, categorizing the active stratum domain as cohesive subgrade materials requiring strict compaction control.`,
      conclusions: `Physical limits indicate moderate plasticity and medium swelling potential.\nSand-to-clay boundaries match target structural subgrade parameters.\nParticle distributions represent cohesive clay particles with high water-holding values.`,
      recommendations: `Chemical Lime stabilization (4-6% by mass) is recommended for CL/CH clay boundaries to limit expansion indices.\nCompaction must target minimum 98% Proctor Dry Density under strict moisture criteria.\nProvide adequate site drainage to protect structural subgrade from water pooling.`,
    });
  };

  const reportColumns = [
    {
      title: "Report Title & Version",
      key: "title",
      render: (_: unknown, record: ServerReport) => (
        <div>
          <div style={{ fontWeight: 600, color: "#16213e" }}>
            {record.title}
          </div>
          <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
            Version:{" "}
            <Tag color="blue" style={{ fontSize: 10, lineHeight: "14px" }}>
              v{record.reportVersion}.0
            </Tag>{" "}
            | Created:{" "}
            {record.generatedAt
              ? new Date(record.generatedAt).toLocaleDateString()
              : "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Testing Stats",
      key: "stats",
      render: (_: unknown, record: ServerReport) => (
        <span style={{ fontSize: 12 }}>
          Samples: <strong>{record.statistics?.totalSamples || 0}</strong>{" "}
          &nbsp;|&nbsp; Avg LL:{" "}
          <strong>
            {record.statistics?.averageLL
              ? Number(record.statistics.averageLL).toFixed(1)
              : "—"}
            %
          </strong>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={status === "approved" ? "success" : "warning"}
          style={{ textTransform: "uppercase", fontWeight: "bold" }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Approved By",
      dataIndex: "approvedBy",
      key: "approvedBy",
      render: (val: string, record: ServerReport) => (
        <div style={{ fontSize: 12.5 }}>
          {record.status === "approved" ? `✅ ${val}` : `⏳ ${val} (Pending)`}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: ServerReport) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPdf(record.id)}
            style={{ borderRadius: 4 }}
          >
            Download PDF
          </Button>

          {record.status !== "approved" && (
            <Button
              type="dashed"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedReportForApproval(record);
                approvalForm.setFieldsValue({ approvedBy: record.approvedBy });
                setApproveModalVisible(true);
              }}
              style={{ borderRadius: 4 }}
            >
              Approve
            </Button>
          )}

          <Popconfirm
            title="Delete this report?"
            onConfirm={() => handleDeleteReport(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ borderRadius: 4 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sider theme="dark" width={220}>
        <div
          style={{
            padding: "24px 16px",
            color: "white",
            fontWeight: 800,
            fontSize: 18,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            letterSpacing: 0.5,
          }}
        >
          🌍 GEOTECH
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["3"]}
          style={{ marginTop: 16 }}
        >
          <Menu.Item
            key="1"
            icon={<DashboardOutlined />}
            onClick={() => navigate("/")}
          >
            Dashboard
          </Menu.Item>
          <Menu.Item
            key="2"
            icon={<ExperimentOutlined />}
            onClick={() => navigate(`/analysis/${projectId}`)}
          >
            Soil Analysis
          </Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />}>
            Reports Manager
          </Menu.Item>
          <Menu.Item key="4" icon={<LogoutOutlined />} onClick={logout}>
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <div
          style={{
            background: "#ffffff",
            padding: "16px 24px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 64,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            style={{ borderRadius: 6 }}
          >
            Back
          </Button>
          <h2
            style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111" }}
          >
            Geotechnical Reports Registry —{" "}
            <span style={{ color: "#1890ff" }}>{projectName}</span>
          </h2>
        </div>

        <Content style={{ margin: 24 }}>
          <Card
            title={
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                Official Engineering Reports
              </span>
            }
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateModalVisible(true);
                  // Auto fill values as default template
                  setTimeout(() => fillDefaultTemplates(), 100);
                }}
                style={{
                  borderRadius: 6,
                  background: "#0f3460",
                  border: "none",
                }}
              >
                Compile New Report
              </Button>
            }
          >
            <Table
              columns={reportColumns}
              dataSource={reports}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 6 }}
            />
            {reports.length === 0 && !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#8c8c8c",
                }}
              >
                <FileTextOutlined
                  style={{ fontSize: 40, color: "#bfbfbf", marginBottom: 12 }}
                />
                <p style={{ margin: 0 }}>
                  No engineering reports have been compiled yet for this
                  project.
                </p>
                <p style={{ fontSize: 12, color: "#bfbfbf", marginTop: 4 }}>
                  Click "Compile New Report" to construct a high-fidelity
                  geotechnical document.
                </p>
              </div>
            )}
          </Card>
        </Content>
      </Layout>

      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            Compile Official Geotechnical PDF
          </span>
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Divider style={{ margin: "10px 0 20px" }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateReport}
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="title"
                label={
                  <span style={{ fontWeight: 600 }}>Report Document Title</span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <Input
                  placeholder="e.g. Subgrade Bearing Suitability Report"
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="approvedBy"
                label={
                  <span style={{ fontWeight: 600 }}>
                    Approving Senior Engineer
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <Input
                  placeholder="e.g. Dr. Jean Laurent"
                  size="large"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label={
              <span style={{ fontWeight: 600 }}>
                Executive Document Summary
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe the geotechnical investigation, drilling details, and general subsoil conditions..."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="conclusions"
            label={
              <span style={{ fontWeight: 600 }}>
                Atterberg Conclusions (One per line)
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="1. Swelling limits indicate medium plasticity index.\n2. In-situ densities represent robust subsoil horizons."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="recommendations"
            label={
              <span style={{ fontWeight: 600 }}>
                Geotechnical Recommendations (One per line)
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="1. Lime treatment is requested for clayey boundaries.\n2. Foundation loads must match standard shallow footing shear."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            style={{
              marginTop: 24,
              marginBottom: 8,
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Space>
              <Button
                onClick={() => fillDefaultTemplates()}
                style={{ borderRadius: 6 }}
              >
                Auto-generate Template
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={generatingReport}
                style={{
                  background: "#0f3460",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Compile & Print PDF
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* APPROVE REPORT MODAL */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: 17 }}>
            Approve Laboratory Soil Report
          </span>
        }
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Divider style={{ margin: "10px 0 20px" }} />
        <Form
          form={approvalForm}
          layout="vertical"
          onFinish={handleApproveReportSubmit}
        >
          <Form.Item
            name="approvedBy"
            label={
              <span style={{ fontWeight: 600 }}>
                Signing Geotechnical Engineer
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              placeholder="e.g. Dr. Jean Laurent, P.E."
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="reviewComments"
            label={
              <span style={{ fontWeight: 600 }}>
                Engineering Review Comments / Authorization
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Lab results match standards. Approved for subgrade construction release."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 20, marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                background: "#2e7d32",
                border: "none",
                borderRadius: 8,
                height: 42,
                fontWeight: 600,
              }}
            >
              Sign & Release Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
