import React from "react";
export const Select = ({ children, ...props }: any) => <select {...props}>{children}</select>;
export const SelectContent = ({ children, ...props }: any) => <>{children}</>;
export const SelectItem = ({ children, value, ...props }: any) => <option value={value} {...props}>{children}</option>;
export const SelectTrigger = ({ children, ...props }: any) => <>{children}</>;
export const SelectValue = ({ placeholder, ...props }: any) => <>{placeholder}</>;
