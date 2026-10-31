import { useEffect, useState, type FormEvent } from 'react'

import { EmptyState, Spinner } from '../../components/Feedback'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'
import { useAsync } from '../../hooks/useAsync'
import { useCategories } from '../../hooks/useCatalog'
import { api, errorMessage, query } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { toast } from '../../store/toasts'
import type { AdminProduct, CategoryBrief, Paginated } from '../../types'

interface FormState {
  name: string
  sku: string
  summary: string
  description: string
  highlights: string
  price: string
  compare_at_price: string
  stock: string
  category_id: string
  is_active: boolean
  is_featured: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  sku: '',
  summary: '',
  description: '',
  highlights: '',
  price: '',
  compare_at_price: '',
  stock: '0',
  category_id: '',
  is_active: true,
  is_featured: false,
}

export function AdminProducts() {
  const { categories } = useCategories()

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const list = useAsync(
    (signal) =>
      api.get<Paginated<AdminProduct>>(
        `/admin/products/${query({ search: debounced, page, page_size: 20 })}`,
        { signal },
      ),
    [debounced, page],
  )

  const remove = async (product: AdminProduct) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/products/${product.slug}/`)
      toast.success('Product deleted.')
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const toggle = async (product: AdminProduct, field: 'is_active' | 'is_featured') => {
    try {
      await api.patch(`/admin/products/${product.slug}/`, {
        [field]: !product[field],
      })
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Products</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {list.data?.count ?? 0} products in the catalog
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="btn-primary btn-sm"
        >
          <Icon name="plus" className="h-4 w-4" /> New product
        </button>
      </div>

      <div className="relative max-w-sm">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or SKU"
          className="field pl-9"
        />
      </div>

      {list.loading ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-6 w-6 text-ink-muted" />
        </div>
      ) : list.error ? (
        <EmptyState icon="alert" title="Could not load products" description={list.error} />
      ) : (list.data?.results.length ?? 0) === 0 ? (
        <EmptyState title="No products found" description="Try a different search term." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-sand-200 bg-sand-50/70 text-left text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold">Active</th>
                  <th className="px-4 py-3 text-center font-semibold">Featured</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {list.data?.results.map((product) => (
                  <tr key={product.id} className="hover:bg-sand-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="text-[11px] text-ink-faint">
                            {product.sku || 'No SKU'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{product.category?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`tabular-nums ${
                          product.stock === 0
                            ? 'font-medium text-red-600'
                            : product.stock < 5
                              ? 'text-amber-700'
                              : ''
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(product, 'is_active')}
                        className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                          product.is_active ? 'bg-emerald-600' : 'bg-sand-300'
                        }`}
                        aria-label="Toggle active"
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                            product.is_active ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(product, 'is_featured')}
                        aria-label="Toggle featured"
                        className={product.is_featured ? 'text-ember' : 'text-sand-300'}
                      >
                        <Icon
                          name="star"
                          className="h-4 w-4"
                          fill={product.is_featured ? 'currentColor' : 'none'}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(product)}
                          className="btn-ghost px-2"
                          aria-label="Edit product"
                        >
                          <Icon name="box" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          className="btn-ghost px-2 text-red-600 hover:bg-red-50"
                          aria-label="Delete product"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        numPages={list.data?.num_pages ?? 1}
        onChange={setPage}
      />

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          categories={categories.map(({ id, name, slug, icon, accent }) => ({
            id,
            name,
            slug,
            icon,
            accent,
          }))}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            list.reload()
          }}
        />
      )}
    </div>
  )
}

function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null
  categories: CategoryBrief[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(
    product
      ? {
          name: product.name,
          sku: product.sku,
          summary: product.summary,
          description: product.description,
          highlights: (product.highlights ?? []).join('\n'),
          price: String(product.price),
          compare_at_price: product.compare_at_price
            ? String(product.compare_at_price)
            : '',
          stock: String(product.stock),
          category_id: String(product.category?.id ?? ''),
          is_active: product.is_active,
          is_featured: product.is_featured,
        }
      : { ...EMPTY_FORM, category_id: String(categories[0]?.id ?? '') },
  )
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const body = new FormData()
    body.append('name', form.name)
    body.append('sku', form.sku)
    body.append('summary', form.summary)
    body.append('description', form.description)
    body.append('highlights', JSON.stringify(
      form.highlights
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ))
    body.append('price', form.price)
    if (form.compare_at_price) body.append('compare_at_price', form.compare_at_price)
    body.append('stock', form.stock)
    body.append('category_id', form.category_id)
    body.append('is_active', String(form.is_active))
    body.append('is_featured', String(form.is_featured))
    if (image) body.append('image', image)

    try {
      if (product) {
        await api.patch(`/admin/products/${product.slug}/`, body, { form: true })
      } else {
        await api.post('/admin/products/', body, { form: true })
      }
      toast.success(product ? 'Product updated.' : 'Product created.')
      onSaved()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <h2 className="display text-xl">{product ? 'Edit product' : 'New product'}</h2>
          <button type="button" onClick={onClose} className="btn-ghost px-2" aria-label="Close">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label">Name</label>
              <input
                required
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="field-label">SKU</label>
              <input
                value={form.sku}
                onChange={(event) => update('sku', event.target.value)}
                className="field"
                placeholder="SB-XXX-000"
              />
            </div>

            <div>
              <label className="field-label">Category</label>
              <select
                required
                value={form.category_id}
                onChange={(event) => update('category_id', event.target.value)}
                className="field"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Summary</label>
              <input
                value={form.summary}
                onChange={(event) => update('summary', event.target.value)}
                className="field"
                maxLength={240}
                placeholder="One-line pitch shown on cards"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={3}
                className="field resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Highlights (one per line)</label>
              <textarea
                value={form.highlights}
                onChange={(event) => update('highlights', event.target.value)}
                rows={3}
                className="field resize-none"
                placeholder={'40 mm drivers\n38-hour battery'}
              />
            </div>

            <div>
              <label className="field-label">Price</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(event) => update('price', event.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="field-label">Compare-at price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.compare_at_price}
                onChange={(event) => update('compare_at_price', event.target.value)}
                className="field"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="field-label">Stock</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => update('stock', event.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="field-label">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                className="field py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 border-t border-sand-200 pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => update('is_active', event.target.checked)}
                className="h-4 w-4 rounded border-sand-300 text-ember"
              />
              Visible in store
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => update('is_featured', event.target.checked)}
                className="h-4 w-4 rounded border-sand-300 text-ember"
              />
              Featured
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-800">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-sand-200 pt-4">
            <button type="button" onClick={onClose} className="btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary btn-sm">
              {busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
