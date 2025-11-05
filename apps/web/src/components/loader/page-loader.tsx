import React from "react";

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-neutral-300/40 backdrop-blur-sm">
      <span className="border-brand-600 h-6 w-6 animate-spin rounded-full border-4 border-t-transparent"></span>
    </div>
  );
};

export default PageLoader;
