/**
 * Loading skeleton for RichTextEditor component
 * Displays while the heavy RichTextEditor component is being lazy loaded
 */
export function RichTextEditorSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {/* Toolbar */}
      <div className="border border-gray-200 rounded-t-lg p-2 bg-gray-50">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="border border-gray-200 border-t-0 rounded-b-lg p-4 min-h-[200px] bg-white space-y-3">
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
