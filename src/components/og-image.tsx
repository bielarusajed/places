interface OgImageProps {
  name: string;
  description: string;
  mapBase64: string | null;
}

export function OgImage({ name, description, mapBase64 }: OgImageProps) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        backgroundColor: '#18181b',
      }}
    >
      {mapBase64 && (
        <img
          src={mapBase64}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(to top, rgba(24, 24, 27, 0.95) 0%, rgba(24, 24, 27, 0.7) 50%, rgba(24, 24, 27, 0.4) 100%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 48,
          paddingBottom: 96,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            color: '#fafafa',
            marginBottom: 4,
            fontFamily: 'Noto Sans',
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#a1a1aa',
            fontFamily: 'Noto Sans',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
