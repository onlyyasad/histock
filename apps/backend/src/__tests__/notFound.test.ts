import request from 'supertest'
import app from '../app'

describe('not found handler', () => {
  it('returns a standardized 404 for an unknown api route', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, message: 'Not Found' })
  })
})
