import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-center py-6 border-t border-brand-blue/20 mt-auto"> {/* Ensured margin-top auto and subtle top border */}
      <p className="text-sm text-brand-blue/90"> {/* Adjusted opacity for better contrast */}
        &copy; {new Date().getFullYear()} HOBBY REEL. Powered by Your Video Production Co.
      </p>
    </footer>
  );
};

export default Footer;