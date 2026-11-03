import { useEffect, useRef, useState } from 'react';

type TaglineRevealProps = {
	lines: [string, string];
};

function Word({ value }: { value: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	const [active, setActive] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setActive(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				setActive(true);
				observer.disconnect();
			},
			{ rootMargin: '-30% 0px -30% 0px', threshold: 0.5 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<span
			ref={ref}
			className={`inline-block transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'text-white' : 'text-white/30'}`}
		>
			{value}
		</span>
	);
}

function Line({ text }: { text: string }) {
	const words = text.split(' ');
	return (
		<span className="block">
			{words.map((word, index) => (
				<span key={`${word}-${index}`}>
					<Word value={word} />
					{index < words.length - 1 ? ' ' : ''}
				</span>
			))}
		</span>
	);
}

export function TaglineReveal({ lines }: TaglineRevealProps) {
	return (
		<p className="max-w-copy text-4xl font-semibold text-balance sm:text-5xl">
			<Line text={lines[0]} />
			<Line text={lines[1]} />
		</p>
	);
}
