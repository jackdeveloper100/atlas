/**
 * components/Layout.jsx
 *
 * Base layout wrapper for all pages. Phase 0: minimal structure with
 * responsive container. Future phases will add header, navigation, and footer.
 */

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Phase 2+: Add header/nav here */}
      
      <main className="flex-1">
        {children}
      </main>

      {/* Phase 2+: Add footer here */}
    </div>
  );
}

export default Layout;
