import React, { lazy, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useLocation,
} from "react-router-dom";
import { AppProvider } from "./providers/app-provider";
const AccountLayout = lazy(() => import("./app/account/account-layout-client"));
const AdminLayout = lazy(() => import("./app/admin/admin-layout-client"));
import NotFound from "./app/not-found";
import ErrorPage from "./app/error";
import Loading from "./app/loading";
import "./app/globals.css";
import Seo from "./platform/seo";
const Page0 = lazy(() => import("./app/about/page"));
const Page1 = lazy(() => import("./app/account/notifications/page"));
const Page2 = lazy(() => import("./app/account/orders/page"));
const Page3 = lazy(() => import("./app/account/page"));
const Page4 = lazy(() => import("./app/account/reviews/page"));
const Page5 = lazy(() => import("./app/account/wishlist/page"));
const Page6 = lazy(() => import("./app/admin/categories/page"));
const Page7 = lazy(() => import("./app/admin/inventory/page"));
const Page8 = lazy(() => import("./app/admin/orders/page"));
const Page9 = lazy(() => import("./app/admin/page"));
const Page10 = lazy(() => import("./app/admin/payments/page"));
const Page11 = lazy(() => import("./app/admin/products/page"));
const Page12 = lazy(() => import("./app/admin/reports/page"));
const Page13 = lazy(() => import("./app/admin/reviews/page"));
const Page14 = lazy(() => import("./app/admin/settings/page"));
const Page15 = lazy(() => import("./app/admin/shipments/page"));
const Page16 = lazy(() => import("./app/blog/[slug]/page"));
const Page17 = lazy(() => import("./app/blog/page"));
const Page18 = lazy(() => import("./app/cart/page"));
const Page19 = lazy(() => import("./app/checkout/page"));
const Page20 = lazy(() => import("./app/compare/page"));
const Page21 = lazy(() => import("./app/contact/page"));
const Page22 = lazy(() => import("./app/login/page"));
const Page23 = lazy(() => import("./app/order/[id]/page"));
const Page24 = lazy(() => import("./app/our-promise/page"));
const Page25 = lazy(() => import("./app/page"));
const Page26 = lazy(() => import("./app/privacy-policy/page"));
const Page27 = lazy(() => import("./app/products/[slug]/page"));
const Page28 = lazy(() => import("./app/promise/page"));
const Page29 = lazy(() => import("./app/refund-cancellation-policy/page"));
const Page30 = lazy(() => import("./app/register/page"));
const Page31 = lazy(() => import("./app/shipping-policy/page"));
const Page32 = lazy(() => import("./app/shop/[category]/page"));
const Page33 = lazy(() => import("./app/shop/page"));
const Page34 = lazy(() => import("./app/terms-and-conditions/page"));
const Page35 = lazy(() => import("./app/trust/page"));
class PageBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error?.message === "PAGE_NOT_FOUND") return <NotFound />;
    if (error)
      return (
        <ErrorPage error={error} reset={() => this.setState({ error: null })} />
      );
    return this.props.children;
  }
}
function RoutePage({ Page }: any) {
  const params = useParams();
  return <Page params={params} />;
}

function AppRoutes() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route
          path="/about"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page0} />
            </PageBoundary>
          }
        />
        <Route
          path="/account/notifications"
          element={
            <PageBoundary key={location.pathname}>
              <AccountLayout>
                <RoutePage Page={Page1} />
              </AccountLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/account/orders"
          element={
            <PageBoundary key={location.pathname}>
              <AccountLayout>
                <RoutePage Page={Page2} />
              </AccountLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/account"
          element={
            <PageBoundary key={location.pathname}>
              <AccountLayout>
                <RoutePage Page={Page3} />
              </AccountLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/account/reviews"
          element={
            <PageBoundary key={location.pathname}>
              <AccountLayout>
                <RoutePage Page={Page4} />
              </AccountLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/account/wishlist"
          element={
            <PageBoundary key={location.pathname}>
              <AccountLayout>
                <RoutePage Page={Page5} />
              </AccountLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page6} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page7} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page8} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page9} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page10} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/products"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page11} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page12} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page13} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page14} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/admin/shipments"
          element={
            <PageBoundary key={location.pathname}>
              <AdminLayout>
                <RoutePage Page={Page15} />
              </AdminLayout>
            </PageBoundary>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page16} />
            </PageBoundary>
          }
        />
        <Route
          path="/blog"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page17} />
            </PageBoundary>
          }
        />
        <Route
          path="/cart"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page18} />
            </PageBoundary>
          }
        />
        <Route
          path="/checkout"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page19} />
            </PageBoundary>
          }
        />
        <Route
          path="/compare"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page20} />
            </PageBoundary>
          }
        />
        <Route
          path="/contact"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page21} />
            </PageBoundary>
          }
        />
        <Route
          path="/login"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page22} />
            </PageBoundary>
          }
        />
        <Route
          path="/order/:id"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page23} />
            </PageBoundary>
          }
        />
        <Route
          path="/our-promise"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page24} />
            </PageBoundary>
          }
        />
        <Route
          path="/"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page25} />
            </PageBoundary>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page26} />
            </PageBoundary>
          }
        />
        <Route
          path="/products/:slug"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page27} />
            </PageBoundary>
          }
        />
        <Route
          path="/promise"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page28} />
            </PageBoundary>
          }
        />
        <Route
          path="/refund-cancellation-policy"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page29} />
            </PageBoundary>
          }
        />
        <Route
          path="/register"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page30} />
            </PageBoundary>
          }
        />
        <Route
          path="/shipping-policy"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page31} />
            </PageBoundary>
          }
        />
        <Route
          path="/shop/:category"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page32} />
            </PageBoundary>
          }
        />
        <Route
          path="/shop"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page33} />
            </PageBoundary>
          }
        />
        <Route
          path="/terms-and-conditions"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page34} />
            </PageBoundary>
          }
        />
        <Route
          path="/trust"
          element={
            <PageBoundary key={location.pathname}>
              <RoutePage Page={Page35} />
            </PageBoundary>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AppProvider>
      <Seo />
      <AppRoutes />
    </AppProvider>
  </BrowserRouter>,
);
