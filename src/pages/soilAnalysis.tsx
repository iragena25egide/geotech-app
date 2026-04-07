import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

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

// Simplified USCS classification based on LL, PL, P200, D60/D30/D10
function classifyUSCS(ll: number, pl: number, p200: number, cu: number, cc: number): { symbol: string; groupName: string } {
  const pi = ll - pl;
  const isFineGrained = p200 > 50; // more than 50% passes #200 sieve

  if (isFineGrained) {
    // Fine-grained soils
    if (ll < 50) {
      if (pi > 7) return { symbol: 'CL', groupName: 'Lean Clay' };
      if (pi >= 4 && pi <= 7) return { symbol: 'CL-ML', groupName: 'Silty Clay' };
      return { symbol: 'ML', groupName: 'Silt' };
    } else {
      if (pi > 7) return { symbol: 'CH', groupName: 'Fat Clay' };
      return { symbol: 'MH', groupName: 'Elastic Silt' };
    }
  } else {
    // Coarse-grained soils (>50% retained on #200)
    const sandPercent = 100 - p200; // approximate
    const isSand = p4 > 50; // more than 50% passes #4 → sand, else gravel (simplified)
    if (isSand) {
      if (cu >= 6 && cc >= 1 && cc <= 3) return { symbol: 'SW', groupName: 'Well-Graded Sand' };
      return { symbol: 'SP', groupName: 'Poorly-Graded Sand' };
    } else {
      if (cu >= 4 && cc >= 1 && cc <= 3) return { symbol: 'GW', groupName: 'Well-Graded Gravel' };
      return { symbol: 'GP', groupName: 'Poorly-Graded Gravel' };
    }
  }
}

export default function SoilAnalysis() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [computed, setComputed] = useState<{
    pi: number | null;
    cu: number | null;
    cc: number | null;
    symbol: string | null;
    groupName: string | null;
  }>({
    pi: null,
    cu: null,
    cc: null,
    symbol: null,
    groupName: null,
  });

  useEffect(() => {
    if (!projectId) navigate('/');
  }, [projectId, navigate]);

  // Real-time calculation of PI, Cu, Cc and USCS classification
  const handleValuesChange = (_: any, allValues: any) => {
    const { ll, pl, d60, d30, d10, p200, p4 } = allValues;
    let pi: number | null = null;
    let cu: number | null = null;
    let cc: number | null = null;

    if (ll != null && pl != null) {
      pi = parseFloat((ll - pl).toFixed(2));
    }
    if (d60 != null && d10 != null && d10 > 0) {
      cu = parseFloat((d60 / d10).toFixed(2));
      if (d30 != null && d30 > 0) {
        cc = parseFloat(((d30 * d30) / (d60 * d10)).toFixed(2));
      }
    }

    let symbol: string | null = null;
    let groupName: string | null = null;
    if (ll != null && pl != null && p200 != null && cu != null && cc != null && d60 != null && d30 != null && d10 != null && p4 != null) {
      const result = classifyUSCS(ll, pl, p200, cu, cc);
      symbol = result.symbol;
      groupName = result.groupName;
    }

    setComputed({ pi, cu, cc, symbol, groupName });
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    // Use computed values (or fallback to 0 if not computed – but required fields should prevent this)
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
      symbol: computed.symbol ?? 'Unknown',
      groupName: computed.groupName ?? 'Unknown',
    };
    try {
      await api.post('/soils', payload);
      message.success('Soil sample saved successfully');
      navigate(`/report/${projectId}`);
    } catch (err) {
      message.error('Failed to save sample');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div className="logo" style={{ padding: 16, color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          GeoTech
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['2']}>
          <Menu.Item key="1" icon={<DashboardOutlined />} onClick={() => navigate('/')}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<ExperimentOutlined />}>Soil Analysis</Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />} onClick={() => navigate(`/report/${projectId}`)}>
            Report
          </Menu.Item>
          <Menu.Item key="4" icon={<LogoutOutlined />} onClick={logout}>Logout</Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
            <h2 style={{ margin: 0 }}>Soil Analysis - Project {projectId}</h2>
          </Space>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Card title="Enter Geotechnical Parameters">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={handleValuesChange}
              initialValues={{
                ll: undefined,
                pl: undefined,
                p200: undefined,
                p4: undefined,
                d60: undefined,
                d30: undefined,
                d10: undefined,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                <Form.Item name="ll" label="Liquid Limit (LL)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="pl" label="Plastic Limit (PL)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="p200" label="Percent passing #200 sieve (%)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="p4" label="Percent passing #4 sieve (%)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="d60" label="D60 (mm)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="d30" label="D30 (mm)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="d10" label="D10 (mm)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </div>

              {/* Display computed values and classification */}
              {(computed.pi !== null || computed.cu !== null || computed.cc !== null || computed.symbol) && (
                <Card size="small" title="Computed Parameters & Classification" style={{ marginBottom: 24, backgroundColor: '#f6f6f6' }}>
                  <Space direction="vertical">
                    <Text>Plasticity Index (PI) = {computed.pi !== null ? computed.pi : '—'}</Text>
                    <Text>Coefficient of Uniformity (Cu) = {computed.cu !== null ? computed.cu : '—'}</Text>
                    <Text>Coefficient of Curvature (Cc) = {computed.cc !== null ? computed.cc : '—'}</Text>
                    {computed.symbol && (
                      <Alert
                        message={`USCS Classification: ${computed.symbol} – ${computed.groupName}`}
                        type="info"
                        showIcon
                      />
                    )}
                  </Space>
                </Card>
              )}

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                  Save Sample & Generate Report
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}