import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../services/api';
import Sidebar from './sidebar';
import Header from './header';

// Simple classification based on sand/silt/clay percentages
function classifySoil(sand: number, silt: number, clay: number): string {
  if (sand > 70) return 'Sandy';
  if (clay > 40) return 'Clayey';
  if (silt > 50) return 'Silty';
  return 'Loam';
}

export default function SoilAnalysis() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    moisture: '',
    organicMatter: '',
    pH: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    sand: '',
    silt: '',
    clay: '',
  });
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClassify = () => {
    const sand = parseFloat(form.sand);
    const silt = parseFloat(form.silt);
    const clay = parseFloat(form.clay);
    if (isNaN(sand) || isNaN(silt) || isNaN(clay)) {
      alert('Please enter sand, silt, and clay percentages');
      return;
    }
    const result = classifySoil(sand, silt, clay);
    setClassification(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        projectId: Number(projectId),
        moisture: parseFloat(form.moisture),
        organicMatter: parseFloat(form.organicMatter),
        pH: parseFloat(form.pH),
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        texture: classification,
        classification,
      };
      await api.post('/soils', payload);
      alert('Soil sample saved!');
      navigate(`/report/${projectId}`);
    } catch (err) {
      console.error(err);
      alert('Error saving sample');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Soil Analysis - Project {projectId}</h1>
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Moisture (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="moisture"
                  value={form.moisture}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Organic Matter (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="organicMatter"
                  value={form.organicMatter}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">pH</label>
                <input
                  type="number"
                  step="0.1"
                  name="pH"
                  value={form.pH}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Nitrogen (mg/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="nitrogen"
                  value={form.nitrogen}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Phosphorus (mg/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="phosphorus"
                  value={form.phosphorus}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Potassium (mg/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="potassium"
                  value={form.potassium}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Sand (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="sand"
                  value={form.sand}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Silt (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="silt"
                  value={form.silt}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Clay (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="clay"
                  value={form.clay}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleClassify}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Classify Texture
              </button>
              {classification && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded">
                  Classification: {classification}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Saving...' : 'Save Sample'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}