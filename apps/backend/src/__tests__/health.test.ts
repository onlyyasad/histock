import request from 'supertest'
import app from '../app'

describe('GET /health', () => {
  it('returns 200 with ok:true', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true })
  })
})
