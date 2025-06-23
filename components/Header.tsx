
import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="w-full text-center py-4">
      <img src="/logo.jpg" alt="Aquilae Tools Logo" className="h-16 mx-auto" />
    </header>
  );
};
