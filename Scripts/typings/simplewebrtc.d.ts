/* SimpleWebRtc typings */


interface SimpleWebRTC {
	new (config: ISimpleWebRTCConfig): SimpleWebRTC;

	/*
		the webrtcSupport object that describes browser capabilities, for convenience
	*/
	capabilities: any;

	/*
		the configuration options extended from options passed to the constructor
	*/
	config: ISimpleWebRTCConfig;

	/*
		the socket (or alternate) signaling connection
	*/
	connection: ISignallingConnection;

	/*
		the underlying WebRTC session manager
	*/
	webrtc: any;

	on(event: string, fn: (...args: any[]) => void);

	startLocalVideo();
    stopLocalVideo();

    createRoom(roomId: string, cb?: (err: any, name: string) => void);
	joinRoom(roomId: string, cb?: (err: string, roomDescription: { name: string, clients: any[] }) => void);
    leaveRoom();

    getLocalScreen();
    shareScreen(cb: (err: any) => void);
    stopScreenShare();

    getDomId(peer: any);
}

declare var SimpleWebRTC: SimpleWebRTC;

interface ISimpleWebRTCConfig {
	/*
		url for signaling server.
		Defaults to signaling server URL which can be used for development.
		You must use your own signaling server for production.
	*/
	url?: string;

	/*
		object to be passed as options to the signaling server connection
	*/
	socketio?: any; 

	/*
		connection object for signaling. Defaults to a new SocketIoConnection
	*/
	connection?: ISignallingConnection;

	/*
		flag to set the instance to debug mode
	*/
    debug?: boolean;

    detectSpeakingEvents: boolean;

	/*
		ID or Element to contain the local video element
	*/
	localVideoEl?: string | HTMLElement;

	/*
		ID or Element to contain the remote video elements
	*/
	remoteVideosEl?: string | HTMLElement;

	/*
		option to automatically request user media.
		Use `true` to request automatically, or `false` to request media later with `startLocalVideo`
	*/
	autoRequestMedia?: boolean;

    autoAdjustMic: boolean;

	/*
		option to enable/disable data channels (used for volume levels or direct messaging)
	*/
	enableDataChannels?: boolean;

	/*
		option to automatically remove video elements when streams are stopped.
	*/
	autoRemoveVideos?: boolean;

	/*
		option to reduce peer volume when the local participant is speaking
	*/
	adjustPeerVolume?: boolean;

	/*
		value used in conjunction with `adjustPeerVolume`. Uses values between 0 and 1.
	*/
	peerVolumeWhenSpeaking?: boolean;

	/*
		media options to be passed to `getUserMedia`. Defaults to `{ video: true, audio: true } `.
		Valid configurations described [on MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
		with official spec [at w3c](http://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia).
	*/
	media?: { audio: boolean; video: boolean; };

	/*
		RTCPeerConnection options. Defaults to `{ offerToReceiveAudio: 1, offerToReceiveVideo: 1 }`.
	*/
	receiveMedia?: { offerToReceiveAudio: number, offerToReceiveVideo: number };

	/*
		options for attaching the local video stream to the page. Defaults to
		{
			autoplay: true, // automatically play the video stream on the page
			mirror: true, // flip the local video to mirror mode (for UX)
			muted: true // mute local video stream to prevent echo
		}
	*/
	localVideo?: { autoplay: boolean, mirror: boolean, muted: boolean }

	/*
		 alternate logger for the instance; any object that implements `log`, `warn`, and `error` methods.
	*/
	logger?: ILogger;
}

interface ISignallingConnection {
	/* A method to invoke `fn` when event `ev` is triggered */
	on(ev: string, fn: (...args:any[]) => void);

	/* A method to send/emit arbitrary arguments on the connection */
	emit(message: string, ...args: any[]);

	/* A method to get a unique session Id for the connection */
	getSessionid();

	/* A method to disconnect the connection */
	disconnect();
}

interface ILogger extends Console {
	error(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
}