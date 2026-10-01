import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/Layout';
import { SunMark } from './components/Logo';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const DailyLife = lazy(() => import('./pages/DailyLife'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Activities = lazy(() => import('./pages/Activities'));
const Environment = lazy(() => import('./pages/Environment'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Parents = lazy(() => import('./pages/Parents'));
const Food = lazy(() => import('./pages/Food'));
const Contact = lazy(() => import('./pages/Contact'));
const Enroll = lazy(() => import('./pages/Enroll'));
const NotFound = lazy(() => import('./pages/NotFound'));
// The whole admin panel is a separate chunk — never downloaded by parents visiting the site.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export function PageLoader() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-label="Բեռնվում է">
      <SunMark className="h-14 w-14 animate-spin [animation-duration:3s]" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="daily-life" element={<DailyLife />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="activities" element={<Activities />} />
          <Route path="environment" element={<Environment />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:slug" element={<EventDetail />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="parents" element={<Parents />} />
          <Route path="food" element={<Food />} />
          <Route path="contact" element={<Contact />} />
          <Route path="enroll" element={<Enroll />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
