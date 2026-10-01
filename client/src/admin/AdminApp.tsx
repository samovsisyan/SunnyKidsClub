import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '../App';
import { useAuth } from './store/auth';
import { AdminLayout } from './components/AdminLayout';
import { ConfirmHost, ToastHost } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import { MediaLibrary } from './pages/MediaLibrary';
import { ActivitiesAdmin, DailyAdmin, EventsAdmin, PromotionsAdmin, ScheduleAdmin, SpacesAdmin, TestimonialsAdmin } from './pages/content';
import { AboutAdmin, ContactAdmin, FaqPage, FoodAdmin, SiteSettingsAdmin } from './pages/settings';

export default function AdminApp() {
  const { user, status, check } = useAuth();
  useEffect(() => {
    if (status === 'idle') check();
  }, [status, check]);

  if (status !== 'ready') return <PageLoader />;

  return (
    <>
      {!user ? (
        <Login />
      ) : (
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="about" element={<AboutAdmin />} />
            <Route path="daily" element={<DailyAdmin />} />
            <Route path="photos" element={<MediaLibrary mode="IMAGE" />} />
            <Route path="videos" element={<MediaLibrary mode="VIDEO" />} />
            <Route path="gallery" element={<MediaLibrary mode="GALLERY" />} />
            <Route path="activities" element={<ActivitiesAdmin />} />
            <Route path="schedule" element={<ScheduleAdmin />} />
            <Route path="events" element={<EventsAdmin />} />
            <Route path="promotions" element={<PromotionsAdmin />} />
            <Route path="environment" element={<SpacesAdmin />} />
            <Route path="testimonials" element={<TestimonialsAdmin />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="food" element={<FoodAdmin />} />
            <Route path="contact" element={<ContactAdmin />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<SiteSettingsAdmin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      )}
      <ToastHost />
      <ConfirmHost />
    </>
  );
}
