import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Resources from './pages/Resources'
import About from './pages/About'
import Contact from './pages/Contact'
import BattleRoom from './pages/BattleRoom'
import CreateQuiz from './pages/CreateQuiz'
import Shop from './pages/Shop'
import AuthPortal from './components/AuthPortal'
import UnifiedDashboard from './pages/UnifiedDashboard'
import Discuss from './pages/Discuss'
import './App.css'

function App() {
  return (
    <Routes>
      {/* Main App Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="resources" element={<Resources />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="battle/:battleId" element={<BattleRoom />} />
        <Route path="create-quiz" element={<CreateQuiz />} />
        <Route path="shop" element={<Shop />} />
        <Route path="discuss" element={<Discuss />} />

        {/* Protected Dashboards (Inside Layout) */}
        <Route path="parent" element={<UnifiedDashboard role="Parents" themeColor="cyan" />} />
        <Route path="admin" element={<UnifiedDashboard role="Admin" themeColor="purple" />} />
        <Route path="teacher" element={<UnifiedDashboard role="Teacher" themeColor="emerald" />} />
        <Route path="user" element={<UnifiedDashboard role="User" themeColor="orange" />} />
      </Route>

      {/* Auth Portals (Full Screen / No Layout) */}
      <Route path="/auth/parent" element={<AuthPortal role="Parents" themeColor="cyan" redirectPath="/parent" />} />
      <Route path="/auth/admin" element={<AuthPortal role="Admin" themeColor="purple" redirectPath="/admin" />} />
      <Route path="/auth/teacher" element={<AuthPortal role="Teacher" themeColor="emerald" redirectPath="/teacher" />} />
      <Route path="/auth/user" element={<AuthPortal role="User" themeColor="orange" redirectPath="/" />} />
    </Routes>
  )
}

export default App
