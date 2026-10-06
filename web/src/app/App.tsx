import { lazy, Suspense } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppHeader } from '@/components/organisms/AppHeader'
import { Skeleton } from '@/components/atoms/Skeleton'
import { ErrorBoundary } from './ErrorBoundary'

const MapaPage = lazy(() => import('@/pages/MapaPage'))
const MunicipioPage = lazy(() => import('@/pages/MunicipioPage'))
const ForensePage = lazy(() => import('@/pages/ForensePage'))
const DecisoesPage = lazy(() => import('@/pages/DecisoesPage'))
const HistoriaPage = lazy(() => import('@/pages/HistoriaPage'))
const MetodoPage = lazy(() => import('@/pages/MetodoPage'))
const ReferenciasPage = lazy(() => import('@/pages/ReferenciasPage'))

const queryClient = new QueryClient()

function PageFallback() {
  return (
    <div style={{ padding: 'var(--space-12) var(--space-8)', display: 'grid', gap: 'var(--space-4)', maxWidth: 1280, margin: '0 auto' }} aria-busy="true">
      <Skeleton width={320} height={36} />
      <Skeleton width="60%" height={16} />
      <Skeleton height={320} />
    </div>
  )
}

function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <a href="#conteudo" className="sr-only">Pular para o conteúdo</a>
      <AppHeader />
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<MapaPage />} />
            <Route path="municipio/:ibge" element={<MunicipioPage />} />
            <Route path="decisoes" element={<DecisoesPage />} />
            <Route path="historia" element={<HistoriaPage />} />
            <Route path="forense" element={<ForensePage />} />
            <Route path="metodo" element={<MetodoPage />} />
            <Route path="referencias" element={<ReferenciasPage />} />
            <Route path="*" element={<MapaPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
