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
  Spin,
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
import { SoilSample } from '../types';

const { Header, Sider, Content } = Layout;

// Simple USDA classification based on sand, silt, clay percentages
function classifySoil(sand: number, silt: number, clay: number): string {
  if (sand > 70) return 'Sandy';
  if (clay > 40) return 'Clayey';
  if (silt > 50) return 'Silty';
  return 'Loam';
}

export default function SoilAnalysis() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classification, setClassification] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) navigate('/');
  }, [projectId, navigate]);

  // Watch sand, silt, clay fields for real-time classification
  const handleValuesChange = (_: any, allValues: any) => {
    const { sand, silt, clay } = allValues;
    if (sand !== undefined && silt !== undefined && clay !== undefined) {
      const result = classifySoil(Number(sand), Number(silt), Number(clay));
      setClassification(result);
    } else {
      setClassification(null);
    }
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    const payload: SoilSample = {
      projectId: Number(projectId),
      moisture: values.moisture,
      organicMatter: values.organicMatter,
      pH: values.pH,
      nitrogen: values.nitrogen,
      phosphorus: values.phosphorus,
      potassium: values.potassium,
      sand: values.sand,
      silt: values.silt,
      clay: values.clay,
      texture: classification || 'Unknown',
      classification: classification || 'Unknown',
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
          <Card title="Enter Soil Parameters">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={handleValuesChange}
              initialValues={{
                moisture: undefined,
                organicMatter: undefined,
                pH: undefined,
                nitrogen: undefined,
                phosphorus: undefined,
                potassium: undefined,
                sand: undefined,
                silt: undefined,
                clay: undefined,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                <Form.Item name="moisture" label="Moisture (%)" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="organicMatter" label="Organic Matter (%)" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="pH" label="pH" rules={[{ required: true }]}>
                  <InputNumber min={0} max={14} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="nitrogen" label="Nitrogen (mg/kg)" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="phosphorus" label="Phosphorus (mg/kg)" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="potassium" label="Potassium (mg/kg)" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="sand" label="Sand (%)" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="silt" label="Silt (%)" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="clay" label="Clay (%)" rules={[{ required: true }]}>
                  <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              {classification && (
                <Alert
                  message={`Soil Classification: ${classification}`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
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