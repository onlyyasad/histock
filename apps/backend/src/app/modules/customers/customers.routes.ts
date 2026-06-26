import { Router } from 'express'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaWithScope } from '../../../prisma/client'
import { CustomersService } from './customers.service'
import type {
  ICreateCustomerInput,
  IUpdateCustomerInput,
  ICreateAddressInput,
  IUpdateAddressInput,
} from './customers.interface'
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CreateAddressSchema,
  UpdateAddressSchema,
  FlagCustomerSchema,
} from './customers.validation'

const router = Router()

// Transitional binding shim — keeps the existing handlers below unchanged while the
// service is now an object literal. Removed when routes are rewritten (Task 5).
function getService(req: Express.Request & { user?: unknown }) {
  const user = req.user as { businessId: string }
  const db = prismaWithScope(user.businessId)
  return {
    list: (query: { search?: string }) => CustomersService.list(db, query),
    getById: (id: string) => CustomersService.getById(db, id),
    lookupByPhone: (phone: string) => CustomersService.lookupByPhone(db, phone),
    create: (businessId: string, data: ICreateCustomerInput) =>
      CustomersService.create(db, businessId, data),
    update: (id: string, data: IUpdateCustomerInput) => CustomersService.update(db, id, data),
    softDelete: (id: string) => CustomersService.softDelete(db, id),
    addAddress: (businessId: string, id: string, data: ICreateAddressInput) =>
      CustomersService.addAddress(db, businessId, id, data),
    updateAddress: (
      businessId: string,
      id: string,
      addressId: string,
      data: IUpdateAddressInput,
    ) => CustomersService.updateAddress(db, businessId, id, addressId, data),
    flag: (id: string, reason: string) => CustomersService.flag(db, id, reason),
    unflag: (id: string) => CustomersService.unflag(db, id),
  }
}

// GET /api/v1/customers?search=...
router.get('/', requireSeller, async (req, res, next) => {
  try {
    const customers = await getService(req).list({
      search: req.query.search as string | undefined,
    })
    res.json(customers)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/customers/lookup?phone=... — must be before /:id
router.get('/lookup', requireSeller, async (req, res, next) => {
  try {
    const phone = req.query.phone as string
    if (!phone) return res.status(400).json({ error: 'phone query param required' })
    const customer = await getService(req).lookupByPhone(phone)
    res.json(customer ?? null)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/customers/:id
router.get('/:id', requireSeller, async (req, res, next) => {
  try {
    const customer = await getService(req).getById(req.params.id as string)
    if (!customer) return res.status(404).json({ error: 'Not found' })
    res.json(customer)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/customers
router.post('/', requireSeller, async (req, res, next) => {
  try {
    const parsed = CreateCustomerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const user = req.user as { businessId: string }
    const customer = await getService(req).create(user.businessId, parsed.data)
    res.status(201).json(customer)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/customers/:id
router.patch('/:id', requireSeller, async (req, res, next) => {
  try {
    const parsed = UpdateCustomerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const customer = await getService(req).update(req.params.id as string, parsed.data)
    res.json(customer)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/customers/:id (soft delete)
router.delete('/:id', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    await getService(req).softDelete(req.params.id as string)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/customers/:id/addresses
router.post('/:id/addresses', requireSeller, async (req, res, next) => {
  try {
    const parsed = CreateAddressSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const user = req.user as { businessId: string }
    const address = await getService(req).addAddress(
      user.businessId,
      req.params.id as string,
      parsed.data,
    )
    res.status(201).json(address)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/customers/:id/addresses/:addressId
router.patch('/:id/addresses/:addressId', requireSeller, async (req, res, next) => {
  try {
    const parsed = UpdateAddressSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const user = req.user as { businessId: string }
    const address = await getService(req).updateAddress(
      user.businessId,
      req.params.id as string,
      req.params.addressId as string,
      parsed.data,
    )
    res.json(address)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/customers/:id/flag
router.post('/:id/flag', requireSeller, async (req, res, next) => {
  try {
    const parsed = FlagCustomerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const customer = await getService(req).flag(req.params.id as string, parsed.data.reason)
    res.json(customer)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/customers/:id/flag
router.delete('/:id/flag', requireSeller, async (req, res, next) => {
  try {
    const customer = await getService(req).unflag(req.params.id as string)
    res.json(customer)
  } catch (err) {
    next(err)
  }
})

export { router as customersRoutes }
