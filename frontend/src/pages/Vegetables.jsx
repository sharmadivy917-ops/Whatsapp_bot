import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import VegetableCard from '../components/VegetableCard';
import Modal from '../components/Modal';
import { vegetableAPI } from '../services/api';
import { toast } from '../components/Toast';

const EMOJI_OPTIONS = ['🍅', '🧅', '🥔', '🥕', '🌶️', '🥦', '🍆', '🥒', '🌽', '🍋', '🥬', '🫛', '🧄', '🫑', '🥜', '🍠', '🍌', '🥭'];

export default function Vegetables() {
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVeg, setEditingVeg] = useState(null);
  const [form, setForm] = useState({
    name: '', emoji: '', pricePerKg: '', unit: 'kg',
    availableToday: true, stock: '', lowStockThreshold: '5',
  });

  useEffect(() => {
    fetchVegetables();
  }, []);

  async function fetchVegetables() {
    try {
      const { data } = await vegetableAPI.getAll();
      setVegetables(data);
    } catch (error) {
      toast('Failed to load vegetables', 'error');
    }
    setLoading(false);
  }

  function openAddModal() {
    setEditingVeg(null);
    setForm({
      name: '', emoji: '', pricePerKg: '', unit: 'kg',
      availableToday: true, stock: '', lowStockThreshold: '5',
    });
    setShowModal(true);
  }

  function openEditModal(veg) {
    setEditingVeg(veg);
    setForm({
      name: veg.name,
      emoji: veg.emoji,
      pricePerKg: veg.pricePerKg.toString(),
      unit: veg.unit,
      availableToday: veg.availableToday,
      stock: veg.stock?.toString() || '',
      lowStockThreshold: (veg.lowStockThreshold || 5).toString(),
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      pricePerKg: parseFloat(form.pricePerKg),
      stock: form.stock ? parseFloat(form.stock) : 0,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
    };

    try {
      if (editingVeg) {
        await vegetableAPI.update(editingVeg._id, payload);
        toast('Vegetable updated! ✅');
      } else {
        await vegetableAPI.create(payload);
        toast('Vegetable added! 🎉');
      }
      setShowModal(false);
      fetchVegetables();
    } catch (error) {
      toast(error.response?.data?.error || 'Something went wrong', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this vegetable?')) return;
    try {
      await vegetableAPI.delete(id);
      toast('Vegetable deleted');
      fetchVegetables();
    } catch (error) {
      toast('Failed to delete', 'error');
    }
  }

  async function handleToggle(id) {
    try {
      await vegetableAPI.toggle(id);
      fetchVegetables();
    } catch (error) {
      toast('Failed to toggle', 'error');
    }
  }

  async function handleToggleAll(available) {
    try {
      await vegetableAPI.toggleAll(available);
      toast(available ? 'All marked available ✅' : 'All marked unavailable');
      fetchVegetables();
    } catch (error) {
      toast('Failed to update', 'error');
    }
  }

  const filtered = vegetables.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = vegetables.filter(v => v.availableToday).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Vegetables <span className="text-gray-400 text-lg font-normal">/ सब्ज़ियाँ</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {availableCount} of {vegetables.length} available today
          </p>
        </div>
        <button id="add-vegetable-btn" onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add New Vegetable / नई सब्ज़ी
        </button>
      </div>

      {/* Search + Bulk actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="veg-search"
            type="text"
            placeholder="Search vegetables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleAll(true)}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <ToggleRight size={16} className="text-primary-500" />
            All Available
          </button>
          <button
            onClick={() => handleToggleAll(false)}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <ToggleLeft size={16} className="text-gray-400" />
            All Unavailable
          </button>
        </div>
      </div>

      {/* Vegetable Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <span className="text-5xl block mb-3">🥬</span>
          <p className="text-gray-500 text-lg">No vegetables found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Try a different search term' : 'Add your first vegetable to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((veg, idx) => (
            <div key={veg._id} className={`stagger-${Math.min(idx + 1, 6)} animate-slide-in-up`}>
              <VegetableCard
                vegetable={veg}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingVeg ? 'Edit Vegetable / सब्ज़ी बदलें' : 'Add Vegetable / नई सब्ज़ी'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Emoji (Optional)</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, emoji: '' })}
                className={`px-3 h-10 rounded-xl text-sm font-medium flex items-center justify-center transition-all ${
                  form.emoji === ''
                    ? 'bg-primary-100 ring-2 ring-primary-500 scale-105 text-primary-700'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                }`}
              >
                None
              </button>
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, emoji })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.emoji === emoji
                      ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Name <span className="text-gray-400">(नाम)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tamatar"
              className="input-field"
              required
            />
          </div>

          {/* Price & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Price (₹) <span className="text-gray-400">(कीमत)</span>
              </label>
              <input
                type="number"
                value={form.pricePerKg}
                onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                placeholder="30"
                className="input-field"
                min="0"
                step="0.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Unit <span className="text-gray-400">(इकाई)</span>
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input-field"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="piece">Piece (pc)</option>
                <option value="bunch">Bunch</option>
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Stock <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Low Stock Alert</label>
              <input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                placeholder="5"
                className="input-field"
                min="0"
              />
            </div>
          </div>

          {/* Available toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Available Today (आज उपलब्ध)</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, availableToday: !form.availableToday })}
              className={`w-11 h-6 rounded-full transition-colors duration-300 relative ${
                form.availableToday ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  form.availableToday ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary w-full mt-2">
            {editingVeg ? 'Update Vegetable ✅' : 'Add Vegetable 🥬'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
