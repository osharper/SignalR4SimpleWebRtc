var EventEmitter = (function () {
    function EventEmitter() {
        this.events = {};
    }
    EventEmitter.prototype.on = function (event, fn) {
        if (!this.events[event])
            this.events[event] = [];
        this.events[event].push(fn);
        return this;
    };
    EventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this.events[event] || this.events[event].length === 0)
            return;
        for (var i = 0; i < this.events[event].length; i++) {
            var fn = this.events[event][i];
            fn.apply(this, args);
        }
    };
    EventEmitter.prototype.off = function (event, fn) {
        if (!this.events[event] || this.events[event].length === 0)
            return;
        if (!fn) {
            delete this.events[event];
            return;
        }
        var fnIdx = this.events[event].indexOf(fn);
        if (fnIdx === -1)
            return;
        this.events[event].splice(fnIdx, 1);
        if (this.events[event].length === 0)
            delete this.events[event];
    };
    return EventEmitter;
}());
//# sourceMappingURL=EventEmitter.js.map