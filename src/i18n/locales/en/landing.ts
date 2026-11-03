import type { LandingCopy } from '../es/landing';

export const landing = {
	meta: {
		title: 'Kaiman',
		description:
			'Kaiman is an artificial intelligence platform that learns about your business, understands your brand, and helps you create strategies, campaigns, images, videos, websites, and more.',
	},
	nav: {
		product: 'Product',
		how: 'How it works',
		brand: 'Brand Understanding',
		plans: 'Plans',
		playbooks: 'Playbooks',
		faq: 'FAQ',
		blog: 'Blog',
		menu: 'About Kaiman',
		login: 'Log in',
		signup: 'Start your free trial',
		openMenu: 'Open menu',
		closeMenu: 'Close menu',
		language: 'Language',
		home: 'Home',
	},
	hero: {
		eyebrow: 'Small businesses. Big marketing.',
		title: 'Rather than learning AI, let AI learn from you.',
		subtitle:
			'Kaiman is an artificial intelligence platform that learns about your business, understands your brand, and uses that knowledge to help you create strategies, campaigns, images, videos, websites, and much more.',
		support: 'All with your brand personality and knowledge of your business.',
		cta: 'Start your free trial',
		secondaryCta: 'See how it works',
	},
	demo: {
		label: 'Kaiman',
		cta: 'Watch demo',
		close: 'Close',
		title: 'Kaiman demo',
		play: 'Play',
		pause: 'Pause',
		go: 'Go',
		scroll: 'Scroll',
	},
	scroll: {
		hint: 'Scroll to fly in',
		scenes: [
			{
				label: 'Brand',
				eyebrow: 'Small businesses. Big marketing.',
				title: 'Rather than learning AI, let AI learn from you.',
				body: 'Kaiman learns about your business and uses that knowledge to help you create marketing with your brand personality.',
			},
			{
				label: 'Consistency',
				eyebrow: 'Brand Understanding',
				title: 'AI tools forget your brand after every generation.',
				body: 'Kaiman always generates for your brand.',
			},
			{
				label: 'Plan',
				eyebrow: 'From 49 USD',
				title: 'Better marketing should be within reach for your business.',
				body: 'Choose the plan that best fits your company’s needs.',
			},
		],
	},
	origin: {
		title: 'Marketing power for the entrepreneur.',
		paragraphs: [
			'For years we worked on marketing for large companies, with access to research, strategy, creativity, production, technology, and specialists.',
			'Then we met entrepreneurs, small businesses, and independent professionals who needed the same capabilities, designed for the reality of their businesses.',
			'Kaiman was born to put that power in their hands.',
		],
		closing: 'Smarter marketing, more accessible, and built around your business.',
	},
	consistency: {
		eyebrow: 'Product',
		pointsEyebrow: 'Brand details',
		secretEyebrow: 'Consistency',
		title: 'AI tools forget your brand after every generation. Kaiman always generates for your brand.',
		intro:
			'Every business needs to create marketing constantly. Today more than ever, small and mid-size companies especially need to do it to win customers.',
		body: 'Most people use artificial intelligence to create their posts. But with every new generation, their brand can lose consistency because the AI does not keep essential details present, such as:',
		points: [
			{ label: 'Colors', image: '/brand/point-colors.jpg' },
			{ label: 'Typefaces', image: '/brand/point-type.jpg' },
			{ label: 'Communication tone', image: '/brand/point-tone.jpg' },
			{ label: 'Visual style', image: '/brand/point-style.jpg' },
		],
		consequence:
			'Without those details, their content starts to look like everyone else’s and loses something fundamental: what makes their brand unique.',
		secretTitle: 'The big secret of marketing: brand consistency.',
		secretBody: 'A brand is built when people can recognize it again and again.',
		closing:
			'Kaiman keeps your brand personality in every generation so your business builds a consistent, recognizable, and ownable image without explaining it every time.',
	},
	brandUnderstanding: {
		eyebrow: 'Brand Understanding · Kaiman’s central pillar',
		title: 'Kaiman understands your business so it can work with you, like a partner.',
		intro:
			'Kaiman goes beyond remembering your logo, colors, or typefaces. It understands the business behind the brand: what you do, what you offer, who you speak to, how you communicate, and what makes your business different.',
		support:
			'That knowledge accompanies every project to help you create marketing that is relevant specifically for your business.',
		steps: [
			{
				title: 'Gets to know your business',
				body: 'Through a guided process, Kaiman learns about your services, your audience, your personality, your brand, and your goals.',
			},
			{
				title: 'Works with you',
				body: 'When you create a campaign, an image, a video, or any other communication piece, Kaiman uses what it knows about your business to help you develop a relevant and ownable result.',
			},
			{
				title: 'Learns with you',
				body: 'As you work, your decisions and preferences enrich what Kaiman understands about your business, turning it into a partner that is increasingly ready to work with you.',
			},
		],
		understandsLabel: 'Kaiman understands:',
		understands: [
			'Services',
			'Audiences',
			'Personality and tone',
			'Messages',
			'Logo',
			'Colors',
			'Typefaces',
			'Visual style',
			'Preferences',
			'What to avoid',
		],
	},
	audiences: {
		title: 'Kaiman, for every kind of small and mid-size business.',
		intro:
			'Not every business sells the same way. Kaiman understands those differences and gives them the tools to face their own marketing challenges.',
		cards: [
			{
				id: 'professionals',
				name: 'Martinez',
				title: 'Independent professionals',
				subtitle: 'Specialized services · Trust and reputation',
				lead: 'Your expertise is your product. Trust is what sells it.',
				body: 'Kaiman understands the services you offer, what makes them different, and the audiences that need them most. That knowledge helps you communicate your expertise clearly, build authority, and turn visibility into new business opportunities.',
				actions: [
					{
						title: 'Position',
						body: 'Organize and communicate your services clearly so potential clients understand what you do, what sets you apart, and why they should consider you.',
					},
					{
						title: 'Build authority',
						body: 'Turn your experience and knowledge into relevant content that shows what you know and strengthens trust in your brand.',
					},
					{
						title: 'Create visibility',
						body: 'Create and schedule content, images, videos, and campaigns to keep your brand present in front of the audiences you want to reach.',
					},
					{
						title: 'Make capture easier',
						body: 'Develop pages, messages, offers, and calls to action that make the path from discovering your brand to contacting you clearer.',
					},
				],
			},
			{
				id: 'products',
				name: 'Ana',
				title: 'Makers of their own products',
				subtitle: 'Products and launches · Demand building',
				lead: 'From having a product to building a brand.',
				body: 'Creating a good product is only the beginning. Kaiman helps you understand your market, define how to present your product, and turn that knowledge into the marketing you need to bring it to customers.',
				actions: [
					{
						title: 'Understand',
						body: 'Your product, your market, your competition, and the people most likely to buy it.',
					},
					{
						title: 'Plan',
						body: 'Define positioning, messages, audiences, channels, and a strategy to take it to market.',
					},
					{
						title: 'Create',
						body: 'Turn the strategy into images, videos, ads, content, product pages, and sales materials, all built around your brand.',
					},
					{
						title: 'Launch',
						body: 'Connect your social networks, organize your content, and schedule publishing on Meta, TikTok, LinkedIn, and YouTube with the dates, pieces, and messages you defined.',
					},
					{
						title: 'Learn',
						body: 'Use the results to understand what works and improve what you do next.',
					},
				],
			},
			{
				id: 'sellers',
				name: 'Carlos',
				title: 'Sellers and representatives',
				subtitle: 'Changing offer · Opportunity audiences',
				lead: 'The next opportunity can appear at any moment. Your marketing should be there too.',
				body: 'When what you sell changes constantly, your marketing needs to respond at the same speed. Kaiman understands your offer, your audiences, and your business to help you keep a constant presence and turn every new opportunity into relevant communication.',
				actions: [
					{
						title: 'Stay present',
						body: 'Keep active communication that builds recognition and keeps you visible even when you do not have a specific offer to promote.',
					},
					{
						title: 'React fast',
						body: 'Turn new properties, products, services, or opportunities into content, pages, videos, ads, and sales materials ready for market.',
					},
					{
						title: 'Find the audience',
						body: 'Adapt messages and pieces to the people most likely to care about each offer, without communicating everything the same way to everyone.',
					},
					{
						title: 'Multiply the opportunity',
						body: 'Take each offer to different formats and channels to expand reach and increase the chance of finding the right customer.',
					},
				],
			},
			{
				id: 'creators',
				name: 'Sofia',
				title: 'Creators, coaches, and educators',
				subtitle: 'Knowledge as product · Audience development',
				lead: 'Your audience can be anywhere. Your message needs to reach them.',
				body: 'When your knowledge, experience, or point of view is part of what you sell, you need to turn it into a brand that can grow. Kaiman understands your voice, your topics, your audience, and what you want to build so you can transform your ideas into content, products, and business opportunities.',
				actions: [
					{
						title: 'Define your voice',
						body: 'Turn your experience, personality, and point of view into a recognizable communication style that sets you apart in your category.',
					},
					{
						title: 'Grow an audience',
						body: 'Transform your ideas into relevant, consistent content to attract people interested in what you know and keep a relationship with them.',
					},
					{
						title: 'Turn knowledge into product',
						body: 'Organize what you know to develop courses, workshops, programs, guides, events, services, and other ways to turn your experience into an offer.',
					},
					{
						title: 'Multiply your reach',
						body: 'Adapt your ideas to different formats and channels —content, video, email, social, pages, and campaigns— to grow your presence without starting from zero every time.',
					},
				],
			},
		],
	},
	platform: {
		title: 'A full marketing team in one platform.',
		intro:
			'Kaiman was created to help small and mid-size businesses do better marketing, more efficiently.',
		body: 'That is why it brings strategy, creativity, production, and distribution together in one platform, without requiring you to become an expert in every tool.',
		closing:
			'And because everything starts from the same understanding of your business, you can move from a need to a strategy, from a strategy to a piece, and from a piece to a campaign without starting from zero every time.',
		items: [
			{
				title: 'Strategy',
				body: 'Understand your audience, find opportunities, and develop plans to reach your goals.',
			},
			{
				title: 'Content and creativity',
				body: 'Develop concepts, messages, images, videos, and content with your brand personality.',
			},
			{
				title: 'Digital presence',
				body: 'Create pages, sites, and digital experiences around the needs of your business.',
			},
			{
				title: 'Distribution',
				body: 'Organize, schedule, and publish your content on the channels where you need to be.',
			},
			{
				title: 'Analysis and learning',
				body: 'Understand what is working and use that knowledge to improve what you do next.',
			},
		],
	},
	efficiency: {
		title: 'More marketing capacity with less complexity, time, and effort.',
		intro:
			'Doing better marketing should not mean adding more tools, more processes, and more things to learn.',
		body: 'Kaiman brings the capabilities you need around one shared understanding of your business so you can spend less time managing marketing and more time growing your company.',
		items: [
			{
				title: 'Less complexity',
				body: 'Strategy, creativity, production, and distribution work together, without constantly jumping between disconnected platforms and processes.',
			},
			{
				title: 'Less time',
				body: 'Kaiman already knows your business and brand, so you can move from one task to the next without explaining again who you are, what you do, or how you want to communicate.',
			},
			{
				title: 'Less effort',
				body: 'You do not need to learn every new artificial intelligence tool to benefit from what it can do for your business.',
			},
			{
				title: 'Less fragmented cost',
				body: 'One platform integrates marketing capabilities that would otherwise require different tools, services, and resources.',
			},
			{
				title: 'More capacity',
				body: 'Do more of the marketing your company needs with a platform designed to work around your business.',
			},
		],
	},
	salsana: {
		title: 'Same brand, several pieces',
		body: 'Salsana is an example of pieces made from one context: product, color, and tone repeat across image and video.',
		imageAlt: 'Salsana graphic piece',
		sweetAlt: 'Salsana graphic piece, sweet line',
		videoAlt: 'Salsana video',
		generate: 'Generate',
		fullscreen: 'View fullscreen',
		close: 'Close',
		tools: {
			image: 'Image generator',
			video: 'AI video',
		},
	},
	tour: {
		title: 'Product walkthrough',
		body: 'These spaces are ready for the real product video and screenshots. You can replace each block when the material is ready.',
		slots: [
			{ title: 'Brand profile', note: 'Space for a walkthrough of the saved brand.' },
			{ title: 'Requesting a piece', note: 'Space for the moment an image or video is requested.' },
			{ title: 'Finished piece', note: 'Space for the result inside the platform.' },
		],
	},
	finder: {
		title: 'How many pieces do you need each month',
		intro:
			'Enter images, videos, scripts, audio, presentations, and websites. The result uses reference credits and points to the plan that covers that volume.',
		image: 'Images',
		video: 'Video',
		script: 'Scripts',
		audio: 'Audio',
		presentation: 'Presentations',
		website: 'Websites',
		minutes: 'minutes',
		decrease: 'Decrease',
		increase: 'Increase',
		videoLength: 'Reference video length',
		short: '5 seconds',
		medium: '15 seconds',
		empty: 'Enter at least one piece to see a plan.',
		error: 'Use whole numbers between 0 and 500.',
		creditsLabel: 'Estimated credits per month',
		planLabel: 'Plan that covers this volume',
		unitLabel: 'Reference cost per credit on that plan',
		enterprise:
			'This volume exceeds the 2,500 credits of the Premium plan. Enterprise is built to fit.',
		assumption:
			'Calculation reference: 1 credit per image, 1 credit per script, 3 credits per second of edited video (the video slider is in minutes), 2 credits per minute of audio, 5 credits per presentation, and 15 credits per website. The platform script generator currently does not charge credits; the 1 credit per script is used to size the plan.',
		perMonth: 'per month',
		cta: 'Get this plan',
	},
	plans: {
		title: 'Better marketing should be within reach for your business.',
		intro:
			'Choose the plan that best fits your company’s needs. Every Kaiman plan starts from the same Brand Understanding and gives you access to marketing capabilities designed to help you work better and more efficiently.',
		perMonth: 'per month',
		credits: 'credits',
		seat: 'seat',
		seats: 'seats',
		storage: 'GB',
		brand: 'brand',
		brands: 'brands',
		perCredit: 'per credit',
		cta: 'Start your free trial',
		enterpriseTitle: 'Enterprise',
		enterpriseBody:
			'Custom pricing. For organizations that need credits, seats, or brands beyond these three plans.',
		enterpriseCta: 'Email Alerta',
		names: {
			start: 'Basic',
			pro: 'Medium',
			scale: 'Premium',
		},
		blurbs: {
			start: 'One person, one brand, and 500 credits per month.',
			pro: 'Up to 3 seats and 1,200 credits per month.',
			scale: 'Up to 5 seats, 5 brands, and 2,500 credits per month.',
		},
	},
	packs: {
		title: 'Extra credits',
		intro:
			'If the plan allowance is not enough, the platform sells one-time packs. The credit price in these packs is higher than the monthly plan.',
		credits: 'credits',
		perCredit: 'per credit',
	},
	rates: {
		title: 'What a credit covers',
		intro: 'Reference costs published in the platform catalog. They can change by tool.',
		rows: [
			{ name: 'Ad image', detail: '1 credit per image' },
			{ name: 'Edited video', detail: '3 credits per second' },
			{ name: 'Audio / voice', detail: '2 credits per minute' },
			{ name: 'Presentation', detail: '5 credits per piece' },
			{ name: 'Website', detail: '15 credits per piece' },
			{ name: 'Script generator', detail: 'No credit charge' },
		],
	},
	playbooks: {
		title: 'You do not need to know where to start. Kaiman does.',
		eyebrow: 'Playbooks',
		intro: 'Sometimes you know what your business needs, but not every step to get there.',
		body: 'Kaiman Playbooks turn common marketing goals into guided processes that help you move step by step, using the capabilities you need at the right moment.',
		items: [
			{
				title: 'I want to launch a product',
				body: 'Define the audience, develop the positioning, create campaign messages and pieces, and prepare the launch.',
			},
			{
				title: 'I need more clients',
				body: 'Identify opportunities, define who you want to reach, and develop content and campaigns to create interest in your services.',
			},
			{
				title: 'I want to improve my social presence',
				body: 'Define what to communicate, develop content for your channels, and create a calendar to keep a consistent presence.',
			},
			{
				title: 'I need to promote something',
				body: 'Turn an offer, event, or promotion into a campaign with messages, content, and pieces adapted to the channels where you want to communicate it.',
			},
			{
				title: 'I want to build my professional brand',
				body: 'Define your positioning, organize your communication themes, and turn your experience into content that builds authority and recognition.',
			},
		],
	},
	faq: {
		title: 'Frequently asked questions',
		items: [
			{
				q: 'Do I need to know marketing to use Kaiman?',
				a: 'No. Kaiman is designed to help you do better marketing without becoming an expert. It helps you understand what you need to do and accompanies you from strategy through creation and distribution.',
			},
			{
				q: 'Do I need to know how to use artificial intelligence tools?',
				a: 'No. Kaiman integrates artificial intelligence into its capabilities so you can benefit without learning different platforms, prompts, or tools.',
			},
			{
				q: 'How does Kaiman learn about my business and brand?',
				a: 'At the start, Kaiman guides you through a process to understand your business, services or products, audiences, personality, and brand elements. That knowledge becomes the base it uses to work with you.',
			},
			{
				q: 'Does Kaiman work in Spanish?',
				a: 'Yes. You can use Kaiman Studio and this site in Spanish. There is also an English version.',
			},
			{
				q: 'How do credits work?',
				a: 'Credits are the platform’s unit of use. An ad image uses 1 credit. One second of edited video uses 3. Voice uses 2 credits per minute. The script generator currently does not charge credits.',
			},
			{
				q: 'Can I manage more than one brand or business from my account?',
				a: 'Yes, depending on the plan. Basic includes 1 brand. Premium includes up to 5 brands. Medium focuses on seats and credits for a small team.',
			},
			{
				q: 'What does the free trial include?',
				a: 'You can create an account and review the product. Trial length and credits are confirmed when you register on the platform.',
			},
			{
				q: 'Can I connect my social networks to Kaiman?',
				a: 'Yes. Kaiman can connect with Meta, TikTok, LinkedIn, and YouTube to help you organize and schedule publishing for the content you create.',
			},
		],
	},
	final: {
		title: 'Your business already has a lot to teach Kaiman.',
		body: 'Start by telling it who you are, what you do, and what you want to achieve. Kaiman will use that knowledge to help you do better marketing, more efficiently.',
		cta: 'Start your free trial',
		lines: [
			'You do not need to know marketing.',
			'You do not need to learn artificial intelligence.',
			'You only need to know your business.',
		],
	},
	footer: {
		rights: 'All rights reserved.',
		product: 'Product',
		resources: 'Resources',
		legal: 'Legal',
		how: 'How it works',
		brand: 'Brand Understanding',
		plans: 'Plans',
		faq: 'FAQ',
		playbooks: 'Playbooks',
		help: 'Help',
		privacy: 'Privacy policy',
		terms: 'Terms of service',
		contact: 'Contact',
		alerta: 'Alerta',
		instagram: 'Instagram',
		address: '535 5th Ave, New York NY 10017',
		email: 'hello@alertacreative.com',
		phone: '+1 (586) 202-4830',
		studio: 'Kaiman Studio',
		lead: 'Better marketing, built around your business.',
		cta: 'Start your free trial',
		backTop: 'Back to top',
	},
	privacy: {
		title: 'Privacy',
		body: 'This page describes the Kaiman product. It does not install third-party advertising. Account data is managed at app.kaimanstudio.ai. For a data request, write to hello@alertacreative.com.',
	},
	terms: {
		title: 'Terms',
		body: 'The plans, credits, and seats described here summarize the public Kaiman Studio offer. Signup and payment are completed on the platform. For contract terms, write to hello@alertacreative.com.',
	},
	notFound: {
		title: 'This page is not here',
		body: 'The link does not match a section of this landing.',
		cta: 'Back to home',
	},
} satisfies LandingCopy;
