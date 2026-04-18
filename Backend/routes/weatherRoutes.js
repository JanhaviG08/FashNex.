import express from 'express'
import { getWeather, getWeatherRecommendations } from '../controller/weatherController.js'

const router = express.Router()

// GET /api/weather?city=Mumbai              — raw weather data
// GET /api/weather?lat=19.0760&lon=72.8777  — by coordinates
router.get('/', getWeather)

// GET /api/recommendations/weather?city=Mumbai — weather + matched products
router.get('/weather', getWeatherRecommendations)

export default router