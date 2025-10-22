import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const Input = ({ value, onChange, label, placeholder, type }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-4">
      {label && (
        <label className="text-[13px] text-slate-800 block mb-1">{label}</label>
      )}
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
        <input
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm"
          value={value}
          onChange={onChange}
        />
        {type === "password" &&
          (showPassword ? (
            <FaRegEye
              size={18}
              className="text-slate-500 cursor-pointer"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <FaRegEyeSlash
              size={18}
              className="text-slate-400 cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          ))}
      </div>
    </div>
  );
};

export default Input;
