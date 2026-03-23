'use client';

export default function TestPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Check</h1>
      <div className="space-y-2">
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
          {url ? <span className="text-green-600">{url}</span> : <span className="text-red-600">MISSING</span>}
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
          {key ? <span className="text-green-600">{key.substring(0, 20)}...</span> : <span className="text-red-600">MISSING</span>}
        </p>
      </div>
    </div>
  );
}
