﻿/// <reference path="./typings/jquery/jquery.d.ts"/>
/// <reference path="./typings/simplewebrtc.d.ts"/>
/// <reference path="./typings/signalr/signalr.d.ts"/>

// grab the room from the URL
var room = location.search && location.search.split('?')[1];
var webrtc: SimpleWebRTC = null;
var signalRSignalling = new SimpleWebRtcHub();

signalRSignalling.on('dumb_handler_that_will_never_fire', () => {
    // We have to assign some handler to hubProxy for initiating connection to it.
	// Real handlers could be added later at any time (even after connection is started)
	// http://stackoverflow.com/a/33001395/186607
    console.log('Dumb handler attached to hub before establishing the connection. This should never be fired');
});


$.hubConnection().start().done(() => {
    // create our webrtc connection
    var webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false,
        connection: signalRSignalling
    });

    // when it's ready, join if we got a room from the URL
    webrtc.on('readyToCall', function () {
        // you can name it anything
        if (room) webrtc.joinRoom(room);
    });
    function showVolume(el, volume) {
        if (!el) return;
        if (volume < -45) volume = -45; // -45 to -20 is
        if (volume > -20) volume = -20; // a good range
        el.value = volume;
    }

    // we got access to the camera
    webrtc.on('localStream', stream => {
        var button = document.querySelector('form>button');
        if (button) button.removeAttribute('disabled');
        $('#localVolume').show();
    });


    // we did not get access to the camera
    webrtc.on('localMediaError', err => {
    });

    // local screen obtained
    webrtc.on('localScreenAdded', video => {
        video.onclick = function () {
            video.style.width = video.videoWidth + 'px';
            video.style.height = video.videoHeight + 'px';
        };
        document.getElementById('localScreenContainer').appendChild(video);
        $('#localScreenContainer').show();
    });

    // local screen removed
    webrtc.on('localScreenRemoved', video => {
        document.getElementById('localScreenContainer').removeChild(video);
        $('#localScreenContainer').hide();
    });

    // a peer video has been added
    webrtc.on('videoAdded', (video, peer) => {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var container = document.createElement('div');
            container.className = 'videoContainer';
            container.id = 'container_' + webrtc.getDomId(peer);
            container.appendChild(video);

            // suppress contextmenu
            video.oncontextmenu = function () { return false; };

            // resize the video on click
            video.onclick = function () {
                container.style.width = video.videoWidth + 'px';
                container.style.height = video.videoHeight + 'px';
            };

            // show the remote volume
            var vol = document.createElement('meter');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume';
            vol.min = -45;
            vol.max = -20;
            vol.low = -40;
            vol.high = -25;
            container.appendChild(vol);

            // show the ice connection state
            if (peer && peer.pc) {
                var connstate = document.createElement('div');
                connstate.className = 'connectionstate';
                container.appendChild(connstate);
                peer.pc.on('iceConnectionStateChange', function (event) {
                    switch (peer.pc.iceConnectionState) {
                        case 'checking':
                            connstate.innerText = 'Connecting to peer...';
                            break;
                        case 'connected':
                        case 'completed': // on caller side
                            $(vol).show();
                            connstate.innerText = 'Connection established.';
                            break;
                        case 'disconnected':
                            connstate.innerText = 'Disconnected.';
                            break;
                        case 'failed':
                            connstate.innerText = 'Connection failed.';
                            break;
                        case 'closed':
                            connstate.innerText = 'Connection closed.';
                            break;
                    }
                });
            }
            remotes.appendChild(container);
        }
    });

    // a peer was removed
    webrtc.on('videoRemoved', (video, peer) => {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });

    // local volume has changed
    webrtc.on('volumeChange', (volume, treshold) => {
        showVolume(document.getElementById('localVolume'), volume);
    });

    // remote volume has changed
    webrtc.on('remoteVolumeChange', (peer, volume) => {
        showVolume(document.getElementById('volume_' + peer.id), volume);
    });

    // local p2p/ice failure
    webrtc.on('iceFailed', peer => {
        var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate') as HTMLElement;
        console.log('local fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
        }
    });

    // remote p2p/ice failure
    webrtc.on('connectivityError', peer => {
        var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate') as HTMLElement;
        console.log('remote fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
        }
    });

    // Since we use this twice we put it here
    function setRoom(name) {
        document.querySelector('form').remove();
        document.getElementById('title').innerText = 'Room: ' + name;
        document.getElementById('subTitle').innerText = 'Link to join: ' + location.href;
        $('body').addClass('active');
    }

    if (room) {
        setRoom(room);
    } else {
        $('form').submit(() => {
            var val = $('#sessionInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
            webrtc.createRoom(val, function (err, name) {
                console.log(' create room cb', arguments);

                var newUrl = location.pathname + '?' + name;
                if (!err) {
                    history.replaceState({ foo: 'bar' }, null, newUrl);
                    setRoom(name);
                } else {
                    console.log(err);
                }
            });
            return false;
        });
    }

    var button = document.getElementById('screenShareButton') as HTMLButtonElement,
        setButton = function (bool) {
            button.innerText = bool ? 'share screen' : 'stop sharing';
        };

    if (!webrtc.capabilities.supportScreenSharing) {
        button.disabled = true;
    }

    webrtc.on('localScreenRemoved', function () {
        setButton(true);
    });

    setButton(true);

    button.onclick = () => {
        if (webrtc.getLocalScreen()) {
            webrtc.stopScreenShare();
            setButton(true);
        } else {
            webrtc.shareScreen(err => {
                setButton(!!err);
            });
        }
    };
});