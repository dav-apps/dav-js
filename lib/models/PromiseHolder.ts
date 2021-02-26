export class PromiseHolder<T>{
	promise: Promise<T>
	resolve: Function

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