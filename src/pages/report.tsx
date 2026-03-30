import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Sidebar from './sidebar';
import Header from './header';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SoilSample {
  id: number;
  moisture: number;
  organicMatter: number;
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
  classification: string;
}

export default function Report() {
  const { projectId } = useParams<{ projectId: string }>();
  const [samples, setSamples] = useState<SoilSample[]>([]);
  const [project, setProject] = useState<{ name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [samplesRes, projectRes] = await Promise.all([
        api.get(`/soils?projectId=${projectId}`),
        api.get(`/projects/${projectId}`),
      ]);
      setSamples(samplesRes.data);
      setProject(projectRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Soil Analysis Report - ${project?.name}`, 14, 20);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = [
      'Moisture',
      'Organic Matter',
      'pH',
      'N (mg/kg)',
      'P (mg/kg)',
      'K (mg/kg)',
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
      s.texture,
      s.classification,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`report_${projectId}.pdf`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Report for {project?.name}</h1>
            <button
              onClick={generatePDF}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Download PDF Report
            </button>
          </div>
          {samples.length === 0 ? (
            <p>No soil samples found. Please add some first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded shadow">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border">Moisture</th>
                    <th className="px-4 py-2 border">Org. Matter</th>
                    <th className="px-4 py-2 border">pH</th>
                    <th className="px-4 py-2 border">N (mg/kg)</th>
                    <th className="px-4 py-2 border">P (mg/kg)</th>
                    <th className="px-4 py-2 border">K (mg/kg)</th>
                    <th className="px-4 py-2 border">Texture</th>
                    <th className="px-4 py-2 border">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample) => (
                    <tr key={sample.id}>
                      <td className="px-4 py-2 border">{sample.moisture}</td>
                      <td className="px-4 py-2 border">{sample.organicMatter}</td>
                      <td className="px-4 py-2 border">{sample.pH}</td>
                      <td className="px-4 py-2 border">{sample.nitrogen}</td>
                      <td className="px-4 py-2 border">{sample.phosphorus}</td>
                      <td className="px-4 py-2 border">{sample.potassium}</td>
                      <td className="px-4 py-2 border">{sample.texture}</td>
                      <td className="px-4 py-2 border">{sample.classification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}