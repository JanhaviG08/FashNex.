import jwt from 'jsonwebtoken'

/**
 * userAuth middleware
 * Verifies the JWT stored in cookies and attaches req.userId.
 * This matches your existing auth pattern (cookie-based sessions).
 */
export const userAuth = async (req, res, next) => {
  try {
    // Try cookie first (your existing auth style), then Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please login.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId    = decoded.id || decoded.userId || decoded._id

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session. Please login again.' })
  }
}