import {uploadOnCloudinary} from "../config/cloudinary.js"
import Product from "../model/productModel.js"

export const addProduct = async(req, res) => {
    try{
        let {name, description, price,gender, category, subCategory,sizes, bestseller} = req.body

        const image1 = req.files?.image1?.[0] ? await uploadOnCloudinary(req.files.image1[0].path) : "";
        const image2 = req.files?.image2?.[0] ? await uploadOnCloudinary(req.files.image2[0].path) : "";
        const image3 = req.files?.image3?.[0] ? await uploadOnCloudinary(req.files.image3[0].path) : "";
        const image4 = req.files?.image4?.[0] ? await uploadOnCloudinary(req.files.image4[0].path) : "";

        let productData = {
            name, 
            description, 
            price :Number(price), 
            gender,
            category, 
            subCategory,
            sizes : sizes ? JSON.parse(sizes) : [],
            bestseller: bestseller === "true" || bestseller === true,
            date : Date.now(),
            image1,
            image2,
            image3,
            image4
        }

        const product = await Product.create(productData)

        return res.status(201).json(product)
    }
    catch(error){
        console.log("Add product error");
        res.status(500).json({message: `Add product error ${error} `});
    }
}

export const listProduct = async(req,res) => {
    try{
        const product = await Product.find({})
        return res.status(200).json(product)
    }
    catch(error)
    {
         console.log("List product error");
        res.status(500).json({message: `List product error ${error} `});
    }
}

export const removeProduct = async(req,res) =>{
    try{
        let {id} = req.params;
        const product = await Product.findByIdAndDelete(id)
        return res.status(200).json(product)
    }
    catch(error){
        console.log("Remove product error");
        res.status(500).json({message: `Remove product error ${error} `});
    }
}