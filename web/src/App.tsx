// lazy + Suspense load a page's code only when that page is first opened.
import { lazy, Suspense } from 'react'
// Route components.
import { Route, Routes } from 'react-router-dom'
// Shared navigation: phone tab bar and desktop top nav.
import TabBar from './components/TabBar'
import TopNav from './components/TopNav'
// Pages.
import CategoryList from './pages/CategoryList'
import Categories from './pages/Categories'
import Home from './pages/Home'
import Contribute from './pages/Contribute'
import ForgotPassword from './pages/ForgotPassword'
import Legal from './pages/Legal'
import Login from './pages/Login'
import MySubmissions from './pages/MySubmissions'
import Profile from './pages/Profile'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Result from './pages/Result'
import Search from './pages/Search'
import Staff from './pages/Staff'

// The scan page pulls in the big ZXing library, so it is loaded on demand instead of with the Home page.
const Scan = lazy(() => import('./pages/Scan'))

// App shell: navigation around whichever page matches the URL.
export default function App() {
  return (
    // Plain wrapper; the page background comes from the body style in theme.css.
    <div className="min-h-screen">
      {/* Website header (only visible on large screens). */}
      <TopNav />
      {/* Page content, chosen by the URL. */}
      <main>
        {/* Suspense covers the short moment while a lazy page downloads (nothing is shown meanwhile). */}
        <Suspense fallback={null}>
          <Routes>
            {/* Home screen. */}
            <Route path="/" element={<Home />} />
            {/* Scan screen (full-screen, covers the tab bar). */}
            <Route path="/scan" element={<Scan />} />
            {/* Accounts: log in, sign up, and the profile (guests are sent to log in). */}
            <Route path="/log-masuk" element={<Login />} />
            <Route path="/daftar" element={<Register />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/lupa-kata-laluan" element={<ForgotPassword />} />
            <Route path="/tetapkan-semula" element={<ResetPassword />} />
            {/* Contributions: send in a product or correction (login needed), and see what happened to your submissions. */}
            <Route path="/sumbang" element={<Contribute />} />
            <Route path="/sumbangan-saya" element={<MySubmissions />} />
            {/* Staff area (moderators and above); not linked from the public pages. */}
            <Route path="/staf" element={<Staff />} />
            {/* Legal pages (draft text, pending lawyer review). */}
            <Route path="/terma" element={<Legal doc="terms" />} />
            <Route path="/privasi" element={<Legal doc="privacy" />} />
            {/* Result screen for one barcode. */}
            <Route path="/p/:barcode" element={<Result />} />
            {/* Category browser, one category's product list with filters, and search. */}
            <Route path="/kategori" element={<Categories />} />
            <Route path="/kategori/:slug" element={<CategoryList />} />
            <Route path="/cari" element={<Search />} />
          </Routes>
        </Suspense>
      </main>
      {/* Bottom tab bar (only visible on phones). */}
      <TabBar />
    </div>
  )
}
