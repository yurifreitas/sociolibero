import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Skeleton } from '@/components/atoms/Skeleton'
import { AppHeader } from '@/components/organisms/AppHeader'
import { BasesDrawer } from '@/components/organisms/BasesDrawer'
import { CommandPalette } from '@/components/organisms/CommandPalette'
import { EvidenceFooter } from '@/components/organisms/EvidenceFooter'
import { EvidenceRail } from '@/components/organisms/EvidenceRail'
import { ChromeProvider } from '@/features/chrome/ChromeContext'
import { ErrorBoundary } from './ErrorBoundary'

const HomePage = lazy(() => import('@/pages/HomePage'))
const MapaPage = lazy(() => import('@/pages/MapaPage'))
const MunicipioPage = lazy(() => import('@/pages/MunicipioPage'))
const ForensePage = lazy(() => import('@/pages/ForensePage'))
const DecisoesPage = lazy(() => import('@/pages/DecisoesPage'))
const HistoriaPage = lazy(() => import('@/pages/HistoriaPage'))
const GentePage = lazy(() => import('@/pages/GentePage'))
const FuturoPage = lazy(() => import('@/pages/FuturoPage'))
const CorrupcaoPage = lazy(() => import('@/pages/CorrupcaoPage'))
const PessimismoPage = lazy(() => import('@/pages/PessimismoPage'))
const QuebrasPage = lazy(() => import('@/pages/QuebrasPage'))
const AntesPage = lazy(() => import('@/pages/AntesPage'))
const ClimaPage = lazy(() => import('@/pages/ClimaPage'))
const PotenciaisPage = lazy(() => import('@/pages/PotenciaisPage'))
const PilaresPage = lazy(() => import('@/pages/PilaresPage'))
const MarxPage = lazy(() => import('@/pages/MarxPage'))
const ViolenciaPage = lazy(() => import('@/pages/ViolenciaPage'))
const PropostasPage = lazy(() => import('@/pages/PropostasPage'))
const BibliotecaPage = lazy(() => import('@/pages/BibliotecaPage'))
const EleicoesPage = lazy(() => import('@/pages/EleicoesPage'))
const ClassesPage = lazy(() => import('@/pages/ClassesPage'))
const IndigenasEleicoesPage = lazy(() => import('@/pages/IndigenasEleicoesPage'))
const VotoAnalfabetoPage = lazy(() => import('@/pages/VotoAnalfabetoPage'))
const MetodoPage = lazy(() => import('@/pages/MetodoPage'))
const ReferenciasPage = lazy(() => import('@/pages/ReferenciasPage'))

const queryClient = new QueryClient()

function PageFallback() {
  return (
    <div style={{ padding: 'var(--space-12) var(--space-8)', display: 'grid', gap: 'var(--space-4)', width: '100%' }} aria-busy="true" aria-label="Carregando página">
      <Skeleton width={120} height={12} />
      <Skeleton width={360} height={36} />
      <Skeleton width="58%" height={16} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
        <Skeleton height={168} style={{ borderRadius: 16 }} />
        <Skeleton height={168} style={{ borderRadius: 16 }} />
        <Skeleton height={168} style={{ borderRadius: 16 }} />
      </div>
    </div>
  )
}

function Layout() {
  const { pathname } = useLocation()
  return (
    <ChromeProvider>
      <a href="#conteudo" className="sr-only">Pular para o conteúdo</a>
      <AppHeader />
      <EvidenceRail />
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
      <EvidenceFooter />
      <BasesDrawer />
      <CommandPalette />
    </ChromeProvider>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="mapa" element={<MapaPage />} />
            <Route path="municipio/:ibge" element={<MunicipioPage />} />
            <Route path="decisoes" element={<DecisoesPage />} />
            <Route path="historia" element={<HistoriaPage />} />
            <Route path="gente" element={<GentePage />} />
            <Route path="antes-de-1500" element={<AntesPage />} />
            <Route path="clima" element={<ClimaPage />} />
            <Route path="potenciais" element={<PotenciaisPage />} />
            <Route path="pilares" element={<PilaresPage />} />
            <Route path="marx" element={<MarxPage />} />
            <Route path="violencia" element={<ViolenciaPage />} />
            <Route path="forense" element={<ForensePage />} />
            <Route path="corrupcao" element={<CorrupcaoPage />} />
            <Route path="pessimismo" element={<PessimismoPage />} />
            <Route path="quebras" element={<QuebrasPage />} />
            <Route path="futuro" element={<FuturoPage />} />
            <Route path="propostas" element={<PropostasPage />} />
            <Route path="biblioteca" element={<BibliotecaPage />} />
            <Route path="eleicoes" element={<EleicoesPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="indigenas-eleicoes" element={<IndigenasEleicoesPage />} />
            <Route path="voto-analfabeto" element={<VotoAnalfabetoPage />} />
            <Route path="metodo" element={<MetodoPage />} />
            <Route path="referencias" element={<ReferenciasPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
