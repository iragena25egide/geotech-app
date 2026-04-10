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
  Table,
  Modal,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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


function classifyUSCS(ll: number, pl: number, p200: number, cu: number, cc: number): { symbol: string; groupName: string } {
  const pi = ll - pl;
  const isFineGrained = p200 > 50;

  if (isFineGrained) {
    if (ll < 50) {
      if (pi > 7) return { symbol: 'CL', groupName: 'Lean Clay' };
      if (pi >= 4 && pi <= 7) return { symbol: 'CL-ML', groupName: 'Silty Clay' };
      return { symbol: 'ML', groupName: 'Silt' };
    } else {
      if (pi > 7) return { symbol: 'CH', groupName: 'Fat Clay' };
      return { symbol: 'MH', groupName: 'Elastic Silt' };
    }
  } else {
    const isSand = p4 > 50;
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
  const [samples, setSamples] = useState<SoilSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSample, setEditingSample] = useState<SoilSample | null>(null);
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
    if (!projectId) {
      navigate('/');
      return;
    }
    fetchProjectName();
    fetchSamples();
  }, [projectId, navigate]);

  const fetchProjectName = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProjectName(response.data.name);
    } catch (error) {
      message.error('Failed to load project name');
      setProjectName('Unknown Project');
    }
  };

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/soil?project=${projectId}`);
      setSamples(response.data);
    } catch (error) {
      message.error('Failed to load soil samples');
    } finally {
      setLoading(false);
    }
  };

  
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

  const openAddModal = () => {
    setEditingSample(null);
    form.resetFields();
    setComputed({ pi: null, cu: null, cc: null, symbol: null, groupName: null });
    setModalVisible(true);
  };

  const openEditModal = (sample: SoilSample) => {
    setEditingSample(sample);
    form.setFieldsValue({
      ll: sample.ll,
      pl: sample.pl,
      p200: sample.p200,
      p4: sample.p4,
      d60: sample.d60,
      d30: sample.d30,
      d10: sample.d10,
    });
    // Trigger computation manually
    handleValuesChange(null, {
      ll: sample.ll,
      pl: sample.pl,
      p200: sample.p200,
      p4: sample.p4,
      d60: sample.d60,
      d30: sample.d30,
      d10: sample.d10,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/soil/${id}`);
      message.success('Sample deleted successfully');
      fetchSamples();
    } catch (error) {
      message.error('Failed to delete sample');
    }
  };

  const handleModalSubmit = async () => {
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
        symbol: computed.symbol ?? 'Unknown',
        groupName: computed.groupName ?? 'Unknown',
      };

      if (editingSample?.id) {
        await api.put(`/soil/${editingSample.id}`, payload);
        message.success('Sample updated successfully');
      } else {
        await api.post('/soil', payload);
        message.success('Sample added successfully');
      }
      setModalVisible(false);
      fetchSamples();
    } catch (err) {
      message.error(editingSample ? 'Failed to update sample' : 'Failed to add sample');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'LL (%)', dataIndex: 'll', key: 'll' },
    { title: 'PL (%)', dataIndex: 'pl', key: 'pl' },
    { title: 'PI (%)', dataIndex: 'pi', key: 'pi' },
    { title: 'P200 (%)', dataIndex: 'p200', key: 'p200' },
    { title: 'P4 (%)', dataIndex: 'p4', key: 'p4' },
    { title: 'D60 (mm)', dataIndex: 'd60', key: 'd60' },
    { title: 'D30 (mm)', dataIndex: 'd30', key: 'd30' },
    { title: 'D10 (mm)', dataIndex: 'd10', key: 'd10' },
    { title: 'Cu', dataIndex: 'cu', key: 'cu' },
    { title: 'Cc', dataIndex: 'cc', key: 'cc' },
    { title: 'USCS', dataIndex: 'symbol', key: 'symbol' },
    { title: 'Group Name', dataIndex: 'groupName', key: 'groupName' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SoilSample) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this sample?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
            <h2 style={{ margin: 0 }}>Soil Analysis - {projectName || projectId}</h2>
          </Space>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Card
            title="Soil Samples"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
                Add New Sample
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={samples}
              rowKey="id"
              loading={loading}
              scroll={{ x: true }}
              pagination={{ pageSize: 10 }}
            />
            {samples.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                No soil samples found. Click "Add New Sample" to create one.
              </div>
            )}
          </Card>
        </Content>
      </Layout>

      
      <Modal
        title={editingSample ? 'Edit Soil Sample' : 'Add New Soil Sample'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={saving} onClick={handleModalSubmit}>
            {editingSample ? 'Update' : 'Save'}
          </Button>,
        ]}
        width={800}
      >
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
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

          {(computed.pi !== null || computed.cu !== null || computed.cc !== null || computed.symbol) && (
            <Card size="small" title="Computed Parameters & Classification" style={{ marginTop: 16, backgroundColor: '#f6f6f6' }}>
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
        </Form>
      </Modal>
    </Layout>
  );
}