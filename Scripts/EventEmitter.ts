interface IEventEmitter
{
	on(eventName: string, callback: (...args: any[]) => void) : IEventEmitter;
	emit(eventName: string, ...args: any[]);
	off?(eventName: string, exCallback?: Function);
}

class EventEmitter implements IEventEmitter {
	protected events: { [event: string]: Function[] } = {};
		
	on(event: string, fn: (...args: any[]) => void) {
		if (!this.events[event]) this.events[event] = [];
		this.events[event].push(fn);
			
		return this;
	}

	emit(event: string, ...args: any[]) {
		if (!this.events[event] || this.events[event].length === 0) return;

		for (var i = 0; i < this.events[event].length; i++) {
			var fn = this.events[event][i];
			fn.apply(this, args);
		}
	}

	off(event: string, fn?: Function) {
		if (!this.events[event] || this.events[event].length === 0) return;

		if (!fn) {
			delete this.events[event];
			return;
		}

		var fnIdx = this.events[event].indexOf(fn);

		if (fnIdx === -1) return;

		this.events[event].splice(fnIdx, 1);

		if (this.events[event].length === 0) delete this.events[event];
	}
}