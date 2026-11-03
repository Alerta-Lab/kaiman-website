import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	variant?: 'primary' | 'secondary' | 'danger';
};

const styles = {
	primary: 'bg-primary text-white hover:bg-primary-700',
	secondary: 'border border-black-stroke bg-white text-black hover:bg-primary-100',
	danger: 'bg-error-700 text-white hover:bg-error',
};

export function Button({ children, variant = 'primary', className = '', ...props }: Props) {
	return (
		<button
			className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
