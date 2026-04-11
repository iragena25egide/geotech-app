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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

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
        api.get(`/${projectId}`),
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
    doc.text(`Geotechnical Report - ${projectName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = [
      'LL (%)',
      'PL (%)',
      'PI (%)',
      'P200 (%)',
      'P4 (%)',
      'D60 (mm)',
      'D30 (mm)',
      'D10 (mm)',
      'Cu',
      'Cc',
      'USCS Symbol',
      'Group Name',
    ];
    const tableRows = samples.map((s) => [
      s.ll,
      s.pl,
      s.pi,
      s.p200,
      s.p4,
      s.d60,
      s.d30,
      s.d10,
      s.cu,
      s.cc,
      s.symbol,
      s.groupName,
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
    { title: 'LL (%)', dataIndex: 'll', key: 'll', sorter: (a: SoilSample, b: SoilSample) => a.ll - b.ll },
    { title: 'PL (%)', dataIndex: 'pl', key: 'pl', sorter: (a, b) => a.pl - b.pl },
    { title: 'PI (%)', dataIndex: 'pi', key: 'pi', sorter: (a, b) => a.pi - b.pi },
    { title: 'P200 (%)', dataIndex: 'p200', key: 'p200', sorter: (a, b) => a.p200 - b.p200 },
    { title: 'P4 (%)', dataIndex: 'p4', key: 'p4', sorter: (a, b) => a.p4 - b.p4 },
    { title: 'D60 (mm)', dataIndex: 'd60', key: 'd60', sorter: (a, b) => a.d60 - b.d60 },
    { title: 'D30 (mm)', dataIndex: 'd30', key: 'd30', sorter: (a, b) => a.d30 - b.d30 },
    { title: 'D10 (mm)', dataIndex: 'd10', key: 'd10', sorter: (a, b) => a.d10 - b.d10 },
    { title: 'Cu', dataIndex: 'cu', key: 'cu', sorter: (a, b) => a.cu - b.cu },
    { title: 'Cc', dataIndex: 'cc', key: 'cc', sorter: (a, b) => a.cc - b.cc },
    { title: 'USCS Symbol', dataIndex: 'symbol', key: 'symbol' },
    { title: 'Group Name', dataIndex: 'groupName', key: 'groupName' },
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
          <Menu.Item key="2" icon={<ExperimentOutlined />} onClick={() => navigate(`/${projectId}`)}>
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
            <Title level={4} style={{ margin: 0 }}>Geotechnical Report - {projectName}</Title>
          </Space>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Card
            title="Soil Test Results"
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