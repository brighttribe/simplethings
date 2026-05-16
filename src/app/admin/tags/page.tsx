'use client'

import { useState, useEffect } from 'react'

interface Tag { id: string; name: string; slug: string }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/tags')
    setTags(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    setName('')
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this tag?')) return
    await fetch('/api/tags', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Tags</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tag name"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50">Add</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Slug</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tags.map(tag => (
              <tr key={tag.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{tag.name}</td>
                <td className="px-4 py-2.5 text-gray-400">{tag.slug}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(tag.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
