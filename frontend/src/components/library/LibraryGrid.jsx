/**
 * components/library/LibraryGrid.jsx
 *
 * 4-column product grid matching Screenshot 2 reference layout.
 */

import LibraryCard from './LibraryCard';

function LibraryGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full">
      {items.map((item, index) => (
        <LibraryCard key={item.id || index} item={item} />
      ))}
    </div>
  );
}

export default LibraryGrid;

