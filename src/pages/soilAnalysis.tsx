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
  Row,
  Col,
  Tag,
  Tabs,
  Slider,
  Statistic,
  Divider,
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
  CalculatorOutlined,
  DotChartOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

const { Sider, Content } = Layout;

interface SoilFormValues {
  ll?: number;
  pl?: number;
  p200?: number;
  p4?: number;
  p40?: number;
  p10?: number;
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

function classifyUSCS(
  ll: number,
  pl: number,
  p200: number,
  p4: number,
  cu: number,
  cc: number
) {
  const pi = ll - pl;
  if (p200 > 50) {
    if (ll < 50) {
      if (pi > 7) return { symbol: "CL", groupName: "Lean Clay" };
      if (pi >= 4 && pi <= 7)
        return { symbol: "CL-ML", groupName: "Silty Clay" };
      return { symbol: "ML", groupName: "Silt" };
    }
    if (pi > 7) return { symbol: "CH", groupName: "Fat Clay" };
    return { symbol: "MH", groupName: "Elastic Silt" };
  }
  if (p4 > 50) {
    if (cu >= 6 && cc >= 1 && cc <= 3)
      return { symbol: "SW", groupName: "Well-Graded Sand" };
    return { symbol: "SP", groupName: "Poorly-Graded Sand" };
  }
  if (cu >= 4 && cc >= 1 && cc <= 3)
    return { symbol: "GW", groupName: "Well-Graded Gravel" };
  return { symbol: "GP", groupName: "Poorly-Graded Gravel" };
}

const USCS_COLORS: Record<string, string> = {
  CL: "#e94560",
  "CL-ML": "#f57c00",
  ML: "#fbc02d",
  CH: "#c2185b",
  MH: "#7b1fa2",
  SW: "#2e7d32",
  SP: "#4caf50",
  GW: "#1565c0",
  GP: "#00acc1",
};

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

  // Stabilization Calculator state
  const [selectedCalcSample, setSelectedCalcSample] =
    useState<SoilSample | null>(null);
  const [soilWeight, setSoilWeight] = useState<number>(1000); // kg
  const [stabilizerType, setStabilizerType] = useState<"cement" | "lime">(
    "cement"
  );
  const [stabilizerPercent, setStabilizerPercent] = useState<number>(5);

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

  const fetchProjectName = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProjectName(res.data.name);
    } catch {
      setProjectName("Unknown Project");
    }
  };

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/soil-samples?projectId=${projectId}`);
      setSamples(res.data);
      if (res.data.length > 0) {
        setSelectedCalcSample(res.data[0]);
      }
    } catch {
      message.error("Failed to load soil samples");
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = (_: unknown, values: SoilFormValues) => {
    const { ll, pl, p200, p4, d60, d30, d10 } = values;
    let pi: number | null = null,
      cu: number | null = null,
      cc: number | null = null;
    if (ll != null && pl != null) pi = parseFloat((ll - pl).toFixed(2));
    if (d60 != null && d30 != null && d10 != null && d10 > 0 && d60 > 0) {
      cu = parseFloat((d60 / d10).toFixed(2));
      cc = parseFloat(((d30 * d30) / (d60 * d10)).toFixed(2));
    }
    let symbol: string | null = null,
      groupName: string | null = null;
    if (
      ll != null &&
      pl != null &&
      p200 != null &&
      p4 != null &&
      cu != null &&
      cc != null
    ) {
      const r = classifyUSCS(ll, pl, p200, p4, cu, cc);
      symbol = r.symbol;
      groupName = r.groupName;
    }
    setComputed({ pi, cu, cc, symbol, groupName });
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
      await api.delete(`/soil-samples/${id}`);
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
        p40: values.p40,
        p10: values.p10,
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
        await api.patch(`/soil-samples/${editingSample.id}`, payload);
        message.success("Soil sample updated successfully");
      } else {
        await api.post("/soil-samples", payload);
        message.success("Soil sample added successfully");
      }
      setModalVisible(false);
      fetchSamples();
    } catch {
      message.error(editingSample ? "Update failed" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Dynamic SVG Atterberg limits chart coordinate mapping
  const width = 500;
  const height = 300;
  const mapX = (ll: number) => 40 + ((ll - 0) / 100) * (width - 60);
  const mapY = (pi: number) => height - 30 - ((pi - 0) / 60) * (height - 50);

  const columns = [
    { title: "LL (%)", dataIndex: "ll", key: "ll" },
    { title: "PL (%)", dataIndex: "pl", key: "pl" },
    { title: "PI (%)", dataIndex: "pi", key: "pi" },
    { title: "P200 (%)", dataIndex: "p200", key: "p200" },
    { title: "P4 (%)", dataIndex: "p4", key: "p4" },
    { title: "P40 (%)", dataIndex: "p40", key: "p40" },
    { title: "P10 (%)", dataIndex: "p10", key: "p10" },
    { title: "Cu", dataIndex: "cu", key: "cu" },
    { title: "Cc", dataIndex: "cc", key: "cc" },
    {
      title: "USCS Class",
      dataIndex: "symbol",
      key: "symbol",
      render: (s: string) => (
        <Tag
          color={USCS_COLORS[s] ? "magenta" : "default"}
          style={{
            background: USCS_COLORS[s],
            color: "#fff",
            border: "none",
            fontWeight: 600,
          }}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_: unknown, record: SoilSample) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this sample?"
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
          <Button
            size="small"
            type="dashed"
            icon={<CalculatorOutlined />}
            onClick={() => {
              setSelectedCalcSample(record);
              const isClay = ["CL", "CH", "CL-ML"].includes(record.symbol);
              setStabilizerType(isClay ? "lime" : "cement");
              setStabilizerPercent(isClay ? 6 : 4);
            }}
          >
            Stabilizer
          </Button>
        </Space>
      ),
    },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
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
          defaultSelectedKeys={["2"]}
          style={{ marginTop: 16 }}
        >
          <Menu.Item
            key="1"
            icon={<DashboardOutlined />}
            onClick={() => navigate("/")}
          >
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<ExperimentOutlined />}>
            Soil Analysis
          </Menu.Item>
          <Menu.Item
            key="3"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/report/${projectId}`)}
          >
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
            Soil Characterization Workspace —{" "}
            <span style={{ color: "#1890ff" }}>{projectName}</span>
          </h2>
        </div>

        <Content style={{ margin: 24 }}>
          <Tabs
            defaultActiveKey="1"
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <Tabs.TabPane
              tab={
                <span>
                  <ExperimentOutlined />
                  Laboratory Samples
                </span>
              }
              key="1"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  Soil Quality Registry
                </span>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openAddModal}
                  style={{
                    borderRadius: 6,
                    background: "#0f3460",
                    border: "none",
                  }}
                >
                  Add Lab Sample
                </Button>
              </div>
              <Table
                columns={columns}
                dataSource={samples}
                rowKey="id"
                loading={loading}
                scroll={{ x: true }}
                pagination={{ pageSize: 8 }}
              />
            </Tabs.TabPane>

            {/* INTERACTIVE PLASTICITY A-LINE CHART */}
            <Tabs.TabPane
              tab={
                <span>
                  <DotChartOutlined />
                  Interactive Plasticity Chart
                </span>
              }
              key="2"
            >
              <Row gutter={24}>
                <Col span={14}>
                  <Card
                    title={
                      <span style={{ fontWeight: 600 }}>
                        Atterberg Plasticity Chart (USCS Classification)
                      </span>
                    }
                    bordered={false}
                    style={{ background: "#fafafa" }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <svg
                        width={width}
                        height={height}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e8e8e8",
                          borderRadius: 8,
                          boxShadow: "inset 0 0 10px rgba(0,0,0,0.02)",
                        }}
                      >
                        {/* Grids and Axes */}
                        <line
                          x1={40}
                          y1={height - 30}
                          x2={width - 20}
                          y2={height - 30}
                          stroke="#8c8c8c"
                          strokeWidth={1.5}
                        />
                        <line
                          x1={40}
                          y1={20}
                          x2={40}
                          y2={height - 30}
                          stroke="#8c8c8c"
                          strokeWidth={1.5}
                        />

                        {/* X-Axis labels (Liquid Limit) */}
                        {[0, 20, 40, 50, 60, 80, 100].map((val) => (
                          <g key={val}>
                            <line
                              x1={mapX(val)}
                              y1={height - 30}
                              x2={mapX(val)}
                              y2={height - 25}
                              stroke="#8c8c8c"
                            />
                            <text
                              x={mapX(val)}
                              y={height - 10}
                              fontSize={9}
                              textAnchor="middle"
                              fill="#555"
                            >
                              {val}
                            </text>
                          </g>
                        ))}
                        <text
                          x={width / 2 + 10}
                          y={height - 2}
                          fontSize={10}
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#333"
                        >
                          Liquid Limit — LL (%)
                        </text>

                        {/* Y-Axis labels (Plasticity Index) */}
                        {[0, 10, 20, 30, 40, 50, 60].map((val) => (
                          <g key={val}>
                            <line
                              x1={35}
                              y1={mapY(val)}
                              x2={40}
                              y2={mapY(val)}
                              stroke="#8c8c8c"
                            />
                            <text
                              x={28}
                              y={mapY(val) + 3}
                              fontSize={9}
                              textAnchor="end"
                              fill="#555"
                            >
                              {val}
                            </text>
                          </g>
                        ))}
                        <text
                          x={12}
                          y={height / 2 - 10}
                          fontSize={10}
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#333"
                          transform={`rotate(-90 12 ${height / 2 - 10})`}
                        >
                          Plasticity Index — PI (%)
                        </text>

                        <line
                          x1={mapX(20)}
                          y1={mapY(0)}
                          x2={mapX(100)}
                          y2={mapY(0.73 * (100 - 20))}
                          stroke="#1890ff"
                          strokeWidth={2}
                          strokeDasharray="4,4"
                        />
                        <text
                          x={mapX(85)}
                          y={mapY(0.73 * (85 - 20)) - 10}
                          fontSize={9}
                          fontWeight="bold"
                          fill="#1890ff"
                          transform={`rotate(-22 ${mapX(85)} ${
                            mapY(0.73 * (85 - 20)) - 10
                          })`}
                        >
                          A-Line (PI = 0.73 * [LL - 20])
                        </text>

                        <line
                          x1={mapX(8)}
                          y1={mapY(0)}
                          x2={mapX(75)}
                          y2={mapY(0.9 * (75 - 8))}
                          stroke="#ff4d4f"
                          strokeWidth={1}
                          strokeDasharray="2,2"
                        />
                        <text
                          x={mapX(55)}
                          y={mapY(0.9 * (55 - 8)) - 10}
                          fontSize={8.5}
                          fill="#ff4d4f"
                          transform={`rotate(-28 ${mapX(55)} ${
                            mapY(0.9 * (55 - 8)) - 10
                          })`}
                        >
                          U-Line
                        </text>

                        <line
                          x1={mapX(50)}
                          y1={mapY(0)}
                          x2={mapX(50)}
                          y2={mapY(60)}
                          stroke="#8c8c8c"
                          strokeWidth={1}
                          strokeDasharray="3,3"
                        />
                        <text
                          x={mapX(50) - 8}
                          y={40}
                          fontSize={8.5}
                          fill="#777"
                          transform={`rotate(-90 ${mapX(50) - 8} 40)`}
                        >
                          LL = 50 Division
                        </text>

                        {samples.map((s, idx) => {
                          const cx = mapX(Number(s.ll));
                          const cy = mapY(Number(s.pi));
                          // Validate bounds before rendering dot
                          if (isNaN(cx) || isNaN(cy)) return null;
                          return (
                            <g key={s.id || idx}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={6}
                                fill={USCS_COLORS[s.symbol] || "#0f3460"}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                style={{
                                  cursor: "pointer",
                                  filter:
                                    "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                                }}
                              />
                              <text
                                x={cx + 9}
                                y={cy + 3}
                                fontSize={8.5}
                                fontWeight="bold"
                                fill="#333"
                              >
                                {s.symbol} (S{idx + 1})
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </Card>
                </Col>

                <Col span={10}>
                  <Card
                    title={
                      <span style={{ fontWeight: 600 }}>
                        Classification Guidelines
                      </span>
                    }
                    bordered={false}
                  >
                    <p style={{ fontSize: 13, color: "#666" }}>
                      Plotted points above represent physical laboratory
                      results. Atterberg limits partition soil samples into
                      specific structural domains:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginTop: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tag
                          color="#e94560"
                          style={{
                            width: 60,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          CL
                        </Tag>
                        <span style={{ fontSize: 12 }}>
                          <strong>Lean Clays</strong> — Plots above A-line, LL
                          &lt; 50
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tag
                          color="#c2185b"
                          style={{
                            width: 60,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          CH
                        </Tag>
                        <span style={{ fontSize: 12 }}>
                          <strong>Fat Clays</strong> — Plots above A-line, LL
                          &ge; 50 (High expansion)
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tag
                          color="#fbc02d"
                          style={{
                            width: 60,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          ML
                        </Tag>
                        <span style={{ fontSize: 12 }}>
                          <strong>Silts</strong> — Plots below A-line, LL &lt;
                          50
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tag
                          color="#7b1fa2"
                          style={{
                            width: 60,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          MH
                        </Tag>
                        <span style={{ fontSize: 12 }}>
                          <strong>Elastic Silts</strong> — Plots below A-line,
                          LL &ge; 50
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tag
                          color="#2e7d32"
                          style={{
                            width: 60,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          SW / SP
                        </Tag>
                        <span style={{ fontSize: 12 }}>
                          <strong>Sands</strong> — Grain size passing #200 sieve
                          &lt; 50%
                        </span>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span>
                  <CalculatorOutlined />
                  Soil Compaction & Stabilization
                </span>
              }
              key="3"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Card
                    title={
                      <span style={{ fontWeight: 600 }}>
                        Geotechnical Stabilization Treatment
                      </span>
                    }
                    bordered={false}
                  >
                    <p
                      style={{ fontSize: 13, color: "#666", marginBottom: 20 }}
                    >
                      Choose a laboratory soil sample to evaluate recommended
                      chemical stabilization (Lime or Cement compaction additive
                      percentage).
                    </p>

                    <Form layout="vertical">
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600 }}>
                            Target Lab Soil Sample
                          </span>
                        }
                      >
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                        >
                          {samples.map((s, idx) => (
                            <Button
                              key={s.id || idx}
                              type={
                                selectedCalcSample?.id === s.id
                                  ? "primary"
                                  : "default"
                              }
                              onClick={() => {
                                setSelectedCalcSample(s);
                                const isClay = ["CL", "CH", "CL-ML"].includes(
                                  s.symbol
                                );
                                setStabilizerType(isClay ? "lime" : "cement");
                                setStabilizerPercent(isClay ? 6 : 4);
                              }}
                              style={{ borderRadius: 6 }}
                            >
                              S{idx + 1} ({s.symbol})
                            </Button>
                          ))}
                        </div>
                      </Form.Item>

                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600 }}>
                            Compaction Total Subgrade Weight (kg)
                          </span>
                        }
                      >
                        <InputNumber
                          min={10}
                          max={1000000}
                          value={soilWeight}
                          onChange={(val) => setSoilWeight(val || 1000)}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600 }}>
                            Stabilizer Chemical Type
                          </span>
                        }
                      >
                        <Tabs
                          activeKey={stabilizerType}
                          onChange={(key) =>
                            setStabilizerType(key as "lime" | "cement")
                          }
                          style={{ marginBottom: 0 }}
                        >
                          <Tabs.TabPane
                            tab="Hydrated Lime (For Clayey Soils)"
                            key="lime"
                          />
                          <Tabs.TabPane
                            tab="Portland Cement (For Sandy/Silty)"
                            key="cement"
                          />
                        </Tabs>
                      </Form.Item>

                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600 }}>
                            Stabilizer Percentage: {stabilizerPercent}%
                          </span>
                        }
                      >
                        <Slider
                          min={2}
                          max={12}
                          value={stabilizerPercent}
                          onChange={(val) => setStabilizerPercent(val)}
                          marks={{ 2: "2%", 6: "6%", 12: "12%" }}
                        />
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>

                <Col span={12}>
                  {selectedCalcSample ? (
                    <Card
                      title={
                        <span style={{ fontWeight: 600 }}>
                          Compaction Stabilizer Bill of Quantities
                        </span>
                      }
                      bordered={false}
                      style={{
                        background: "linear-gradient(135deg, #16213e, #0f3460)",
                        color: "#fff",
                        height: "100%",
                      }}
                    >
                      <div style={{ padding: "10px 0" }}>
                        <Statistic
                          title={
                            <span
                              style={{
                                color: "rgba(255,255,255,0.7)",
                                fontWeight: 500,
                                fontSize: 13,
                              }}
                            >
                              TOTAL SOIL MASS
                            </span>
                          }
                          value={soilWeight}
                          suffix="kg"
                          valueStyle={{
                            color: "#fff",
                            fontSize: 24,
                            fontWeight: 700,
                          }}
                        />
                        <Divider
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            margin: "16px 0",
                          }}
                        />
                        <Statistic
                          title={
                            <span
                              style={{
                                color: "rgba(255,255,255,0.7)",
                                fontWeight: 500,
                                fontSize: 13,
                              }}
                            >
                              REQUIRED CHEMICAL WEIGHT (
                              {stabilizerType.toUpperCase()})
                            </span>
                          }
                          value={(
                            soilWeight *
                            (stabilizerPercent / 100)
                          ).toFixed(1)}
                          suffix="kg"
                          valueStyle={{
                            color: "#36cfc9",
                            fontSize: 32,
                            fontWeight: 800,
                          }}
                        />
                        <Divider
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            margin: "16px 0",
                          }}
                        />

                        <h4
                          style={{
                            color: "#fff",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          Engineering Stabilizing Guideline:
                        </h4>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 12.5,
                            lineHeight: 1.6,
                          }}
                        >
                          {stabilizerType === "lime"
                            ? "Lime treatment reduces the soil Plasticity Index (PI) through cation exchange, inducing immediate flocculation of clay platelets to enhance compaction shear parameters."
                            : "Portland cement binds granular particles together, creating a highly durable rigid soil-cement matrix, recommended for silts and poorly graded sands."}
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <Card
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ color: "#999" }}>
                        Please add a laboratory soil sample to active the
                        Compaction Stabilization Calculator.
                      </span>
                    </Card>
                  )}
                </Col>
              </Row>
            </Tabs.TabPane>
          </Tabs>
        </Content>
      </Layout>

      <Modal
        title={
          editingSample ? "Modify Soil Lab Sample" : "Register Soil Lab Sample"
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={680}
        okText={editingSample ? "Update Record" : "Add Record"}
      >
        <Divider style={{ margin: "10px 0 20px" }} />
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ll"
                label={
                  <span style={{ fontWeight: 600 }}>Liquid Limit — LL (%)</span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={200}
                  placeholder="e.g. 45"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pl"
                label={
                  <span style={{ fontWeight: 600 }}>
                    Plastic Limit — PL (%)
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={200}
                  placeholder="e.g. 20"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="p200"
                label={
                  <span style={{ fontWeight: 600 }}>
                    Passing #200 sieve — P200 (%)
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="e.g. 65"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="p4"
                label={
                  <span style={{ fontWeight: 600 }}>
                    Passing #4 sieve — P4 (%)
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="e.g. 98"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="p40"
                label={
                  <span style={{ fontWeight: 600 }}>
                    Passing #40 sieve — P40 (%)
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="e.g. 85"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="p10"
                label={
                  <span style={{ fontWeight: 600 }}>
                    Passing #10 sieve — P10 (%)
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="e.g. 92"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="d60"
                label={
                  <span style={{ fontWeight: 600 }}>d60 Grain Size (mm)</span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.001}
                  placeholder="e.g. 0.08"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="d30"
                label={
                  <span style={{ fontWeight: 600 }}>d30 Grain Size (mm)</span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.001}
                  placeholder="e.g. 0.035"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="d10"
                label={
                  <span style={{ fontWeight: 600 }}>d10 Grain Size (mm)</span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.001}
                  step={0.001}
                  placeholder="e.g. 0.008"
                />
              </Form.Item>
            </Col>
          </Row>
          {computed.symbol && (
            <Alert
              style={{ marginTop: 12 }}
              message={
                <span>
                  <strong>Calculated Lab Parameters:</strong> &nbsp; PI ={" "}
                  <strong>{computed.pi}%</strong> &nbsp;|&nbsp; Cu ={" "}
                  <strong>{computed.cu}</strong> &nbsp;|&nbsp; Cc ={" "}
                  <strong>{computed.cc}</strong> &nbsp;|&nbsp; USCS:{" "}
                  <Tag
                    color={USCS_COLORS[computed.symbol] ? "magenta" : "default"}
                    style={{
                      background: USCS_COLORS[computed.symbol],
                      color: "#fff",
                      border: "none",
                      marginLeft: 4,
                      fontWeight: "bold",
                    }}
                  >
                    {computed.symbol}
                  </Tag>
                  &nbsp;— <strong>{computed.groupName}</strong>
                </span>
              }
              type="info"
              showIcon
            />
          )}
        </Form>
      </Modal>
    </Layout>
  );
}
