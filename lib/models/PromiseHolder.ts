export class PromiseHolder<T>{
	private promise: Promise<T>
	private resolve: Function

	constructor() {
		this.Setup()
	}

	public Setup() {
		this.promise = new Promise(resolve => this.resolve = resolve)
	}

	public async AwaitResult(): Promise<T> {
		return await this.promise
	}

	public Resolve(result?: T) {
		this.resolve(result)
	}
}