import { RequestHandler } from 'express'

const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorMessages: [{ path: req.originalUrl, message: 'API Not Found' }],
  })
}

export default notFound
