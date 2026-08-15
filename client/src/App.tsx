import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/components/LandingPage';
import { EditorPage } from '@/components/EditorPage';
import { CreatePage } from '@/components/CreatePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/new" element={<CreatePage />} />
      <Route path="/twin/:roomId" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
