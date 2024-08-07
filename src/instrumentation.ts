

export async function register() {
	console.log("ABORT NAME", AbortSignal.name);
	const module = await import('./index')
	module.unity_hotreload().catch(console.error)
}
