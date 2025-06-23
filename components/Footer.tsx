
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 text-center mt-auto">
      <p className="text-sm text-slate-400">
        © {new Date().getFullYear()} Generador de Informes SEO. Potenciado por IA.
      </p>
    </footer>
  );
};
