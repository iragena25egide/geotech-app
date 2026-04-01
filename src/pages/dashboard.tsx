import { Layout, Menu, Card, Button, Table, Space } from 'antd';
import { DashboardOutlined, ExperimentOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const res = await api.get('/projects');
    setProjects(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const columns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/analysis/${record.id}`)}>
            Add Sample
          </Button>
          <Button type="link" onClick={() => navigate(`/report/${record.id}`)}>
            View Report
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div className="logo" style={{ padding: '16px', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          GeoTech
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<DashboardOutlined />}>Dashboard</Menu.Item>
          <Menu.Item key="2" icon={<ExperimentOutlined />}>Soil Analysis</Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />}>Reports</Menu.Item>
          <Menu.Item key="4" icon={<LogoutOutlined />} onClick={logout}>Logout</Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <h2>Welcome to GeoTech</h2>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Card title="My Projects" extra={<Button type="primary">New Project</Button>}>
            <Table columns={columns} dataSource={projects} rowKey="id" />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}