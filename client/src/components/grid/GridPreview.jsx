import { Instagram, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

function GridPreview({ posts, layout }) {
  const cols = layout?.cols || 3;

  return (
    <div className="max-w-md mx-auto bg-dark-800 rounded-2xl overflow-hidden border border-dark-700">
      {/* Profile Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple via-accent-pink to-accent-orange p-0.5">
            <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center">
              <span className="text-2xl font-bold text-dark-200">PP</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-2">
              <div className="text-center">
                <p className="font-semibold text-dark-100">{posts.length}</p>
                <p className="text-xs text-dark-400">posts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-dark-100">12.4K</p>
                <p className="text-xs text-dark-400">followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-dark-100">892</p>
                <p className="text-xs text-dark-400">following</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <p className="font-semibold text-dark-100">Your Brand</p>
          <p className="text-sm text-dark-300">Creator | Designer | Dreamer</p>
          <p className="text-sm text-dark-400 mt-1">linktr.ee/yourbrand</p>
        </div>
        <button className="w-full mt-4 py-1.5 bg-dark-700 text-dark-200 text-sm font-medium rounded-lg hover:bg-dark-600 transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-dark-700">
        <button className="flex-1 py-3 border-b-2 border-dark-100">
          <svg className="w-6 h-6 mx-auto text-dark-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button className="flex-1 py-3 text-dark-500">
          <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button className="flex-1 py-3 text-dark-500">
          <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {posts.map((post) => (
          <div key={post.id} className="aspect-square bg-dark-700 overflow-hidden">
            {post.image ? (
              <img
                src={post.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: post.color || '#3f3f46' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-dark-400">No posts to preview</p>
        </div>
      )}
    </div>
  );
}

export default GridPreview;
