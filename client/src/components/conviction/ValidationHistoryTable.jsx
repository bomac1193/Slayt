import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function ValidationHistoryTable({ validations, onRefresh }) {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterArchetype, setFilterArchetype] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const archetypes = ['all', ...new Set(validations.map(v => v.predicted?.archetypeMatch?.designation).filter(Boolean))];

  const filteredValidations = validations.filter(v => {
    if (filterArchetype === 'all') return true;
    return v.predicted?.archetypeMatch?.designation === filterArchetype;
  });

  const sortedValidations = [...filteredValidations].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'date':
        aVal = new Date(a.validatedAt || a.createdAt);
        bVal = new Date(b.validatedAt || b.createdAt);
        break;
      case 'accuracy':
        aVal = a.validation?.accuracy || 0;
        bVal = b.validation?.accuracy || 0;
        break;
      case 'predicted':
        aVal = a.predicted?.convictionScore || 0;
        bVal = b.predicted?.convictionScore || 0;
        break;
      case 'actual':
        aVal = a.actual?.engagementScore || 0;
        bVal = b.actual?.engagementScore || 0;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedValidations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedValidations = sortedValidations.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-dark-100';
    return 'text-dark-300';
  };

  const getArchetypeGlyph = (archetype) => {
    const glyphs = {
      Architect: 'AR',
      Maven: 'MV',
      Maverick: 'MK',
      Artisan: 'AT',
      Sage: 'SG',
      Alchemist: 'AL',
      Titan: 'TN',
      Muse: 'MS',
      Oracle: 'OR',
      Phoenix: 'PX'
    };
    return glyphs[archetype] || 'NA';
  };

  if (validations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400 mb-2">No validations yet</p>
        <p className="text-dark-500 text-sm">
          Validations will appear here once your scheduled posts have been published and performance data is collected.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={filterArchetype}
          onChange={(e) => {
            setFilterArchetype(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8 border border-dark-700 bg-dark-800 px-2 text-xs text-dark-200 outline-none"
        >
          {archetypes.map(archetype => (
            <option key={archetype} value={archetype}>
              {archetype === 'all' ? 'All archetypes' : `${getArchetypeGlyph(archetype)} ${archetype}`}
            </option>
          ))}
        </select>

        <div className="text-xs text-dark-500">
          {paginatedValidations.length} of {filteredValidations.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-500">
                <button onClick={() => handleSort('date')} className="hover:text-dark-200 transition-colors">
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
                </button>
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-500">
                Content
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-500">
                Archetype
              </th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-500">
                <button onClick={() => handleSort('predicted')} className="hover:text-dark-200 transition-colors ml-auto">
                  Predicted {sortBy === 'predicted' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
                </button>
              </th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-500">
                <button onClick={() => handleSort('actual')} className="hover:text-dark-200 transition-colors ml-auto">
                  Actual {sortBy === 'actual' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
                </button>
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-dark-500">
                Delta
              </th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-500">
                <button onClick={() => handleSort('accuracy')} className="hover:text-dark-200 transition-colors ml-auto">
                  Accuracy {sortBy === 'accuracy' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedValidations.map((validation, index) => {
              const predicted = validation.predicted?.convictionScore || 0;
              const actual = validation.actual?.engagementScore || 0;
              const accuracy = validation.validation?.accuracy || 0;
              const delta = actual - predicted;
              const archetype = validation.predicted?.archetypeMatch?.designation;

              return (
                <tr
                  key={validation._id || index}
                  className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                >
                  <td className="py-2.5 px-3 text-xs text-dark-300">
                    {new Date(validation.validatedAt || validation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      {validation.content?.image && (
                        <img
                          src={validation.content.image}
                          alt=""
                          className="w-8 h-8 object-cover"
                        />
                      )}
                      <div className="text-xs text-dark-300 truncate max-w-xs">
                        {validation.content?.caption || 'No caption'}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs">
                    {archetype && (
                      <span className="text-dark-300">
                        {getArchetypeGlyph(archetype)} {archetype}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs font-medium text-white">
                    {Math.round(predicted)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs font-medium text-white">
                    {Math.round(actual)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-xs font-medium ${
                      delta > 0 ? 'text-dark-100' : delta < 0 ? 'text-dark-300' : 'text-dark-400'
                    }`}>
                      {delta > 0 ? '+' : ''}{Math.round(delta)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`text-xs font-medium ${getAccuracyColor(accuracy)}`}>
                      {Math.round(accuracy)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-dark-500">
            {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center border border-dark-700 text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center border border-dark-700 text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ValidationHistoryTable;
