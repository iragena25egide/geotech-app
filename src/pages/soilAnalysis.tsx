import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Form,
  InputNumber,
  Button,
  Card,
  Alert,
  Space,
  message,
  Table,
  Modal,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

const { Header, Sider, Content } = Layout;

interface SoilFormValues {
  ll?: number;
  pl?: number;
  p200?: number;
  p4?: number;
  d60?: number;
  d30?: number;
  d10?: number;
}

interface SoilSample {
  id?: number;
  ll: number;
  pl: number;
  p200: number;
  p4: number;
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

/* ===============================
   USCS CLASSIFICATION FUNCTION
================================ */

function classifyUSCS(
  ll: number,
  pl: number,
  p200: number,
  p4: number,
  cu: number,
  cc: number
): { symbol: string; groupName: string } {
  const pi = ll - pl;
  const isFineGrained = p200 > 50;

  if (isFineGrained) {
    if (ll < 50) {
      if (pi > 7) return { symbol: "CL", groupName: "Lean Clay" };

      if (pi >= 4 && pi <= 7)
        return { symbol: "CL-ML", groupName: "Silty Clay" };

      return { symbol: "ML", groupName: "Silt" };
    } else {
      if (pi > 7) return { symbol: "CH", groupName: "Fat Clay" };

      return { symbol: "MH", groupName: "Elastic Silt" };
    }
  }

  const isSand = p4 > 50;

  if (isSand) {
    if (cu >= 6 && cc >= 1 && cc <= 3)
      return { symbol: "SW", groupName: "Well-Graded Sand" };

    return { symbol: "SP", groupName: "Poorly-Graded Sand" };
  }

  if (cu >= 4 && cc >= 1 && cc <= 3)
    return { symbol: "GW", groupName: "Well-Graded Gravel" };

  return {
    symbol: "GP",
    groupName: "Poorly-Graded Gravel",
  };
}

export default function SoilAnalysis() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [form] = Form.useForm();

  const [samples, setSamples] = useState<SoilSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSample, setEditingSample] = useState<SoilSample | null>(null);

  const [computed, setComputed] = useState({
    pi: null as number | null,
    cu: null as number | null,
    cc: null as number | null,
    symbol: null as string | null,
    groupName: null as string | null,
  });

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    fetchProjectName();
    fetchSamples();
  }, [projectId]);

  /* ===============================
     FETCH DATA
  ============================== */

  const fetchProjectName = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProjectName(res.data.name);
    } catch {
      message.error("Failed to load project");
      setProjectName("Unknown Project");
    }
  };

  const fetchSamples = async () => {
    setLoading(true);

    try {
      const res = await api.get(`/soil?project=${projectId}`);
      setSamples(res.data);
    } catch {
      message.error("Failed to load soil samples");
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = (_: unknown, values: SoilFormValues) => {
    const { ll, pl, p200, p4, d60, d30, d10 } = values;

    let pi: number | null = null;
    let cu: number | null = null;
    let cc: number | null = null;

    if (ll != null && pl != null) {
      pi = parseFloat((ll - pl).toFixed(2));
    }

    if (d60 != null && d30 != null && d10 != null && d10 > 0 && d60 > 0) {
      cu = parseFloat((d60 / d10).toFixed(2));

      cc = parseFloat(((d30 * d30) / (d60 * d10)).toFixed(2));
    }

    let symbol: string | null = null;
    let groupName: string | null = null;

    if (
      ll != null &&
      pl != null &&
      p200 != null &&
      p4 != null &&
      cu != null &&
      cc != null
    ) {
      const result = classifyUSCS(ll, pl, p200, p4, cu, cc);

      symbol = result.symbol;
      groupName = result.groupName;
    }

    setComputed({
      pi,
      cu,
      cc,
      symbol,
      groupName,
    });
  };

  const openAddModal = () => {
    setEditingSample(null);
    form.resetFields();

    setComputed({
      pi: null,
      cu: null,
      cc: null,
      symbol: null,
      groupName: null,
    });

    setModalVisible(true);
  };

  const openEditModal = (sample: SoilSample) => {
    setEditingSample(sample);

    form.setFieldsValue(sample);

    handleValuesChange(null, sample);

    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/soil/${id}`);

      message.success("Sample deleted successfully");

      fetchSamples();
    } catch {
      message.error("Failed to delete sample");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const payload: SoilSample = {
        projectId: Number(projectId),

        ll: values.ll,
        pl: values.pl,
        p200: values.p200,
        p4: values.p4,

        d60: values.d60,
        d30: values.d30,
        d10: values.d10,

        pi: computed.pi ?? 0,
        cu: computed.cu ?? 0,
        cc: computed.cc ?? 0,

        symbol: computed.symbol ?? "Unknown",

        groupName: computed.groupName ?? "Unknown",
      };

      if (editingSample?.id) {
        await api.put(`/soil/${editingSample.id}`, payload);

        message.success("Sample updated successfully");
      } else {
        await api.post("/soil", payload);

        message.success("Sample added successfully");
      }

      setModalVisible(false);

      fetchSamples();
    } catch {
      message.error(editingSample ? "Update failed" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: "LL", dataIndex: "ll" },
    { title: "PL", dataIndex: "pl" },
    { title: "PI", dataIndex: "pi" },
    { title: "P200", dataIndex: "p200" },
    { title: "P4", dataIndex: "p4" },
    { title: "D60", dataIndex: "d60" },
    { title: "D30", dataIndex: "d30" },
    { title: "D10", dataIndex: "d10" },
    { title: "Cu", dataIndex: "cu" },
    { title: "Cc", dataIndex: "cc" },
    { title: "USCS", dataIndex: "symbol" },
    {
      title: "Group Name",
      dataIndex: "groupName",
    },
    {
      title: "Actions",
      render: (_: unknown, record: SoilSample) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Edit
          </Button>

          <Popconfirm
            title="Delete sample?"
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ===============================
     UI
  ============================== */

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark">
        <div
          style={{
            padding: 16,
            color: "white",
            fontWeight: "bold",
          }}
        >
          GeoTech
        </div>

        <Menu theme="dark">
          <Menu.Item icon={<DashboardOutlined />} onClick={() => navigate("/")}>
            Dashboard
          </Menu.Item>

          <Menu.Item icon={<ExperimentOutlined />}>Soil Analysis</Menu.Item>

          <Menu.Item
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/report/${projectId}`)}
          >
            Report
          </Menu.Item>

          <Menu.Item icon={<LogoutOutlined />} onClick={logout}>
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: 16,
          }}
        >
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
              Back
            </Button>

            <h2>Soil Analysis — {projectName}</h2>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
          }}
        >
          <Card
            title="Soil Samples"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddModal}
              >
                Add Sample
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={samples}
              rowKey="id"
              loading={loading}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title={editingSample ? "Edit Sample" : "Add Sample"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={800}
      >
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Form.Item name="ll" label="LL" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item name="pl" label="PL" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item name="p200" label="P200" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item name="p4" label="P4" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item name="d60" label="D60" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item name="d30" label="D30" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item name="d10" label="D10" rules={[{ required: true }]}>
            <InputNumber
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          {computed.symbol && (
            <Alert
              style={{
                marginTop: 16,
              }}
              message={`USCS Classification: ${computed.symbol} — ${computed.groupName}`}
              type="info"
              showIcon
            />
          )}
        </Form>
      </Modal>
    </Layout>
  );
}
