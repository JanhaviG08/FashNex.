import Order from "../model/orderModel.js";
import User from "../model/userModel.js" 
import razorpay from 'razorpay'
import crypto from "crypto";
import dotenv from 'dotenv'

dotenv.config()

const currency = 'inr'

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// for user
export const placeOrder = async(req, res) =>{
    try{
        const {items, amount, address} = req.body
        const userId = req.userId;
        console.log("BODY:", req.body)
        const orderData ={
            items,
            amount,
            userId,
            address,
            paymentMethod: 'COD',
            payment:false,
            date:Date.now()
        }

        const newOrder = new Order(orderData)
        await newOrder.save()

        if (userId) {
            await User.findByIdAndUpdate(userId, { cartData: {} })
        }
        return res.status(201).json({message: 'Order Place Successfully'})
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: error.message })
    }
}



export const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, amount, address } = req.body
    const userId = req.userId

    const orderData = {
      items,
      amount,
      userId,
      address,
      paymentMethod: 'Razorpay',
      payment: false,
      date: Date.now()
    }

    const newOrder = new Order(orderData)
    await newOrder.save()

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: newOrder._id.toString()
    }

    const order = await razorpayInstance.orders.create(options)

    // ✅ SAVE razorpay order id in DB
    await Order.findByIdAndUpdate(newOrder._id, {
        razorpayOrderId: order.id
    })

    return res.status(200).json(order)

  } catch (error) {
    console.log("RAZORPAY ERROR:", error)
    return res.status(500).json({ message: error.message })
  }
}



export const verifyRazorpay = async (req, res) => {
  try {
    const userId = req.userId;

    const { razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    console.log("ORDER INFO:", orderInfo);

    // ✅ DIRECTLY UPDATE (no status check)
    await Order.findByIdAndUpdate(orderInfo.receipt, {
      payment: true
    });

    await User.findByIdAndUpdate(userId, { cartData: {} });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.log("VERIFY ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};


export const userOrders = async(req,res) =>{
    try{
        const userId = req.userId;
        const orders = await Order.find({userId});
        return res.status(200).json(orders)
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: "userOrder error"});
    }
}


// for admin
export const allOrders = async(req,res) =>{
    try{
        const orders = await Order.find({})
        res.status(200).json(orders)

    }
    catch(error){
        console.log(error);
        return res.status(500).json({message:"admin orders error"})
    }
}

export const updateStatus=  async(req,res) =>{
    try{
        const {orderId, status}= req.body

        await Order.findByIdAndUpdate(orderId, {status})
        return res.status(201).json({message:"Status Updated"})
    }
     catch(error){
        console.log(error);
        return res.status(500).json({message:"Status update error"})
    }
}