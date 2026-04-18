import React, { useContext, useState } from 'react'
import CartTotal from '../component/CartTotal'
import razorpay from '../assets/Razorpay.jpg'
import { ShopDataContext } from '../context/ShopContext'
import { AuthDataContext } from '../context/authContext'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiUser, FiMail, FiMapPin, FiPhone, FiShield, FiChevronRight } from 'react-icons/fi'

function PlaceOrder() {
  const navigate = useNavigate()
  const [method, setMethod] = useState('cod')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = delivery info, 2 = payment (mobile stepper)

  const { cartItem, setCartItem, getCartAmount, delivery_fee, products } = useContext(ShopDataContext)
  const { serverUrl } = useContext(AuthDataContext)
  const { userData }  = useContext(UserDataContext)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    email: '', street: '',
    city: '', state: '',
    pincode: '', country: '',
    phone: ''
  })

  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const initPay= (order) =>{
    const options ={
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name:"Order Payment",
      description:"Order Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response ) =>{
        console.log(response);
        const {data} = await axios.post(
          serverUrl + "/api/order/verifyrazorpay",
          response,
          {withCredentials: true}
        )
        if(data.success){
          navigate("/order")
          setCartItem({})
        }
      }
    }
    const rzp = new window.Razorpay(options)  // ✅ create instance
    rzp.open()
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Build order items from cartItem map
      const orderItems = []
      for (const itemId in cartItem) {
        for (const size in cartItem[itemId]) {
          if (cartItem[itemId][size] > 0) {
            const itemInfo = structuredClone(products.find(p => p._id === itemId))
            if (itemInfo) {
              itemInfo.size     = size
              itemInfo.quantity = cartItem[itemId][size]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      const orderData = {
        userId:        userData?._id || userData?.id || "guest",
        address:       formData,
        items:         orderItems,
        amount:        (getCartAmount() || 0) + (delivery_fee || 0),
        paymentMethod: method,   // ← lowercase, matches schema & fixed controller
        payment:       false,
        date:          Date.now()
      }

      console.log("ORDER DATA:", orderData)

      switch (method) {
        case 'cod': {
          const result = await axios.post(
            serverUrl + '/api/order/placeorder',
            orderData,
            { withCredentials: true }
          )
          console.log(result.data)
          if (result.data) {
            setCartItem({})
            navigate('/order')
          }
          else{
            console.log(result.data.message);
          }
          break;
        }

        case 'razorpay': {
          const resultRazorpay = await axios.post(
            serverUrl + "/api/order/razorpay",
            orderData,
            {withCredentials: true}
          )
          setLoading(false)
          if(resultRazorpay.data){
            initPay(resultRazorpay.data)
          }
          console.log('Razorpay flow — integrate SDK here')
          break;
        }

        default:
          break
      }
      
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // ── Reusable input ─────────────────────────────────────────────────────────
  const Input = ({ name, placeholder, type = 'text', icon: Icon, required = true, half = false }) => (
    <div className={`relative ${half ? 'flex-1' : 'w-full'}`}>
      {Icon && (
        <Icon
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none"
        />
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name]}
        onChange={onChangeHandler}
        required={required}
        className={`w-full h-12 bg-white/80 border border-pink-100 rounded-2xl text-sm text-gray-700 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200
          ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen w-full bg-[#fde8f0] relative">

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-10 w-64 h-64 bg-rose-200/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-fuchsia-100/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-20">

          {/* ── Page header ── */}
          <div className="flex flex-col gap-2 mb-10">
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400">Checkout</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-800"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Place Your{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                Order
              </span>
            </h1>
          </div>

          {/* ── Two-column layout ── */}
          <form onSubmit={onSubmitHandler}>
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* ══ LEFT: Delivery form ══ */}
              <div className="flex-1 flex flex-col gap-5">
                <div className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-5">

                  {/* Section label */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200">
                      <FiMapPin size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-400">Step 1</p>
                      <h2 className="text-lg font-black text-gray-800"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Delivery Information
                      </h2>
                    </div>
                  </div>

                  {/* Name row */}
                  <div className="flex gap-3">
                    <Input name="firstName" placeholder="First name" icon={FiUser} half />
                    <Input name="lastName"  placeholder="Last name"  half />
                  </div>

                  {/* Email */}
                  <Input name="email" placeholder="Email address" type="email" icon={FiMail} />

                  {/* Street */}
                  <Input name="street" placeholder="Street address" icon={FiMapPin} />

                  {/* City + State */}
                  <div className="flex gap-3">
                    <Input name="city"  placeholder="City"  half />
                    <Input name="state" placeholder="State" half />
                  </div>

                  {/* Pincode + Country */}
                  <div className="flex gap-3">
                    <Input name="pincode" placeholder="Pincode"  type="number" half />
                    <Input name="country" placeholder="Country"  half />
                  </div>

                  {/* Phone */}
                  <Input name="phone" placeholder="Phone number" type="tel" icon={FiPhone} />
                </div>
              </div>

              {/* ══ RIGHT: Summary + Payment ══ */}
              <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">

                {/* Cart summary */}
                <div className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-3xl p-6 shadow-md">
                  <CartTotal />
                </div>

                {/* Payment method */}
                <div className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-3xl p-6 shadow-md flex flex-col gap-5">

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200">
                      <FiShield size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-400">Step 2</p>
                      <h2 className="text-lg font-black text-gray-800"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Payment Method
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Razorpay */}
                    <button
                      type="button"
                      onClick={() => setMethod('razorpay')}
                      className={` relative w-full h-14 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all duration-200
                        ${method === 'razorpay'
                          ? 'border-pink-400 shadow-lg shadow-pink-200/60 scale-[1.02]'
                          : 'border-pink-100 hover:border-pink-300 bg-white/80'}`}
                    >
                      <img src={razorpay} alt="Razorpay" className="absolute inset-0 w-full h-full object-cover" />
                      {method === 'razorpay' && (
                        <span className="ml-2 text-xs font-bold text-pink-500">Selected ✓</span>
                      )}
                    </button>

                    {/* COD */}
                    <button
                      type="button"
                      onClick={() => setMethod('cod')}
                      className={`w-full h-14 rounded-2xl border-2 flex items-center justify-center gap-3 text-sm font-bold transition-all duration-200
                        ${method === 'cod'
                          ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white border-transparent shadow-lg shadow-pink-200/60'
                          : 'border-pink-100 text-gray-600 hover:border-pink-300 bg-white/80'}`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span>💵</span>
                      Cash on Delivery
                      {method === 'cod' && <span className="text-xs opacity-80">✓</span>}
                    </button>
                  </div>

                  {/* Security note */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FiShield size={12} className="text-pink-300 flex-shrink-0" />
                    <span>Your payment info is secured with 256-bit SSL encryption.</span>
                  </div>
                </div>

                {/* Place Order button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg
                    ${loading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-pink-200 hover:from-pink-500 hover:to-rose-600 hover:scale-[1.02] active:scale-100'}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    <>
                      Place Order
                      <FiChevronRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  By placing your order you agree to our{' '}
                  <span className="text-pink-400 cursor-pointer hover:underline">Terms & Conditions</span>
                </p>
              </div>

            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default PlaceOrder