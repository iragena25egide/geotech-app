import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Table,
  Button,
  Card,
  Space,
  message,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import { SoilSample } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function Report() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [samples, setSamples] = useState<SoilSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!projectId) navigate('/');
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [samplesRes, projectRes] = await Promise.all([
        api.get(`/soils?projectId=${projectId}`),
        api.get(`/projects/${projectId}`),
      ]);
      setSamples(samplesRes.data);
      setProjectName(projectRes.data.name);
    } catch (err) {
      message.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Soil Analysis Report - ${projectName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = [
      'Moisture (%)',
      'Org. Matter (%)',
      'pH',
      'N (mg/kg)',
      'P (mg/kg)',
      'K (mg/kg)',
      'Sand (%)',
      'Silt (%)',
      'Clay (%)',
      'Texture',
      'Classification',
    ];
    const tableRows = samples.map((s) => [
      s.moisture,
      s.organicMatter,
      s.pH,
      s.nitrogen,
      s.phosphorus,
      s.potassium,
      s.sand,
      s.silt,
      s.clay,
      s.texture,
      s.classification,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 20 } },
    });

    doc.save(`report_${projectId}.pdf`);
  };

  const columns = [
    { title: 'Moisture (%)', dataIndex: 'moisture', key: 'moisture' },
    { title: 'Org. Matter (%)', dataIndex: 'organicMatter', key: 'organicMatter' },
    { title: 'pH', dataIndex: 'pH', key: 'pH' },
    { title: 'N (mg/kg)', dataIndex: 'nitrogen', key: 'nitrogen' },
    { title: 'P (mg/kg)', dataIndex: 'phosphorus', key: 'phosphorus' },
    { title: 'K (mg/kg)', dataIndex: 'potassium', key: 'potassium' },
    { title: 'Sand (%)', dataIndex: 'sand', key: 'sand' },
    { title: 'Silt (%)', dataIndex: 'silt', key: 'silt' },
    { title: 'Clay (%)', dataIndex: 'clay', key: 'clay' },
    { title: 'Texture', dataIndex: 'texture', key: 'texture' },
    { title: 'Classification', dataIndex: 'classification', key: 'classification' },
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
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['3']}>
          <Menu.Item key="1" icon={<DashboardOutlined />} onClick={() => navigate('/')}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<ExperimentOutlined />} onClick={() => navigate(`/analysis/${projectId}`)}>
            Soil Analysis
          </Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />}>Report</Menu.Item>
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
            <Title level={4} style={{ margin: 0 }}>Report - {projectName}</Title>
          </Space>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Card
            title="Soil Samples"
            extra={
              samples.length > 0 && (
                <Button type="primary" icon={<DownloadOutlined />} onClick={generatePDF}>
                  Download PDF
                </Button>
              )
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
                No soil samples found. Please add a sample from the Soil Analysis page.
              </div>
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}