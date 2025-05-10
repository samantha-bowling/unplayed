import React from "react";

interface SectionHeadingProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const SectionHeading = ({ children, actions }: SectionHeadingProps) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-2xl flex items-center">
      {children}
      <span className="ml-1 animate-pulse">_</span>
    </h3>
    {actions}
  </div>
);

export default SectionHeading;
