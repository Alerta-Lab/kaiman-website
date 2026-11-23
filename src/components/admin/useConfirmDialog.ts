import { useCallback, useEffect, useRef, useState } from 'react';

type Confirmation = { description: string; danger?: boolean };

/** Await the shared modal instead of using the browser's blocking confirm(). */
export function useConfirmDialog() {
	const [pending, setPending] = useState<Confirmation | null>(null);
	const resolver = useRef<((accepted: boolean) => void) | null>(null);
	const confirm = useCallback((description: string, danger = false) => new Promise<boolean>((resolve) => {
		resolver.current?.(false);
		resolver.current = resolve;
		setPending({ description, danger });
	}), []);
	const settle = useCallback((accepted: boolean) => {
		const resolve = resolver.current;
		resolver.current = null;
		setPending(null);
		resolve?.(accepted);
	}, []);
	useEffect(() => () => { resolver.current?.(false); resolver.current = null; }, []);
	return { confirm, pending, onCancel: () => settle(false), onConfirm: () => settle(true) };
}
