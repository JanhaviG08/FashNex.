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
import { ToastContainer, toast } from 'react-toastify';
import PlaceOrder from "./pages/PlaceOrder";
import 'react-toastify/dist/ReactToastify.css';
import Order from "./pages/Order";
import NotFound from "./pages/NotFound";
import { WardrobeProvider } from './context/WardrobeContext'
import Wardrobe from './pages/Wardrobe'
import TryOn from "./pages/TryOn"

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

        <Route 
           path="/login" 
           element={
              userData ? (<Navigate to ={location.state?.from || "/"} />) :(<Login/>)
           } 
        />

        <Route 
            path="/signup" 
            element={
              userData ? (<Navigate to ={location.state?.from || "/"} />) :(<Registration/>)
            } 
        />

        <Route 
            path="/" 
            element={userData ? <Home/> : <Navigate to="/login" state={{from: location.pathname}}/>}  
        />
        
        <Route 
            path="/recommend" 
            element={userData ? <WeatherRecommendation /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/about" 
             element={ userData ? <About /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
            path="/collection" 
            element={userData ? <Collections />: <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/product" 
             element={userData ? <Product/> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/contact" 
             element={userData ? <Contact /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/productdetail/:productId" 
             element={userData ? <ProductDetail /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/cart" 
             element={userData ? <Cart /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/placeorder" 
             element={userData ? <PlaceOrder /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="/order" 
             element={userData ? <Order /> : <Navigate to="/login" state={{from: location.pathname}}/>} 
        />

        <Route 
             path="*"
             element={<NotFound/>}
        />

        <Route path="/recommend"  element={<WeatherRecommendation />} />
        <Route path="/wardrobe"   element={<Wardrobe />} />
        <Route path="/try-on/:productId" element={<TryOn />} />

      </Routes>
      
     </WardrobeProvider>
    </>
  );
}

export default App;