import { useState } from 'react';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function VegetableCard({ vegetable, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    await onToggle(vegetable._id);
    setToggling(false);
  }

  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        vegetable.availableToday
          ? 'border-primary-200 shadow-sm'
          : 'border-gray-200 opacity-75'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{vegetable.emoji || '🥬'}</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{vegetable.name}</h3>
            <p className="text-primary-600 font-bold text-lg">
              ₹{vegetable.pricePerKg}
              <span className="text-sm font-normal text-gray-400">/{vegetable.unit}</span>
            </p>
          </div>
        </div>
        <button
          id={`toggle-veg-${vegetable._id}`}
          onClick={handleToggle}
          disabled={toggling}
          className={`p-1 rounded-lg transition-colors ${toggling ? 'opacity-50' : ''}`}
          title={vegetable.availableToday ? 'Mark Unavailable' : 'Mark Available'}
        >
          {vegetable.availableToday ? (
            <ToggleRight size={28} className="text-primary-500" />
          ) : (
            <ToggleLeft size={28} className="text-gray-300" />
          )}
        </button>
      </div>

      {/* Stock info */}
      {vegetable.stock > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Stock</span>
            <span>{vegetable.stock} {vegetable.unit}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                vegetable.stock <= (vegetable.lowStockThreshold || 5)
                  ? 'bg-red-400'
                  : 'bg-primary-400'
              }`}
              style={{ width: `${Math.min((vegetable.stock / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            vegetable.availableToday
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {vegetable.availableToday ? '✅ Available Today' : '❌ Unavailable'}
        </span>

        <div className="flex gap-2">
          <button
            id={`edit-veg-${vegetable._id}`}
            onClick={() => onEdit(vegetable)}
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all active:scale-[0.95]"
            title="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            id={`delete-veg-${vegetable._id}`}
            onClick={() => onDelete(vegetable._id)}
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-all active:scale-[0.95]"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
