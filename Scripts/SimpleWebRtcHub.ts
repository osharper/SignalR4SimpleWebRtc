/*
    Abstraction layer for signalR hub (in this case for VoiceChatHub)
    that implements EventEmitter pattern (socket.io alike and required by SimpleWebRTC#connection interface https://github.com/andyet/SimpleWebRTC#connection)

    Example: signalRSignalling.emit('join', roomId, cb)
    will invoke public virtual SimpleWebRtcHub.Join(string roomId) and pass the result into callback function.

    signalRSignalling.on('connect', cb)
    callback will be invoked on server method call (SimpleWebRtcHub.Clients.Caller.Connect()) with optional args provided by server code
*/
class SimpleWebRtcHub extends EventEmitter {
    private hubName = 'voiceChatHub';

    private hubProxy: HubProxy;

    constructor() {
        super();

        if (!$.connection[this.hubName]) {
            let connection = $.hubConnection();
            this.hubProxy = connection.createHubProxy(this.hubName);
        } else {
            this.hubProxy = $.connection[this.hubName];
        }
    }

    getSessionid() {
        return $.connection.hub.id;
    }
    disconnect() {
        this.emit("leave");
    }

    /// <summary>
    /// Subscribe to server-initiated invokes
    /// </summary>
    on(hubAction: string, callback: (...args: any[]) => void) {
        // normalize to PascalCase for logging and due to the fact that signalR itself is case insensitive
        hubAction = hubAction.charAt(0).toUpperCase() + hubAction.substr(1, hubAction.length - 1);

        // handlers are invoking in processServerInvoke function, so we need just one handler at hubProxy
        if (!this.events[hubAction]) {
            this.hubProxy.on(hubAction, (...hubArgs: any[]) => {
                this.processServerInvoke(hubAction, hubArgs);
            });
        }

        super.on(hubAction, callback);

        return this;
    }

    protected processServerInvoke(hubAction: string, hubArgs: any[]) {
        var handlers = this.events[hubAction];
        if (!handlers || !handlers.length) return;

        for (let idx = 0; idx < handlers.length; idx++) {
            var handler = handler[idx];

            try {
                handler.apply(this, hubArgs);
            } catch (e) {
                var errorData = e && { errorMessage: e["message"], stack: e["stack"] };
                console.error(`${hubAction} failed`, errorData);
            }
        }
    }

    /// <summary>
    /// Invoke method on the server.
    /// In case last argument is a function, it would be used as a callback (err, res) => void. But it's better to use promise.
    /// </summary>
    emit(message: string, ...args: any[]) {
        var callback = () => { };

        if (args.length) {
            // if we have the callback fn passed to emit call, splice it from args and fire it on done
            const hasCallback = typeof args[args.length - 1] == "function";
            if (hasCallback) {
                callback = args[args.length - 1];
                args.splice(args.length - 1);
            }
        }

        // get message back to args
        args.unshift(message);

        return (this.hubProxy.invoke.apply(this.hubProxy, args) as JQueryDeferred<any>)
            .done((result: any) => {
                callback.apply(this, [null, result]);
            }).fail((err) => {
                // callback is in standart js-notation function(err: Error, result?: any)
                callback.apply(this, [err]);
            });
    }

    off(event?: string, callback?: Function) {
        var unbind = (ev: string, cb?: Function) => {
            super.off(ev, cb);

            // if there's no event handlers left, unbind from hub proxy
            if (!this.events[ev]) this.hubProxy.off(ev, undefined); // wrong d.ts, see jquery.signalR-2.2.0.js:2645, we can call hubProxy.off without specifying callback
        };

        if (event) {
            unbind(event, callback);
            return;
        }

        $.each(this.events, (ev, cb) => { unbind(ev); });
    }
}