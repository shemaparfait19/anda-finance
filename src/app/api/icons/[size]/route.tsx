import { ImageResponse } from 'next/og';

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam) || 192;
  const pad = Math.round(size * 0.22);
  const iconSize = size - pad * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: size, height: size,
          background: '#0d1526',
          borderRadius: Math.round(size * 0.2),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Logo: stacked layers paths scaled to iconSize */}
        <svg
          width={iconSize} height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
