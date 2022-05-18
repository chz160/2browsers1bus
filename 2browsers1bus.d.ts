declare namespace tbob {
	interface serviceBus {
		setExceptionHandlerCallback(callback: Function): void;
        listenFor(eventName: string, callback: Function): void;
        fireEvent(eventName: string, arg: any, single: boolean): void;
        cleanUpStorage(): void;
	}
}
export = tbob;