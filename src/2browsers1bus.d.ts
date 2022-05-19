export declare namespace tbob {
    export class serviceBus {
        private static instance;
        static getInstance(): serviceBusBase;
        static setExceptionHandlerCallback(callback: Function): void;
        static listenFor(eventName: string, callback: Function): void;
        static fireEvent(eventName: string, arg: any, single: boolean): void;
        static cleanUpStorage(): void;
    }
    class serviceBusBase {
        private _store;
        private _serviceBusPrefix;
        private _listeningForList;
        private _heardEvents;
        private _cleanupDelay;
        private exceptionHandler;
        constructor();
        private init;
        setExceptionHandlerCallback(callback: Function): void;
        private handleException;
        listenFor(eventName: string, callback: Function): void;
        fireEvent(eventName: string, arg: any, single: boolean): void;
        cleanUpStorage(): void;
        private listen;
        private storageCleanup;
        private getKeyForEventName;
        private timestamp;
        private newGuid;
        private logError;
    }
    export {};
}
