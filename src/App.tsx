import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import Home from '@/pages/Home';
import Materias from '@/pages/Materias';
import MisMaterias from '@/pages/MisMaterias';
import PrestamoComputadores from '@/pages/PrestamoComputadores';
import CarreraDetalle from '@/pages/CarreraDetalle';
import MateriaDetalle from '@/pages/MateriaDetalle';
import Ejercicios from '@/pages/Ejercicios';
import EjercicioDetalle from '@/pages/EjercicioDetalle';
import Asistente from '@/pages/Asistente';
import Retos from '@/pages/Retos';
import RetoDetalle from '@/pages/RetoDetalle';
import Empresas from '@/pages/Empresas';
import SobreNosotros from '@/pages/SobreNosotros';
import Login from '@/pages/Login';
import Registro from '@/pages/Registro';
import Dashboard from '@/pages/Dashboard';
import MiProgreso from '@/pages/MiProgreso';
import Favoritos from '@/pages/Favoritos';
import MisRetos from '@/pages/MisRetos';
import Perfil from '@/pages/Perfil';
import Configuracion from '@/pages/Configuracion';
import EmpresaDashboard from '@/pages/empresa/EmpresaDashboard';
import EmpresaRetos from '@/pages/empresa/EmpresaRetos';
import EmpresaRetoEditor from '@/pages/empresa/EmpresaRetoEditor';
import EmpresaPostulaciones from '@/pages/empresa/EmpresaPostulaciones';
import EmpresaPerfil from '@/pages/empresa/EmpresaPerfil';
import EmpresaVacantes from '@/pages/empresa/EmpresaVacantes';
import EmpresaVacanteEditor from '@/pages/empresa/EmpresaVacanteEditor';
import EmpresaPruebas from '@/pages/empresa/EmpresaPruebas';
import EmpresaPruebaEditor from '@/pages/empresa/EmpresaPruebaEditor';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsuarios from '@/pages/admin/AdminUsuarios';
import AdminMaterias from '@/pages/admin/AdminMaterias';
import AdminEjercicios from '@/pages/admin/AdminEjercicios';
import AdminRetos from '@/pages/admin/AdminRetos';
import AdminReportes from '@/pages/admin/AdminReportes';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/catalogo" element={<Materias />} />
        <Route path="/catalogo/:id" element={<MateriaDetalle />} />
        <Route path="/carreras/:slug" element={<CarreraDetalle />} />
        {/* Alias histórico: el detalle público vivía bajo /materias/:id. */}
        <Route path="/materias/:id" element={<MateriaDetalle />} />
        <Route path="/ejercicios" element={<Ejercicios />} />
        <Route path="/ejercicios/:id" element={<EjercicioDetalle />} />
        <Route path="/asistente" element={<Asistente />} />
        <Route path="/retos" element={<Retos />} />
        <Route path="/retos/:slug" element={<RetoDetalle />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/materias" element={<MisMaterias />} />
          <Route path="/prestamo-pcs" element={<PrestamoComputadores />} />
        </Route>
      </Route>

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mi-progreso" element={<MiProgreso />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/mis-retos" element={<MisRetos />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['company']} />}>
        <Route element={<AppShell />}>
          <Route path="/empresa" element={<EmpresaDashboard />} />
          <Route path="/empresa/retos" element={<EmpresaRetos />} />
          <Route path="/empresa/retos/nuevo" element={<EmpresaRetoEditor />} />
          <Route path="/empresa/retos/:id" element={<EmpresaRetoEditor />} />
          <Route path="/empresa/postulaciones" element={<EmpresaPostulaciones />} />
          <Route path="/empresa/vacantes" element={<EmpresaVacantes />} />
          <Route path="/empresa/vacantes/nuevo" element={<EmpresaVacanteEditor />} />
          <Route path="/empresa/vacantes/:id" element={<EmpresaVacanteEditor />} />
          <Route path="/empresa/pruebas" element={<EmpresaPruebas />} />
          <Route path="/empresa/pruebas/nuevo" element={<EmpresaPruebaEditor />} />
          <Route path="/empresa/pruebas/:id" element={<EmpresaPruebaEditor />} />
          <Route path="/empresa/perfil" element={<EmpresaPerfil />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/materias" element={<AdminMaterias />} />
          <Route path="/admin/ejercicios" element={<AdminEjercicios />} />
          <Route path="/admin/retos" element={<AdminRetos />} />
          <Route path="/admin/reportes" element={<AdminReportes />} />
        </Route>
      </Route>
    </Routes>
  );
}
