import React from 'react';

export type ChrisPose = 'IDLE' | 'RUN' | 'CATCH';

interface ChrisSpriteProps {
  pose: ChrisPose;
  facingRight: boolean;
  className?: string;
}

export const ChrisSprite: React.FC<ChrisSpriteProps> = ({ pose, facingRight, className }) => {
  // Pixel Grid: 16x24
  
  const C = {
    hair: '#5D4037',   // Dark Brown
    skin: '#FFDCB1',   // Light Tan
    shirt: '#F97316',  // Orange-500
    pants: '#1F2937',  // Gray-800
    black: '#000000',  // Black
    white: '#FFFFFF'
  };

  const Rect = ({x, y, w, h, c, opacity, fillOpacity}: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    c: string;
    opacity?: number;
    fillOpacity?: number;
  }) => (
    <rect x={x} y={y} width={w||1} height={h||1} fill={c} opacity={opacity} fillOpacity={fillOpacity} />
  );

  const Head = () => (
    <g>
      {/* Hair Top */}
      <Rect x={4} y={1} w={8} h={2} c={C.hair} />
      <Rect x={3} y={2} w={10} h={2} c={C.hair} />
      <Rect x={2} y={3} w={1} h={3} c={C.hair} />
      <Rect x={13} y={3} w={1} h={3} c={C.hair} />
      
      {/* Face */}
      <Rect x={3} y={4} w={10} h={5} c={C.skin} />
      <Rect x={4} y={9} w={8} h={1} c={C.skin} />
      
      {/* Glasses */}
      <Rect x={3} y={5} w={10} h={1} c={C.black} /> 
      <Rect x={3} y={5} w={1} h={2} c={C.black} /> {/* L Frame */}
      <Rect x={12} y={5} w={1} h={2} c={C.black} /> {/* R Frame */}
      <Rect x={7} y={5} w={2} h={1} c={C.black} /> {/* Bridge */}
      <Rect x={4} y={5} w={3} h={1} c={C.skin} fillOpacity={0.5} /> {/* Lens L */}
      <Rect x={9} y={5} w={3} h={1} c={C.skin} fillOpacity={0.5} /> {/* Lens R */}

      {/* Smile */}
      <Rect x={6} y={8} w={4} h={1} c={C.hair} />
      <Rect x={12} y={4} w={1} h={2} c={C.skin} /> {/* Ear R */}
      <Rect x={3} y={4} w={1} h={2} c={C.skin} /> {/* Ear L */}
    </g>
  );

  const BodyIdle = () => (
    <g>
      {/* Shirt Body */}
      <Rect x={4} y={10} w={8} h={7} c={C.shirt} />
      {/* Collar */}
      <Rect x={6} y={10} w={4} h={1} c={C.white} opacity={0.3} />
      
      {/* Arms Idle */}
      <Rect x={3} y={10} w={1} h={5} c={C.skin} /> 
      <Rect x={12} y={10} w={1} h={5} c={C.skin} /> 
      
      {/* Pants */}
      <Rect x={4} y={17} w={8} h={2} c={C.pants} />
      <Rect x={4} y={19} w={3} h={4} c={C.pants} /> {/* Leg L */}
      <Rect x={9} y={19} w={3} h={4} c={C.pants} /> {/* Leg R */}
      
      {/* Shoes */}
      <Rect x={3} y={22} w={4} h={1} c={C.black} />
      <Rect x={9} y={22} w={4} h={1} c={C.black} />
    </g>
  );

  const BodyRun = () => (
     <g>
      {/* Shirt */}
      <Rect x={4} y={10} w={8} h={7} c={C.shirt} />
      <Rect x={6} y={10} w={4} h={1} c={C.white} opacity={0.3} />

      {/* Arms Pumping */}
      <Rect x={2} y={12} w={2} h={2} c={C.skin} /> {/* Back arm */}
      <Rect x={12} y={11} w={3} h={2} c={C.skin} /> {/* Fwd arm */}

      {/* Pants Running */}
      <Rect x={4} y={17} w={8} h={2} c={C.pants} />
      
      {/* Leg Back (Left) */}
      <Rect x={3} y={18} w={3} h={3} c={C.pants} /> 
      <Rect x={2} y={20} w={3} h={1} c={C.black} /> {/* Shoe */}

      {/* Leg Forward (Right) */}
      <Rect x={10} y={18} w={3} h={3} c={C.pants} />
      <Rect x={11} y={21} w={3} h={1} c={C.black} /> {/* Shoe */}
    </g>
  );

  const BodyCatch = () => (
    <g>
      {/* Shirt */}
      <Rect x={4} y={10} w={8} h={7} c={C.shirt} />
      <Rect x={6} y={10} w={4} h={1} c={C.white} opacity={0.3} />

      {/* Arms Up */}
      <Rect x={2} y={7} w={2} h={5} c={C.skin} /> 
      <Rect x={12} y={7} w={2} h={5} c={C.skin} /> 
      <Rect x={2} y={6} w={2} h={1} c={C.skin} /> {/* Hands */}
      <Rect x={12} y={6} w={2} h={1} c={C.skin} />
      
      {/* Pants Wide */}
      <Rect x={4} y={17} w={8} h={2} c={C.pants} />
      <Rect x={3} y={19} w={3} h={4} c={C.pants} />
      <Rect x={10} y={19} w={3} h={4} c={C.pants} />
      
      {/* Shoes */}
      <Rect x={2} y={22} w={4} h={1} c={C.black} />
      <Rect x={10} y={22} w={4} h={1} c={C.black} />
    </g>
  );

  return (
    <svg 
      viewBox="0 0 16 24" 
      className={`w-full h-full filter drop-shadow-md transition-transform ${!facingRight ? 'scale-x-[-1]' : ''} ${className}`}
      style={{ shapeRendering: 'crispEdges' }} // Crucial for pixel art look
    >
      <Head />
      {pose === 'IDLE' && <BodyIdle />}
      {pose === 'RUN' && <BodyRun />}
      {pose === 'CATCH' && <BodyCatch />}
    </svg>
  );
};