// src/components/public/PublicButton.tsx
import Link from "next/link";
import { ReactNode } from "react";

type BaseProps = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

type ButtonProps = BaseProps & {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type LinkButtonProps = BaseProps & {
  href: string;
  external?: boolean;
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition focus:outline-none focus:ring-2 focus:ring-offset-2";

/**
 * Botón primario para acciones principales.
 */
export function PrimaryButton({
  children,
  className = "",
  size = "md",
  icon,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Botón secundario para acciones secundarias.
 */
export function SecondaryButton({
  children,
  className = "",
  size = "md",
  icon,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Link con estilo de botón primario.
 */
export function PrimaryButtonLink({
  children,
  className = "",
  size = "md",
  icon,
  href,
  external = false,
}: LinkButtonProps) {
  const styles = `${baseStyles} ${sizeStyles[size]} bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-blue-500 ${className}`;
  
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles}>
        {icon}
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className={styles}>
      {icon}
      {children}
    </Link>
  );
}

/**
 * Link con estilo de botón secundario.
 */
export function SecondaryButtonLink({
  children,
  className = "",
  size = "md",
  icon,
  href,
  external = false,
}: LinkButtonProps) {
  const styles = `${baseStyles} ${sizeStyles[size]} border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 focus:ring-blue-500 ${className}`;
  
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles}>
        {icon}
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className={styles}>
      {icon}
      {children}
    </Link>
  );
}

/**
 * Link con estilo de texto (para CTAs inline).
 */
export function TextLink({
  children,
  href,
  className = "",
  external = false,
}: {
  children: ReactNode;
  href: string;
  className?: string;
  external?: boolean;
}) {
  const styles = `inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline ${className}`;
  
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles}>
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}
