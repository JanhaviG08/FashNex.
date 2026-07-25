import React, { useContext } from "react";
import { Route, Routes, useLocation, Navigate} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import Nav from "./component/Nav";
import WeatherRecommendation from "./pages/WeatherRecommendation";
import About from "./pages/About";
import Collections from "./pages/Collections";
import Product from "./pages/Product";
import Contact from "./pages/Contact";
import { UserDataContext } from "./context/UserContext";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import { ToastContainer } from 'react-toastify';
import PlaceOrder from "./pages/PlaceOrder";
import 'react-toastify/dist/ReactToastify.css';
import Order from "./pages/Order";
import NotFound from "./pages/NotFound";
import { WardrobeProvider } from './context/WardrobeContext'
import Wardrobe from './pages/Wardrobe'
import TryOn from "./pages/TryOn"
import Wishlist from "./pages/Wishlist";
import { WishlistProvider } from "./context/WishlistContext"
import ProtectedRoute from "./component/ProtectedRoute"
import Profile from "./pages/Profile"

function App() {
  let {userData} = useContext(UserDataContext)
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
    <WardrobeProvider>
      <ToastContainer/>
      {!hideNavbar  && <Nav/>}
      <Routes>

        {/* ── Auth pages — bounce back to wherever the user was headed ── */}
        <Route
           path="/login"
           element={
              userData ? (<Navigate to={location.state?.from || "/"} replace/>) :(<Login/>)
           }
        />

        <Route
            path="/signup"
            element={
              userData ? (<Navigate to={location.state?.from || "/"} replace/>) :(<Registration/>)
            }
        />

        {/* ── Public routes — browsing works without logging in ── */}
        <Route path="/"                       element={<Home/>} />
        <Route path="/about"                  element={<About />} />
        <Route path="/collection"             element={<Collections />} />
        <Route path="/product"                element={<Product/>} />
        <Route path="/contact"                element={<Contact />} />
        <Route path="/productdetail/:productId" element={<ProductDetail />} />
        <Route path="/cart"                   element={<Cart />} />
        <Route path="/recommend"              element={<WeatherRecommendation />} />
        <Route path="/try-on/:productId"      element={<TryOn />} />

        {/* ── Protected routes — personal features, require login ── */}
        <Route path="/wishlist"   element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/wardrobe"   element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
        <Route path="/placeorder" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
        <Route path="/order"      element={<ProtectedRoute><Order /></ProtectedRoute>} />
        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* ── Catch-all must stay LAST — anything after this was unreachable before ── */}
        <Route path="*" element={<NotFound/>} />

      </Routes>

     </WardrobeProvider>
    </>
  );
}

export default App;