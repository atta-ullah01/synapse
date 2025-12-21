import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
