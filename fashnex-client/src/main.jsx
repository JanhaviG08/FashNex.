import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AuthContext from './context/authContext.jsx'   // ✅ correct import
import UserContext from './context/UserContext.jsx'
import ShopContext from './context/ShopContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthContext>
      <UserContext>
        <ShopContext >
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </ShopContext>
      </UserContext>
    </AuthContext>
  </BrowserRouter>
)